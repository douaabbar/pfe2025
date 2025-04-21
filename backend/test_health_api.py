import asyncio
import aiohttp
import json
import logging
from utils.health_api import async_get_health_articles, FRENCH_HEALTH_SOURCES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_api():
    """Test health API functionality"""
    print("\n" + "="*50)
    print("HEALTH API TESTING")
    print("="*50)
    
    # Test English articles
    print("\n📚 TESTING ENGLISH ARTICLES")
    print("-"*50)
    en_articles = await async_get_health_articles(language='en', limit=3)
    print(f"Found {len(en_articles)} English articles")
    for i, article in enumerate(en_articles):
        print(f"  ✅ {i+1}. [{article['source']}] {article['title'][:50]}...")
    
    # Test French articles
    print("\n📚 TESTING FRENCH ARTICLES")
    print("-"*50)
    fr_articles = await async_get_health_articles(language='fr', limit=5)
    print(f"Found {len(fr_articles)} French articles")
    for i, article in enumerate(fr_articles):
        print(f"  ✅ {i+1}. [{article['source_name']}] {article['title'][:50]}...")
    
    # Test individual French sources
    print("\n🔍 TESTING INDIVIDUAL FRENCH SOURCES")
    print("-"*50)
    working_sources = []
    issue_sources = []
    
    async with aiohttp.ClientSession() as session:
        for source in FRENCH_HEALTH_SOURCES:
            try:
                source_name = source['name']
                source_url = source['url']
                print(f"\nTesting: {source_name}")
                
                # Get SSL verification setting from source or default to True
                verify_ssl = source.get("verify_ssl", True)
                ssl_context = None if verify_ssl else False
                
                response = await session.get(
                    source_url, 
                    timeout=10, 
                    ssl=ssl_context, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124'}
                )
                
                if response.status == 200:
                    content = await response.text()
                    print(f"  ✅ Successfully fetched content ({len(content)} bytes)")
                    
                    # Try to parse the feed
                    feed = await asyncio.get_event_loop().run_in_executor(
                        None, 
                        lambda: __import__('feedparser').parse(content)
                    )
                    
                    num_entries = len(feed.entries) if hasattr(feed, 'entries') else 0
                    if num_entries > 0:
                        print(f"  ✅ Successfully parsed feed with {num_entries} entries")
                        working_sources.append(source_name)
                    else:
                        print(f"  ⚠️ Feed parsing succeeded but found 0 entries")
                        issue_sources.append(f"{source_name} (0 entries)")
                else:
                    print(f"  ❌ Failed: HTTP {response.status}")
                    issue_sources.append(f"{source_name} (HTTP {response.status})")
            except Exception as e:
                print(f"  ❌ Error: {str(e)}")
                issue_sources.append(f"{source_name} ({str(e)[:50]}...)")
    
    # Print summary of sources
    print("\n📊 FRENCH SOURCES SUMMARY")
    print("-"*50)
    print(f"Working sources ({len(working_sources)}):")
    for source in working_sources:
        print(f"  ✅ {source}")
    print(f"\nSources with issues ({len(issue_sources)}):")
    for source in issue_sources:
        print(f"  ⚠️ {source}")
    
    # Test different article categories
    print("\n🔍 TESTING ARTICLE CATEGORIES")
    print("-"*50)
    categories = ['general', 'nutrition', 'fitness', 'mental_health', 'preventive_care']
    
    for category in categories:
        print(f"\nCategory: {category}")
        
        en_category_articles = await async_get_health_articles(category=category, language='en', limit=2)
        print(f"  🇬🇧 English: {len(en_category_articles)} articles")
        
        fr_category_articles = await async_get_health_articles(category=category, language='fr', limit=2)
        print(f"  🇫🇷 French: {len(fr_category_articles)} articles")

def main():
    """Main entry point"""
    print("Starting health API test...")
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_api())
    print("\nTest completed.")

if __name__ == "__main__":
    main() 