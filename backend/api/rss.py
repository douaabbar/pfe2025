from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc
import datetime

from backend.app import db
from backend.models import User, RssFeed, Article

rss_bp = Blueprint('rss', __name__)

def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin

# RSS Feed Management
@rss_bp.route('/feeds', methods=['GET'])
@jwt_required()
def get_rss_feeds():
    """Get all RSS feeds with pagination"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit per_page to avoid performance issues
    if per_page > 50:
        per_page = 50
    
    # Query RSS feeds
    feeds_query = RssFeed.query.order_by(desc(RssFeed.created_at))
    
    # Apply pagination
    paginated = feeds_query.paginate(page=page, per_page=per_page)
    
    # Format the results
    items = [feed.to_dict() for feed in paginated.items]
    
    return jsonify({
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "per_page": per_page,
        "items": items
    }), 200

@rss_bp.route('/feeds', methods=['POST'])
@jwt_required()
def add_rss_feed():
    """Add a new RSS feed"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name') or not data.get('url'):
        return jsonify({"error": "Name and URL are required"}), 400
    
    # Check if URL already exists
    existing_feed = RssFeed.query.filter_by(url=data['url']).first()
    if existing_feed:
        return jsonify({"error": "RSS feed with this URL already exists"}), 409
    
    # Create new RSS feed
    new_feed = RssFeed(
        name=data['name'],
        url=data['url'],
        description=data.get('description'),
        language=data.get('language', 'en'),
        category=data.get('category')
    )
    
    db.session.add(new_feed)
    db.session.commit()
    
    return jsonify(new_feed.to_dict()), 201

@rss_bp.route('/feeds/<int:feed_id>', methods=['PUT'])
@jwt_required()
def update_rss_feed(feed_id):
    """Update an RSS feed"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    feed = RssFeed.query.get(feed_id)
    if not feed:
        return jsonify({"error": "RSS feed not found"}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        feed.name = data['name']
    if 'url' in data:
        # Check if new URL already exists in another feed
        if data['url'] != feed.url:
            existing_feed = RssFeed.query.filter_by(url=data['url']).first()
            if existing_feed:
                return jsonify({"error": "RSS feed with this URL already exists"}), 409
        feed.url = data['url']
    if 'description' in data:
        feed.description = data['description']
    if 'language' in data:
        feed.language = data['language']
    if 'is_active' in data:
        feed.is_active = data['is_active']
    if 'category' in data:
        feed.category = data['category']
    
    db.session.commit()
    
    return jsonify(feed.to_dict()), 200

@rss_bp.route('/feeds/<int:feed_id>', methods=['DELETE'])
@jwt_required()
def delete_rss_feed(feed_id):
    """Delete an RSS feed and all its articles"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    feed = RssFeed.query.get(feed_id)
    if not feed:
        return jsonify({"error": "RSS feed not found"}), 404
    
    # Store name for response
    name = feed.name
    
    # Delete the feed (cascade will delete related articles)
    db.session.delete(feed)
    db.session.commit()
    
    return jsonify({
        "message": f"RSS feed '{name}' has been deleted",
        "feed_id": feed_id
    }), 200

# Article Management
@rss_bp.route('/articles', methods=['GET'])
@jwt_required()
def get_articles():
    """Get all articles with pagination and filtering"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)
    category = request.args.get('category', '', type=str)
    include_hidden = request.args.get('include_hidden', 'false') == 'true'
    
    # Limit per_page to avoid performance issues
    if per_page > 50:
        per_page = 50
    
    # Query articles
    article_query = Article.query
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        article_query = article_query.filter(
            (Article.title.ilike(search_term)) | 
            (Article.content.ilike(search_term)) |
            (Article.summary.ilike(search_term))
        )
    
    if category:
        article_query = article_query.filter(Article.category == category)
    
    if not include_hidden:
        article_query = article_query.filter(Article.is_hidden == False)
    
    # Order by most recent first
    article_query = article_query.order_by(desc(Article.published_at))
    
    # Apply pagination
    paginated = article_query.paginate(page=page, per_page=per_page)
    
    # Format the results
    items = [article.to_dict() for article in paginated.items]
    
    return jsonify({
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "per_page": per_page,
        "items": items
    }), 200

@rss_bp.route('/articles', methods=['POST'])
@jwt_required()
def add_article():
    """Add a new manual article"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({"error": "Title is required"}), 400
    
    # Create new article
    new_article = Article(
        title=data['title'],
        content=data.get('content'),
        summary=data.get('summary'),
        image_url=data.get('image_url'),
        source_url=data.get('source_url'),
        source_name=data.get('source_name'),
        category=data.get('category'),
        published_at=datetime.datetime.utcnow(),
        is_hidden=data.get('is_hidden', False),
        is_featured=data.get('is_featured', False),
        rss_feed_id=data.get('rss_feed_id'),
        manual_entry=True
    )
    
    db.session.add(new_article)
    db.session.commit()
    
    return jsonify(new_article.to_dict()), 201

@rss_bp.route('/articles/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """Update an article"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'title' in data:
        article.title = data['title']
    if 'content' in data:
        article.content = data['content']
    if 'summary' in data:
        article.summary = data['summary']
    if 'image_url' in data:
        article.image_url = data['image_url']
    if 'source_url' in data:
        article.source_url = data['source_url']
    if 'source_name' in data:
        article.source_name = data['source_name']
    if 'category' in data:
        article.category = data['category']
    if 'is_hidden' in data:
        article.is_hidden = data['is_hidden']
    if 'is_featured' in data:
        article.is_featured = data['is_featured']
    
    db.session.commit()
    
    return jsonify(article.to_dict()), 200

@rss_bp.route('/articles/<int:article_id>/toggle-visibility', methods=['PUT'])
@jwt_required()
def toggle_article_visibility(article_id):
    """Toggle article visibility (hide/show)"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
    
    # Toggle visibility
    article.is_hidden = not article.is_hidden
    status = "hidden" if article.is_hidden else "visible"
    
    db.session.commit()
    
    return jsonify({
        "message": f"Article '{article.title}' is now {status}",
        "article_id": article.id,
        "is_hidden": article.is_hidden
    }), 200

@rss_bp.route('/articles/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    """Delete an article"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
    
    # Store title for response
    title = article.title
    
    # Delete the article
    db.session.delete(article)
    db.session.commit()
    
    return jsonify({
        "message": f"Article '{title}' has been deleted",
        "article_id": article_id
    }), 200 