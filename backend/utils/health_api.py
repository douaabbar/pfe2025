import os
import json
import logging
import requests
import feedparser
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from flask import current_app
from urllib.parse import urljoin, urlencode
from typing import List, Dict, Any
from dotenv import load_dotenv
from functools import lru_cache
import brotli  # Ensure brotli is imported

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
MEDLINEPLUS_API_URL = "https://connect.medlineplus.gov/service"
PUBMED_API_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=health"
WHO_RSS_URL = "https://www.who.int/rss-feeds/news-english.xml"  # Updated to use RSS feed instead of HTML page
CDC_RSS_URL = "https://tools.cdc.gov/api/v2/resources/media/415620.rss"  # Updated CDC RSS URL
NIH_RSS_URL = "https://directorsblog.nih.gov/feed/"

# Cache configuration
CACHE_DURATION = 3600  # 1 hour in seconds

# Updated French health sources - use the working RSS feeds provided by the user
FRENCH_HEALTH_SOURCES = [
    {
        "name": "Haute Autorité de Santé",
        "url": "https://www.has-sante.fr/jcms/c_1000080/fr/rss",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "Ministère de la Santé",
        "url": "https://sante.gouv.fr/?page=backend",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "INSERM",
        "url": "https://www.inserm.fr/feed/",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "Santé Publique France",
        "url": "https://www.santepubliquefrance.fr/flux-rss",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "HAS Flux Information",
        "url": "https://www.has-sante.fr/jcms/c_1771214/fr/nos-flux-d-information-rss",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "Le Monde Santé",
        "url": "https://www.lemonde.fr/sante/rss_full.xml",
        "reliable": True,
        "verify_ssl": True
    },
    {
        "name": "INSERM RSS",
        "url": "https://www.inserm.fr/flux-rss/",
        "reliable": True,
        "verify_ssl": True
    }
]

# API Keys
PUBMED_API_KEY = os.getenv('PUBMED_API_KEY')
if not PUBMED_API_KEY:
    logger.warning("PUBMED_API_KEY not found in environment variables, PubMed API may have limited functionality")
    # But still allow it to work with limited functionality

class HealthAPIError(Exception):
    """Custom exception for health API errors"""
    pass

async def fetch_url(session: aiohttp.ClientSession, url: str, headers: Dict = None, verify_ssl: bool = True) -> str:
    """Fetch URL with timeout and retries"""
    retries = 3
    # Increase timeout to 30 seconds to accommodate slower sources
    timeout = aiohttp.ClientTimeout(total=30, connect=10)
    
    if headers is None:
        # Default headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',  # Remove 'br' to avoid brotli compression issues
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    # Configure custom TCP connector with increased header size limit
    connector = aiohttp.TCPConnector(
        verify_ssl=verify_ssl,
        limit=100,
        limit_per_host=10,
    )
    
    client_session = None
    try:
        # Create a new session with custom connector if one wasn't provided
        if session is None:
            client_session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=headers,
                # Increase max header size to 16KB (default is 8KB)
                read_bufsize=16*1024
            )
            session_to_use = client_session
        else:
            session_to_use = session
        
        for i in range(retries):
            try:
                # SSL verification can be disabled for problematic sites
                ssl_context = None if verify_ssl else False
                logger.info(f"Fetching URL: {url} (Attempt {i+1}/{retries})")
                
                async with session_to_use.get(url, 
                                headers=headers, 
                                timeout=timeout, 
                                ssl=ssl_context,
                                max_line_size=16*1024,  # Increase max header line size 
                                read_bufsize=16*1024) as response:  # Increase read buffer size
                    response.raise_for_status()
                    
                    # Handle content encoding
                    content_encoding = response.headers.get('Content-Encoding', '').lower()
                    if 'br' in content_encoding:
                        # Handle brotli encoding if present
                        try:
                            content_bytes = await response.read()
                            content = brotli.decompress(content_bytes).decode('utf-8', errors='replace')
                        except Exception as e:
                            logger.warning(f"Failed to decompress brotli content: {str(e)}")
                            # Try to read as text even if brotli decompression failed
                            content = await response.text(errors='replace')
                    else:
                        # Standard text response
                        content = await response.text(errors='replace')
                    
                    logger.info(f"Successfully fetched URL: {url} - Status: {response.status}")
                    return content
                    
            except aiohttp.ClientResponseError as e:
                logger.error(f"HTTP error for {url}: Status {e.status}, {str(e)}")
                if i == retries - 1:
                    raise
            except aiohttp.ClientSSLError as e:
                logger.error(f"SSL error for {url}: {str(e)}")
                # Try one more time with SSL verification disabled if it was initially enabled
                if verify_ssl and i == retries - 1:
                    logger.info(f"Retrying {url} with SSL verification disabled")
                    try:
                        async with session_to_use.get(url, headers=headers, timeout=timeout, ssl=False) as response:
                            response.raise_for_status()
                            content = await response.text(errors='replace')
                            logger.info(f"Successfully fetched URL with SSL disabled: {url}")
                            return content
                    except Exception as inner_e:
                        logger.error(f"Failed even with SSL disabled: {str(inner_e)}")
                        raise e
                else:
                    raise
            except aiohttp.ClientError as e:
                logger.error(f"Client error for {url}: {str(e)}")
                if i == retries - 1:
                    raise
            except asyncio.TimeoutError as e:
                logger.error(f"Timeout error for {url}: {str(e)}")
                if i == retries - 1:
                    raise
            except Exception as e:
                logger.error(f"Unexpected error for {url}: {str(e)}")
                if i == retries - 1:
                    raise
            
            # Wait before retrying, with incremental backoff
            await asyncio.sleep(1 * (i + 1))
        
        # If we get here, all retries failed
        raise HealthAPIError(f"Failed to fetch URL after {retries} attempts: {url}")
        
    finally:
        # Close the client session if we created it
        if client_session is not None:
            await client_session.close()

