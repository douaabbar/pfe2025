from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.health_api import async_get_health_articles
import asyncio

health_bp = Blueprint('health', __name__)

@health_bp.route('/articles/english', methods=['GET'])
def health_articles_english():
    try:
        category = request.args.get('category', 'all')
        limit = int(request.args.get('limit', 10))
        
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        articles = loop.run_until_complete(async_get_health_articles(category=category, language='en', limit=limit))
        loop.close()
        
        return jsonify({
            'success': True,
            'articles': articles
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching English health articles: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Failed to fetch health articles: {str(e)}"
        }), 500

@health_bp.route('/articles/french', methods=['GET'])
def health_articles_french():
    try:
        category = request.args.get('category', 'all')
        limit = int(request.args.get('limit', 10))
        
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        articles = loop.run_until_complete(async_get_health_articles(category=category, language='fr', limit=limit))
        loop.close()
        
        return jsonify({
            'success': True,
            'articles': articles
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching French health articles: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Failed to fetch health articles: {str(e)}"
        }), 500 