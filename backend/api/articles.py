from flask import Blueprint, request, jsonify, redirect, current_app
import logging
import asyncio
from datetime import datetime
from backend.utils.health_api import get_health_articles, get_hardcoded_english_articles, get_french_health_articles

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

articles_bp = Blueprint('articles', __name__)

# Add special handling for OPTIONS requests
@articles_bp.route('/', methods=['OPTIONS'])
@articles_bp.route('', methods=['OPTIONS'])
@articles_bp.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path=None):
    """Handle OPTIONS requests to prevent redirects during CORS preflight"""
    return '', 200

@articles_bp.route('/', methods=['GET'])
@articles_bp.route('', methods=['GET'])
def get_articles():
    """Get articles filtered by category and language"""
    try:
        category = request.args.get('category', 'all')
        language = request.args.get('language', 'en')
        limit = request.args.get('limit', 10, type=int)
        
        # Default to hardcoded articles for reliability
        use_hardcoded = request.args.get('hardcoded', 'false').lower() == 'true'
        
        # Fetch articles based on settings
        logger.info(f"Attempting to fetch articles for language: {language}, category: {category}")
        
        articles = []
        if use_hardcoded:
            # Use hardcoded articles if explicitly requested
            if language == 'en':
                articles = get_hardcoded_english_articles(category, limit)
            else:
                articles = asyncio.run(get_french_health_articles(None, category, limit))
        else:
            try:
                # Try to get from API with a timeout
                articles = get_health_articles(
                    category=category,
                    language=language,
                    limit=limit
                )
                logger.info(f"Successfully fetched {len(articles)} articles from APIs")
            except Exception as e:
                logger.error(f"Error fetching articles from API: {str(e)}")
                # If API fetching fails, use hardcoded articles
                if language == 'en':
                    articles = get_hardcoded_english_articles(category, limit)
                else:
                    articles = asyncio.run(get_french_health_articles(None, category, limit))
                logger.info(f"Falling back to hardcoded {language} articles")
        
        if not articles:
            # If still no articles, return an empty array with a message
            return jsonify({
                "articles": [],
                "message": "No articles found for the specified criteria"
            }), 200
        
        # Ensure each article has a valid source_url and other required fields
        for article in articles:
            if not article.get('source_url'):
                article['source_url'] = ''
            if not article.get('image_url'):
                article['image_url'] = ''
            if not article.get('category'):
                article['category'] = 'general'
        
        return jsonify(articles), 200
    except Exception as e:
        logger.error(f"Error in get_articles: {str(e)}")
        # Return some hardcoded articles as a last resort instead of error
        try:
            if 'language' in locals() and language == 'fr':
                fallback_articles = asyncio.run(get_french_health_articles(None, 'all', 5))
            else:
                fallback_articles = get_hardcoded_english_articles('all', 5)
            return jsonify(fallback_articles), 200
        except:
            # If even that fails, return an error
            return jsonify({"error": "Failed to fetch articles", "message": str(e)}), 500

@articles_bp.route('/<article_id>', methods=['GET'])
def get_article(article_id):
    """Get a single article by ID or redirect to source"""
    try:
        language = request.args.get('language', 'en')
        redirect_to_source = request.args.get('redirect', 'false').lower() == 'true'
        
        # Get articles with error handling
        try:
            # First try to get from API
            articles = get_health_articles(language=language, limit=50)
            if not articles:
                raise Exception("No articles returned from API")
        except Exception as e:
            logger.warning(f"Error fetching from API: {str(e)}, using hardcoded articles")
            # Fall back to hardcoded articles
            if language == 'en':
                articles = get_hardcoded_english_articles('all', 50)
            else:
                articles = asyncio.run(get_french_health_articles(None, 'all', 50))
        
        article = next((a for a in articles if str(a['id']) == str(article_id)), None)
        
        if not article:
            logger.error(f"Article not found with ID: {article_id}")
            return jsonify({
                "error": "Article not found",
                "message": "The requested article could not be found"
            }), 404
        
        # If redirect parameter is true and we have a source URL, redirect to it
        if redirect_to_source and article.get('source_url'):
            return redirect(article['source_url'])
            
        return jsonify(article), 200
    except Exception as e:
        logger.error(f"Error in get_article: {str(e)}")
        return jsonify({"error": "Failed to fetch article", "message": str(e)}), 500

@articles_bp.route('/redirect/<article_id>', methods=['GET'])
def redirect_to_article(article_id):
    """Redirect to the source URL of an article"""
    try:
        language = request.args.get('language', 'en')
        
        # Get articles with error handling
        try:
            articles = get_health_articles(language=language, limit=50)
        except Exception as e:
            logger.warning(f"Error fetching from API: {str(e)}, using hardcoded articles")
            # Fall back to hardcoded articles
            if language == 'en':
                articles = get_hardcoded_english_articles('all', 50)
            else:
                articles = asyncio.run(get_french_health_articles(None, 'all', 50))
        
        article = next((a for a in articles if str(a['id']) == str(article_id)), None)
        
        if not article or not article.get('source_url'):
            logger.error(f"Article or source URL not found with ID: {article_id}")
            return jsonify({
                "error": "Article not found",
                "message": "The article or its source URL could not be found"
            }), 404
            
        return redirect(article['source_url'])
    except Exception as e:
        logger.error(f"Error in redirect_to_article: {str(e)}")
        return jsonify({"error": "Failed to redirect to article", "message": str(e)}), 500

@articles_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all available article categories"""
    categories = ['general', 'nutrition', 'fitness', 'mental_health', 'preventive_care']
    return jsonify(categories), 200

@articles_bp.route('/english', methods=['GET'])
def get_english_articles():
    """Get English articles from external APIs"""
    try:
        category = request.args.get('category', 'all')
        limit = request.args.get('limit', 10, type=int)
        
        # Use actual API calls with fallback to hardcoded
        try:
            # Call the real article fetching function with 'en' language
            articles = get_health_articles(category=category, language='en', limit=limit)
            logger.info(f"Successfully fetched {len(articles)} real English articles from external APIs")
        except Exception as e:
            logger.error(f"Error fetching articles from API: {str(e)}")
            # Always fall back to hardcoded articles on error
            articles = get_hardcoded_english_articles(category, limit)
            logger.warning("Falling back to hardcoded English articles due to API error")
        
        return jsonify(articles), 200
    except Exception as e:
        logger.error(f"Error in get_english_articles: {str(e)}")
        # Return hardcoded articles instead of error
        return jsonify(get_hardcoded_english_articles('all', 5)), 200

@articles_bp.route('/french', methods=['GET'])
def get_french_articles():
    """Get French articles from external APIs"""
    try:
        category = request.args.get('category', 'all')
        limit = request.args.get('limit', 10, type=int)
        
        try:
            # Call the real article fetching function with 'fr' language
            articles = get_health_articles(category=category, language='fr', limit=limit)
            logger.info(f"Successfully fetched {len(articles)} real French articles from external APIs")
        except Exception as e:
            logger.error(f"Error fetching articles from API: {str(e)}")
            # Fall back to hardcoded articles
            articles = asyncio.run(get_french_health_articles(None, category, limit))
            logger.warning("Falling back to hardcoded French articles due to API error")
        
        return jsonify(articles), 200
    except Exception as e:
        logger.error(f"Error in get_french_articles: {str(e)}")
        # Return hardcoded articles instead of error
        return jsonify(asyncio.run(get_french_health_articles(None, 'all', 5))), 200