@lru_cache(maxsize=100)
def get_cached_articles(category: str, language: str, timestamp: str) -> List[Dict[str, Any]]:
    """Cache wrapper for get_health_articles"""
    return asyncio.run(async_get_health_articles(category, language))

async def async_get_health_articles(category: str = 'all', language: str = 'en', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of get_health_articles"""
    articles = []
    errors = []
    
    try:
        # Define sources based on language
        if language == 'en':
            try:
                # Try to fetch from APIs first
                sources = [
                    ('MedlinePlus', get_medlineplus_articles),
                    ('PubMed', get_pubmed_articles),
                    ('WHO', get_who_articles),
                    ('CDC', get_cdc_articles),
                    ('NIH', get_nih_articles)
                ]

                # Create async tasks for all sources
                async with aiohttp.ClientSession() as session:
                    tasks = []
                    for source_name, source_func in sources:
                        task = asyncio.create_task(source_func(session, category, limit))
                        tasks.append((source_name, task))
                    
                    # Wait for all tasks to complete
                    for source_name, task in tasks:
                        try:
                            source_articles = await task
                            if source_articles:
                                for article in source_articles:
                                    article['source'] = source_name
                                articles.extend(source_articles)
                        except Exception as e:
                            logger.error(f"{source_name} error: {str(e)}")
                            errors.append(f"{source_name}: {str(e)}")
                
                # If no articles were fetched, use hardcoded English articles
                if not articles:
                    logger.warning("No articles fetched from APIs, using hardcoded English articles")
                    articles = get_hardcoded_english_articles(category)
            except Exception as e:
                logger.error(f"Error fetching from APIs: {str(e)}")
                articles = get_hardcoded_english_articles(category)
        else:
            # For French, fetch from real French health sources
            try:
                async with aiohttp.ClientSession() as session:
                    french_articles = await get_french_health_articles(session, category, limit)
                    articles.extend(french_articles)
            except Exception as e:
                logger.error(f"Error fetching French articles: {str(e)}")
                # Fallback to hardcoded French articles
                articles = get_hardcoded_french_articles(category, limit)
    except Exception as e:
        logger.error(f"Error in async_get_health_articles: {str(e)}")
        if language == 'en':
            articles = get_hardcoded_english_articles(category)
        else:
            articles = get_hardcoded_french_articles(category, limit)

    # Sort and limit articles
    articles.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return articles[:limit]

def get_hardcoded_english_articles(category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Return hardcoded English articles as a fallback"""
    english_articles = [
        {
            'id': 'en-1',
            'title': 'Healthy Eating Guidelines',
            'summary': 'Discover how a balanced diet can improve your overall health.',
            'content': '<h2>Basics of a Balanced Diet</h2><p>A healthy diet is essential for maintaining good health.</p>',
            'category': 'nutrition',
            'image_url': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.health.gov',
            'source_name': 'U.S. Department of Health & Human Services',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-2',
            'title': 'The Importance of Regular Physical Activity',
            'summary': 'Regular exercise is crucial for maintaining a healthy lifestyle.',
            'content': '<h2>Benefits of Physical Activity</h2><p>Regular physical activity offers numerous health benefits.</p>',
            'category': 'fitness',
            'image_url': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.cdc.gov/physicalactivity/',
            'source_name': 'Centers for Disease Control and Prevention',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-3',
            'title': 'Mental Health: Taking Care of Your Psychological Well-being',
            'summary': 'Mental health is just as important as physical health.',
            'content': '<h2>Strategies to Improve Your Mental Well-being</h2><p>Taking care of your mental health involves several daily practices.</p>',
            'category': 'mental_health',
            'image_url': 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.nimh.nih.gov',
            'source_name': 'National Institute of Mental Health',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-4',
            'title': 'Prevention of Seasonal Diseases',
            'summary': 'Learn how to strengthen your immune system and adopt good hygiene practices.',
            'content': '<h2>How to Protect Yourself Against Seasonal Diseases</h2><p>To reduce the risk of seasonal infections, adopt these preventive measures.</p>',
            'category': 'preventive_care',
            'image_url': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.cdc.gov/vaccines/',
            'source_name': 'Centers for Disease Control and Prevention',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-5',
            'title': 'Understanding and Managing Chronic Stress',
            'summary': 'Chronic stress can have harmful effects on your health.',
            'content': '<h2>Impact of Chronic Stress and Solutions</h2><p>Chronic stress can affect your health in various ways.</p>',
            'category': 'mental_health',
            'image_url': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.apa.org',
            'source_name': 'American Psychological Association',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-6',
            'title': 'The Benefits of Good Hydration',
            'summary': 'Water is essential for our body and our health. Discover why and how to stay well hydrated.',
            'content': '<h2>Why Hydration is Important</h2><p>Water represents about 60% of our body weight and plays a crucial role in almost all functions of our body.</p>',
            'category': 'general',
            'image_url': 'https://images.unsplash.com/photo-1560787313-5dff3307e257?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.mayoclinic.org',
            'source_name': 'Mayo Clinic',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'en-7',
            'title': 'Sleep Well to Stay Healthy',
            'summary': 'Sleep is an essential pillar of our health. Discover best practices to improve your sleep.',
            'content': '<h2>The Importance of Sleep</h2><p>Quality sleep is as important for our health as diet and physical activity.</p>',
            'category': 'general',
            'image_url': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.sleepfoundation.org',
            'source_name': 'National Sleep Foundation',
            'created_at': datetime.utcnow().isoformat()
        }
    ]
    
    # Filter by category if needed
    if category != 'all':
        filtered_articles = [a for a in english_articles if a['category'] == category]
    else:
        filtered_articles = english_articles
        
    logger.info(f"Returning {len(filtered_articles[:limit])} hardcoded English articles for category: {category}")
    return filtered_articles[:limit]

def get_health_articles(category: str = 'all', language: str = 'en', limit: int = 10) -> List[Dict[str, Any]]:
    """Get health articles with caching and error handling"""
    try:
        # Use the current hour as timestamp for cache key
        timestamp = datetime.utcnow().strftime("%Y-%m-%d-%H")
        
        # Try to get articles from cache first
        try:
            articles = get_cached_articles(category, language, timestamp)
            if articles and len(articles) >= limit:
                return articles[:limit]
        except Exception as cache_error:
            logger.error(f"Cache error: {str(cache_error)}")
            # Continue to hardcoded articles if cache fails
        
        # Use hardcoded articles as a fallback
        if language == 'en':
            logger.info(f"Using hardcoded English articles for {category}")
            return get_hardcoded_english_articles(category, limit)
        else:
            logger.info(f"Using fallback French articles for {category}")
            # Run the async function in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                articles = loop.run_until_complete(get_french_health_articles(None, category, limit))
                loop.close()
                return articles
            except Exception as e:
                logger.error(f"Error getting French articles: {str(e)}")
                # Return an empty list as last resort
                return []
    except Exception as e:
        logger.error(f"Error in get_health_articles: {str(e)}")
        # Always return some articles instead of raising an error
        if language == 'en':
            return get_hardcoded_english_articles(category, limit)
        else:
            # Fallback to empty list if everything fails
            return []

def parse_feed_safely(url: str, source_name: str) -> feedparser.FeedParserDict:
    """Safely parse RSS feed with proper encoding and error handling"""
    try:
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # First try to get the raw content with proper encoding
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Try to detect the encoding, fallback to UTF-8
        encoding = response.encoding or 'utf-8'
        
        # Parse the feed with the detected encoding
        feed = feedparser.parse(response.content.decode(encoding))
        
        if feed.bozo and feed.bozo_exception:
            logger.error(f"Warning parsing {source_name} feed: {feed.bozo_exception}")
            
        # Check if we got any entries despite possible warnings
        if not feed.entries:
            raise HealthAPIError(f"No entries found in {source_name} feed")
            
        return feed
    except Exception as e:
        logger.error(f"Error fetching/parsing {source_name} feed: {str(e)}")
        raise HealthAPIError(f"{source_name} feed error: {str(e)}")

async def get_medlineplus_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of MedlinePlus article fetching"""
    try:
        # Map categories to search terms
        category_mapping = {
            'general': ['health', 'medical conditions'],
            'nutrition': ['nutrition', 'diet', 'healthy eating'],
            'fitness': ['exercise', 'physical activity', 'fitness'],
            'mental_health': ['mental health', 'depression', 'anxiety'],
            'preventive_care': ['prevention', 'screening', 'wellness']
        }

        search_terms = category_mapping.get(category, ['health'])
        query = ' OR '.join(search_terms) if category != 'all' else 'health'

        params = {
            'mainSearchCriteria.v.cs': 'health topic',
            'mainSearchCriteria.v.c': query,
            'knowledgeResponseType': 'application/json',
            'maxResults': str(limit * 2)
        }

        url = f"{MEDLINEPLUS_API_URL}?{urlencode(params)}"
        response_text = await fetch_url(session, url)
        data = json.loads(response_text)

        articles = []
        for result in data.get('feed', {}).get('entry', [])[:limit]:
            try:
                # Get basic article info without fetching full content
                article = {
                    'id': result.get('id', {}).get('_value', ''),
                    'title': result.get('title', {}).get('_value', '').strip(),
                    'summary': result.get('summary', {}).get('_value', '')[:200] + '...',
                    'category': category,
                    'source_url': next((link['href'] for link in result.get('link', []) 
                                     if link.get('rel') == 'alternate'), ''),
                    'source_name': 'MedlinePlus',
                    'created_at': result.get('updated', {}).get('_value', datetime.utcnow().isoformat())
                }
                
                if article['source_url']:
                    articles.append(article)
                
                if len(articles) >= limit:
                    break

            except Exception as e:
                logger.warning(f"Error processing MedlinePlus article: {str(e)}")
                continue

        return articles

    except Exception as e:
        logger.error(f"Error fetching MedlinePlus articles: {str(e)}")
        return []

async def get_pubmed_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of PubMed article fetching"""
    try:
        # Map categories to PubMed search terms
        category_mapping = {
            'general': ['health', 'medicine'],
            'nutrition': ['nutrition', 'diet', 'food'],
            'fitness': ['exercise', 'physical activity', 'fitness'],
            'mental_health': ['mental health', 'psychology', 'psychiatry'],
            'preventive_care': ['prevention', 'screening', 'public health']
        }

        search_terms = category_mapping.get(category, ['health'])
        query = ' OR '.join(search_terms) if category != 'all' else 'health'

        # First search for IDs - use proper URL construction
        search_params = {
            'db': 'pubmed',
            'term': query,
            'retmax': str(limit),
            'sort': 'date',
            'api_key': PUBMED_API_KEY if PUBMED_API_KEY else None,
            'retmode': 'json'
        }
        
        # Remove None values
        search_params = {k: v for k, v in search_params.items() if v is not None}

        # Use a properly constructed URL
        esearch_base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_url = f"{esearch_base}?{urlencode(search_params)}"
        
        search_response = await fetch_url(session, search_url)
        search_data = json.loads(search_response)

        if 'esearchresult' not in search_data or 'idlist' not in search_data['esearchresult']:
            logger.warning("No valid PubMed search results found")
            return []

        pmids = search_data['esearchresult']['idlist']
        if not pmids:
            logger.warning("No PubMed IDs found in search results")
            return []

        # Then fetch summaries
        summary_params = {
            'db': 'pubmed',
            'id': ','.join(pmids),
            'retmode': 'json',
            'api_key': PUBMED_API_KEY if PUBMED_API_KEY else None
        }
        
        # Remove None values
        summary_params = {k: v for k, v in summary_params.items() if v is not None}

        # Use a properly constructed URL
        esummary_base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_url = f"{esummary_base}?{urlencode(summary_params)}"
        
        summary_response = await fetch_url(session, summary_url)
        summary_data = json.loads(summary_response)

        articles = []
        for pmid in pmids:
            try:
                result = summary_data['result'][pmid]
                
                # Get the abstract if available
                abstract = result.get('abstract', '')
                if not abstract:
                    continue

                article = {
                    'id': pmid,
                    'title': result.get('title', '').strip(),
                    'summary': abstract[:200] + '...' if len(abstract) > 200 else abstract,
                    'category': category,
                    'source_url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    'source_name': 'PubMed',
                    'created_at': result.get('sortpubdate', datetime.utcnow().isoformat())
                }
                
                articles.append(article)
                
                if len(articles) >= limit:
                    break

            except Exception as e:
                logger.warning(f"Error processing PubMed article {pmid}: {str(e)}")
                continue

        return articles

    except Exception as e:
        logger.error(f"Error in PubMed articles function: {str(e)}")
        return []

async def get_who_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of WHO article fetching"""
    try:
        feed = await fetch_feed_safely(session, WHO_RSS_URL, "WHO")
        
        # Map categories to WHO topics
        category_mapping = {
            'general': ['health', 'disease', 'medical'],
            'nutrition': ['nutrition', 'food', 'diet'],
            'fitness': ['physical activity', 'exercise'],
            'mental_health': ['mental health', 'psychological'],
            'preventive_care': ['prevention', 'vaccine', 'surveillance']
        }
        
        keywords = category_mapping.get(category, ['health'])
        
        articles = []
        for entry in feed.entries:
            if category != 'all':
                title_desc = f"{entry.title} {entry.description}".lower()
                matches_category = any(keyword.lower() in title_desc for keyword in keywords)
                if not matches_category:
                    continue
            
            # Get the summary and ensure we have a valid link
            summary = entry.get('summary', entry.get('description', ''))
            source_url = entry.get('link', '')
            if not source_url:
                continue
            
            # Extract image URL if available
            image_url = ''
            # Look for media content
            if hasattr(entry, 'media_content') and entry.media_content:
                for media in entry.media_content:
                    if isinstance(media, dict) and 'url' in media:
                        image_url = media['url']
                        break
            
            # Look for enclosure links
            if not image_url and hasattr(entry, 'links'):
                for link in entry.links:
                    if link.get('rel') == 'enclosure' and link.get('type', '').startswith('image/'):
                        image_url = link.get('href', '')
                        break
            
            # Look for image field
            if not image_url and hasattr(entry, 'image') and hasattr(entry.image, 'href'):
                image_url = entry.image.href
            
            # Parse date
            published_date = datetime.utcnow()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published_date = datetime(*entry.updated_parsed[:6])
            
            article = {
                'id': entry.get('id', entry.link),
                'title': entry.title.strip(),
                'summary': summary[:200].strip() + '...' if len(summary) > 200 else summary.strip(),
                'category': category,
                'image_url': image_url,
                'source_url': source_url,
                'read_more_url': source_url,
                'source_name': 'World Health Organization',
                'created_at': published_date.isoformat()
            }
            
            articles.append(article)
            if len(articles) >= limit:
                break
        
        return articles
    except Exception as e:
        logger.error(f"Error fetching WHO articles: {str(e)}")
        return []

async def get_cdc_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of CDC article fetching"""
    try:
        feed = await fetch_feed_safely(session, CDC_RSS_URL, "CDC")
        
        # Map categories to CDC topics
        category_mapping = {
            'general': ['health', 'disease', 'medical'],
            'nutrition': ['nutrition', 'food', 'diet'],
            'fitness': ['physical activity', 'exercise'],
            'mental_health': ['mental health', 'psychological'],
            'preventive_care': ['prevention', 'vaccine', 'screening']
        }
        
        keywords = category_mapping.get(category, ['health'])
        
        articles = []
        for entry in feed.entries:
            if category != 'all':
                title_desc = f"{entry.title} {entry.description}".lower()
                matches_category = any(keyword.lower() in title_desc for keyword in keywords)
                if not matches_category:
                    continue
            
            # Get the summary
            summary = entry.get('summary', entry.get('description', ''))
            source_url = entry.get('link', '')
            if not source_url:
                continue
            
            # Extract image URL if available
            image_url = ''
            # Look for media content
            if hasattr(entry, 'media_content') and entry.media_content:
                for media in entry.media_content:
                    if isinstance(media, dict) and 'url' in media:
                        image_url = media['url']
                        break
            
            # Look for enclosure links
            if not image_url and hasattr(entry, 'links'):
                for link in entry.links:
                    if link.get('rel') == 'enclosure' and link.get('type', '').startswith('image/'):
                        image_url = link.get('href', '')
                        break
            
            # Look for image field
            if not image_url and hasattr(entry, 'image') and hasattr(entry.image, 'href'):
                image_url = entry.image.href
                
            # Parse date
            published_date = datetime.utcnow()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published_date = datetime(*entry.updated_parsed[:6])
            
            article = {
                'id': entry.get('id', entry.link),
                'title': entry.title.strip(),
                'summary': summary[:200].strip() + '...' if len(summary) > 200 else summary.strip(),
                'category': category,
                'image_url': image_url,
                'source_url': source_url,
                'read_more_url': source_url,
                'source_name': 'Centers for Disease Control and Prevention',
                'created_at': published_date.isoformat()
            }
            
            articles.append(article)
            if len(articles) >= limit:
                break
        
        return articles
    except Exception as e:
        logger.error(f"Error fetching CDC articles: {str(e)}")
        return []

async def get_nih_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Async version of NIH article fetching"""
    try:
        feed = await fetch_feed_safely(session, NIH_RSS_URL, "NIH")
        
        # Map categories to NIH topics
        category_mapping = {
            'general': ['health', 'medical', 'research'],
            'nutrition': ['nutrition', 'diet', 'food'],
            'fitness': ['exercise', 'physical activity'],
            'mental_health': ['mental health', 'brain', 'psychological'],
            'preventive_care': ['prevention', 'screening', 'vaccine']
        }
        
        keywords = category_mapping.get(category, ['health'])
        
        articles = []
        for entry in feed.entries:
            if category != 'all':
                title_desc = f"{entry.title} {entry.description}".lower()
                matches_category = any(keyword.lower() in title_desc for keyword in keywords)
                if not matches_category:
                    continue
            
            # Get the summary and ensure we have a valid link
            summary = entry.get('summary', entry.get('description', ''))
            source_url = entry.get('link', '')
            if not source_url:
                continue
            
            # Extract image URL if available
            image_url = ''
            # Look for media content
            if hasattr(entry, 'media_content') and entry.media_content:
                for media in entry.media_content:
                    if isinstance(media, dict) and 'url' in media:
                        image_url = media['url']
                        break
            
            # Look for enclosure links
            if not image_url and hasattr(entry, 'links'):
                for link in entry.links:
                    if link.get('rel') == 'enclosure' and link.get('type', '').startswith('image/'):
                        image_url = link.get('href', '')
                        break
            
            # Look for image field
            if not image_url and hasattr(entry, 'image') and hasattr(entry.image, 'href'):
                image_url = entry.image.href
            
            # Look in content for image (NIH specific)
            if not image_url and hasattr(entry, 'content') and entry.content:
                try:
                    content_value = entry.content[0].value
                    soup = BeautifulSoup(content_value, 'html.parser')
                    img_tag = soup.find('img')
                    if img_tag and img_tag.has_attr('src'):
                        image_url = img_tag['src']
                except (IndexError, AttributeError, KeyError) as e:
                    logger.warning(f"Error extracting image from NIH content: {str(e)}")
            
            # Parse date
            published_date = datetime.utcnow()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published_date = datetime(*entry.updated_parsed[:6])
            
            article = {
                'id': entry.get('id', entry.link),
                'title': entry.title.strip(),
                'summary': summary[:200].strip() + '...' if len(summary) > 200 else summary.strip(),
                'category': category,
                'image_url': image_url,
                'source_url': source_url,
                'read_more_url': source_url,
                'source_name': 'National Institutes of Health',
                'created_at': published_date.isoformat()
            }
            
            articles.append(article)
            if len(articles) >= limit:
                break
        
        return articles
    except Exception as e:
        logger.error(f"Error fetching NIH articles: {str(e)}")
        return []

async def fetch_feed_safely(session: aiohttp.ClientSession, url: str, source_name: str) -> feedparser.FeedParserDict:
    """Safely fetch and parse an RSS feed with robust error handling"""
    try:
        # Fetch the content
        content = await fetch_url(session, url)
        
        # First try parsing the feed as-is
        feed = feedparser.parse(content)
        
        # Check if there was a parsing error
        if feed.bozo and feed.bozo_exception:
            logger.warning(f"Warning parsing {source_name} feed: {feed.bozo_exception}")
            
            # If it's an XML parsing error, try to clean the content
            if "SAXParseException" in str(type(feed.bozo_exception)) or "not well-formed" in str(feed.bozo_exception):
                logger.info(f"Attempting to clean XML for {source_name}")
                
                # More aggressive XML cleaning
                try:
                    # Clean XML content using BeautifulSoup to sanitize
                    soup = BeautifulSoup(content, 'lxml-xml')
                    cleaned_content = str(soup)
                    
                    # Additional cleaning for common XML issues
                    cleaned_content = cleaned_content.replace('&', '&amp;') \
                                                   .replace('&amp;amp;', '&amp;') \
                                                   .replace('\x00', '') \
                                                   .replace('\x1A', '')
                    
                    # Try to parse the cleaned content
                    feed = feedparser.parse(cleaned_content)
                    
                    # Still have issues? Try the most permissive parser
                    if feed.bozo and not feed.entries:
                        logger.info(f"Using permissive HTML parser for {source_name}")
                        soup = BeautifulSoup(content, 'html.parser')
                        feed = feedparser.parse(str(soup))
                except Exception as clean_error:
                    logger.error(f"Error cleaning XML for {source_name}: {str(clean_error)}")
        
        # Check if we got any entries despite possible warnings
        if not feed.entries:
            # Return empty feed instead of raising an error
            logger.warning(f"No entries found in {source_name} feed")
            return feedparser.FeedParserDict({
                'bozo': True,
                'entries': [],
                'feed': {'title': source_name}
            })
            
        return feed
    except Exception as e:
        logger.error(f"Error fetching/parsing feed from {url} ({source_name}): {str(e)}")
        # Return an empty feed instead of raising an error
        return feedparser.FeedParserDict({
            'bozo': True,
            'entries': [],
            'feed': {'title': source_name}
        })

async def get_french_health_articles(session: aiohttp.ClientSession, category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch real French health articles from RSS feeds"""
    try:
        logger.info(f"Fetching French health articles for category: {category}")
        
        # Create a new session if none was provided
        close_session = False
        if session is None:
            session = aiohttp.ClientSession()
            close_session = True
            
        try:
            # Map categories to French keywords
            category_mapping = {
                    'general': ['santé', 'médecine', 'médical', 'bien-être'],
                    'nutrition': ['nutrition', 'alimentation', 'régime', 'diète'],
                    'fitness': ['exercice', 'sport', 'activité physique', 'fitness'],
                    'mental_health': ['santé mentale', 'psychologie', 'anxiété', 'dépression'],
                    'preventive_care': ['prévention', 'vaccin', 'dépistage', 'hygiène']
            }
            
            keywords = category_mapping.get(category, ['santé'])
            
            # Create tasks to fetch from all sources
            tasks = []
            for source in FRENCH_HEALTH_SOURCES:
                tasks.append(asyncio.create_task(
                    fetch_french_source(session, source, keywords, category)
                ))
            
            # Gather all results
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            all_articles = []
            for result in results:
                if isinstance(result, list) and result:
                    all_articles.extend(result)
                elif isinstance(result, Exception):
                    logger.warning(f"Error fetching French source: {str(result)}")
            
            # If we got no articles from real sources, use hardcoded fallback
            if not all_articles:
                logger.warning("No French articles fetched from real sources, using fallback")
                return get_hardcoded_french_articles(category, limit)
            
            # Sort articles by date, newest first
            all_articles.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            logger.info(f"Successfully fetched {len(all_articles[:limit])} French articles from real sources")
            return all_articles[:limit]
            
        finally:
            # Close the session if we created it
            if close_session:
                await session.close()
    
    except Exception as e:
        logger.error(f"Error in get_french_health_articles: {str(e)}")
        # Return hardcoded articles as fallback
        return get_hardcoded_french_articles(category, limit)

async def fetch_french_source(session: aiohttp.ClientSession, source: Dict, keywords: List[str], category: str) -> List[Dict[str, Any]]:
    """Fetch and process articles from a single French source"""
    try:
        logger.info(f"Fetching from French source: {source['name']}")
        
        # Fetch feed
        feed = await fetch_feed_safely(session, source['url'], source['name'])
        
        if not feed or not feed.entries:
            return []
            
        articles = []
        for entry in feed.entries[:20]:  # Process up to 20 entries per source
            try:
                # Check if entry matches category
                if category != 'all':
                    title_desc = f"{entry.get('title', '')} {entry.get('description', '')}".lower()
                    matches_category = any(keyword.lower() in title_desc for keyword in keywords)
                    if not matches_category:
                        continue
                
                # Get summary and link
                title = entry.get('title', '').strip()
                summary = entry.get('summary', entry.get('description', ''))
                link = entry.get('link', '')
                
                # Clean summary to remove HTML tags
                soup = BeautifulSoup(summary, 'html.parser')
                summary_text = soup.get_text()
                
                # Extract image if available
                image_url = ''
                if hasattr(entry, 'media_content') and entry.media_content:
                    for media in entry.media_content:
                        if isinstance(media, dict) and 'url' in media:
                            image_url = media['url']
                            break
                
                # Try to find image in content if not found
                if not image_url and hasattr(entry, 'content') and entry.content:
                    try:
                        content_value = entry.content[0].value
                        soup = BeautifulSoup(content_value, 'html.parser')
                        img_tag = soup.find('img')
                        if img_tag and img_tag.has_attr('src'):
                            image_url = img_tag['src']
                    except (IndexError, AttributeError):
                        pass
                
                # Get publication date
                published_date = datetime.utcnow()
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_date = datetime(*entry.updated_parsed[:6])
                
                # Create article object
                article = {
                    'id': f"fr-{source['name'].lower().replace(' ', '-')}-{hash(title+link) % 10000}",
                    'title': title,
                    'summary': summary_text[:200] + '...' if len(summary_text) > 200 else summary_text,
                    'content': summary,
                    'category': category,
                    'image_url': image_url,
                    'source_url': link,
                    'source_name': source['name'],
                    'created_at': published_date.isoformat()
                }
                
                articles.append(article)
                
            except Exception as entry_error:
                logger.warning(f"Error processing French entry: {str(entry_error)}")
                continue
            
        return articles
    except Exception as e:
        logger.error(f"Error fetching French source {source['name']}: {str(e)}")
        return []

def get_hardcoded_french_articles(category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Return hardcoded French articles as a fallback"""
    french_articles = [
        {
            'id': 'fr-1',
            'title': 'Conseils pour une alimentation saine',
            'summary': 'Découvrez comment une alimentation équilibrée peut améliorer votre santé générale.',
            'content': '<h2>Les bases d\'une alimentation équilibrée</h2><p>Une alimentation saine est essentielle pour maintenir un bon état de santé.</p>',
            'category': 'nutrition',
            'image_url': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.santepubliquefrance.fr',
            'source_name': 'Santé Publique France',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-2',
            'title': 'L\'importance de l\'activité physique régulière',
            'summary': 'L\'exercice régulier est crucial pour maintenir un mode de vie sain.',
            'content': '<h2>Les bienfaits de l\'activité physique</h2><p>L\'activité physique régulière offre de nombreux avantages pour la santé.</p>',
            'category': 'fitness',
            'image_url': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.mangerbouger.fr',
            'source_name': 'Manger Bouger',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-3',
            'title': 'Santé mentale: prendre soin de son bien-être psychologique',
            'summary': 'La santé mentale est aussi importante que la santé physique.',
            'content': '<h2>Stratégies pour améliorer votre bien-être mental</h2><p>Prendre soin de sa santé mentale implique plusieurs pratiques quotidiennes.</p>',
            'category': 'mental_health',
            'image_url': 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.psycom.org',
            'source_name': 'Psycom',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-4',
            'title': 'Prévention des maladies saisonnières',
            'summary': 'Apprenez comment renforcer votre système immunitaire et adopter de bonnes pratiques d\'hygiène.',
            'content': '<h2>Comment se protéger contre les maladies saisonnières</h2><p>Pour réduire les risques d\'infections saisonnières, adoptez ces mesures préventives.</p>',
            'category': 'preventive_care',
            'image_url': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://vaccination-info-service.fr',
            'source_name': 'Vaccination Info Service',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-5',
            'title': 'Comprendre et gérer le stress chronique',
            'summary': 'Le stress chronique peut avoir des effets néfastes sur votre santé.',
            'content': '<h2>Impact du stress chronique et solutions</h2><p>Le stress chronique peut affecter votre santé de diverses manières.</p>',
            'category': 'mental_health',
            'image_url': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=2070',
            'source_url': 'https://www.ameli.fr',
            'source_name': 'Ameli',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-6',
            'title': 'Les avantages d\'une bonne hydratation',
            'summary': 'L\'eau est essentielle pour notre organisme et notre santé. Découvrez pourquoi et comment bien s\'hydrater.',
            'content': '<h2>Pourquoi l\'hydratation est importante</h2><p>L\'eau représente environ 60% de notre poids corporel et joue un rôle crucial dans presque toutes les fonctions de notre organisme.</p>',
            'category': 'general',
            'image_url': 'https://images.unsplash.com/photo-1560787313-5dff3307e257?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'source_url': 'https://www.anses.fr',
            'source_name': 'ANSES',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'fr-7',
            'title': 'Bien dormir pour rester en bonne santé',
            'summary': 'Le sommeil est un pilier essentiel de notre santé. Découvrez les meilleures pratiques pour améliorer votre sommeil.',
            'content': '<h2>L\'importance du sommeil</h2><p>Un sommeil de qualité est aussi important pour notre santé que l\'alimentation et l\'activité physique.</p>',
            'category': 'general',
            'image_url': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'source_url': 'https://institut-sommeil-vigilance.org',
            'source_name': 'Institut National du Sommeil',
            'created_at': datetime.utcnow().isoformat()
        }
    ]
    
    # Filter by category if needed
    if category != 'all':
        filtered_articles = [a for a in french_articles if a['category'] == category]
    else:
        filtered_articles = french_articles
        
    logger.info(f"Returning {len(filtered_articles[:limit])} hardcoded French articles for category: {category}")
    return filtered_articles[:limit]

def get_nhs_articles(category: str = 'all', limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch articles from NHS RSS feed"""
    try:
        feed = parse_feed_safely(NHS_RSS_URL, "NHS")
        
        # Map categories to NHS topics
        category_mapping = {
            'general': ['health', 'medical', 'nhs', 'treatment'],
            'nutrition': ['nutrition', 'diet', 'food', 'eating'],
            'fitness': ['exercise', 'fitness', 'physical activity', 'sport'],
            'mental_health': ['mental health', 'psychology', 'depression', 'anxiety'],
            'preventive_care': ['prevention', 'vaccine', 'screening', 'check-up']
        }
        
        keywords = category_mapping.get(category, ['health'])
        
        articles = []
        for entry in feed.entries:
            if category != 'all':
                title_desc = f"{entry.title} {entry.description}".lower()
                matches_category = any(keyword.lower() in title_desc for keyword in keywords)
                if not matches_category:
                    continue
            
            # Get the full content if available, otherwise use description
            content = entry.get('content', [{'value': entry.description}])[0].get('value', entry.description)
            
            # Clean the content
            soup = BeautifulSoup(content, 'html.parser')
            text_content = soup.get_text(strip=True)
            
            # Try to find an image
            img = (
                soup.find('img') or 
                soup.find('meta', property='og:image') or 
                soup.find('meta', attrs={'name': 'twitter:image'})
            )
            image_url = img.get('src') or img.get('content', '') if img else ''
            
            article = {
                'id': entry.get('id', entry.link),
                'title': entry.title,
                'content': text_content,
                'summary': text_content[:200] + '...' if text_content else '',
                'category': category,
                'image_url': image_url,
                'source_url': entry.link,
                'source_name': 'National Health Service (UK)',
                'created_at': entry.get('published', datetime.utcnow().isoformat())
            }
            articles.append(article)
            
            if len(articles) >= limit:
                break
        
        return articles
    except Exception as e:
        logger.error(f"Error fetching NHS articles: {str(e)}")
        raise HealthAPIError(f"NHS RSS feed error: {str(e)}")

def get_health_response(user_message: str) -> str:
    """Get a health-related response based on user message"""
    try:
        # Convert message to lowercase for matching
        message = user_message.lower()
        
        # Define health categories and their keywords
        categories = {
            'general': ['health', 'medical', 'doctor', 'hospital', 'clinic', 'symptoms'],
            'nutrition': ['food', 'diet', 'nutrition', 'eat', 'vitamin', 'mineral', 'protein'],
            'fitness': ['exercise', 'workout', 'fitness', 'gym', 'sport', 'training'],
            'mental_health': ['stress', 'anxiety', 'depression', 'mental', 'psychology'],
            'preventive_care': ['prevention', 'screening', 'checkup', 'vaccine', 'immunization']
        }
        
        # Detect category from message
        detected_category = 'general'
        max_matches = 0
        
        for category, keywords in categories.items():
            matches = sum(1 for keyword in keywords if keyword in message)
            if matches > max_matches:
                max_matches = matches
                detected_category = category
        
        logger.info(f"Detected category '{detected_category}' from message: {message}")
        
        try:
            # Get relevant articles
            articles = get_health_articles(category=detected_category, limit=3)
            
            # Format response with article information
            response = "Based on your question, here's some relevant health information:\n\n"
            
            for article in articles:
                response += f"📌 {article['title']}\n"
                response += f"{article['summary']}\n"
                if article['source_url']:
                    response += f"Read more: {article['source_url']}\n"
                response += "\n"
            
            response += "\nPlease note: This information is for educational purposes only. For medical advice, please consult with a healthcare professional."
            
        except HealthAPIError as e:
            logger.error(f"Failed to fetch health articles: {str(e)}")
            response = (
                "I apologize, but I'm having trouble accessing the health information services at the moment. "
                "This could be due to temporary API issues or network problems. "
                "Please try again in a few moments."
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating health response: {str(e)}")
        return (
            "I apologize, but I'm having trouble processing your request. "
            "Please try rephrasing your question or ask about a different health topic."
        )