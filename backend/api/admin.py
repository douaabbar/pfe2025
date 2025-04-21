from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, or_
import datetime
import re
from collections import Counter
from textblob import TextBlob

from backend.app import db
from backend.models import User, Chat, Message, Feedback, RssFeed, Article

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Decorator to check if user is admin
def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    
    wrapper.__name__ = fn.__name__
    return wrapper

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    # Get user count
    user_count = User.query.count()
    
    # Get chat count
    chat_count = Chat.query.count()
    
    # Get message count
    message_count = Message.query.count()
    
    # Get average rating
    feedbacks = Feedback.query.all()
    ratings = [feedback.rating for feedback in feedbacks if feedback.rating]
    average_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # Get feedback count
    feedback_count = len(feedbacks)
    
    # Calculate engagement rate (users with at least one chat / total users)
    users_with_chats = db.session.query(Chat.user_id).distinct().count()
    engagement_rate = users_with_chats / user_count if user_count > 0 else 0
    
    # Get article count
    article_count = Article.query.count()
    
    return jsonify({
        'user_count': user_count,
        'chat_count': chat_count,
        'message_count': message_count,
        'average_rating': average_rating,
        'feedback_count': feedback_count,
        'engagement_rate': engagement_rate,
        'article_count': article_count
    })

@admin_bp.route('/feedbacks', methods=['GET'])
@admin_required
def get_feedbacks():
    # Query all feedbacks with user information
    feedbacks = db.session.query(
        Feedback,
        User.email.label('user_email'),
        User.language
    ).outerjoin(
        User, Feedback.user_id == User.id
    ).order_by(
        desc(Feedback.created_at)
    ).all()
    
    # Format the results
    feedback_list = []
    for feedback, user_email, language in feedbacks:
        feedback_dict = {
            'id': feedback.id,
            'rating': feedback.rating,
            'comment': feedback.comment,
            'user_id': feedback.user_id,
            'user_email': user_email,
            'language': language,
            'created_at': feedback.created_at.isoformat()
        }
        feedback_list.append(feedback_dict)
    
    return jsonify({
        'items': feedback_list,
        'total': len(feedback_list)
    })

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    # Get search term from query parameters
    search = request.args.get('search', '')
    
    # Base query
    query = db.session.query(
        User,
        db.func.count(Chat.id).label('chat_count')
    ).outerjoin(
        Chat, User.id == Chat.user_id
    ).group_by(User.id)
    
    # Apply search filter if provided
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term)
            )
        )
    
    # Execute query and order by registration date
    users = query.order_by(desc(User.created_at)).all()
    
    # Format the results
    user_list = []
    for user, chat_count in users:
        user_dict = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_admin': user.is_admin,
            'is_professional': user.is_professional,
            'is_verified': user.is_verified,
            'language': user.language,
            'created_at': user.created_at.isoformat(),
            'chat_count': chat_count
        }
        user_list.append(user_dict)
    
    return jsonify({
        'items': user_list,
        'total': len(user_list)
    })

@admin_bp.route('/users/<int:user_id>/block', methods=['PUT'])
@admin_required
def toggle_user_block(user_id):
    # Get the user to block/unblock
    user = User.query.get_or_404(user_id)
    
    # Get current admin user
    current_user_id = get_jwt_identity()
    admin_user = User.query.get(current_user_id)
    
    # Prevent admin from blocking themselves
    if user.id == admin_user.id:
        return jsonify({'error': 'You cannot block yourself'}), 400
    
    # Toggle is_verified status (block/unblock)
    user.is_verified = not user.is_verified
    
    try:
        db.session.commit()
        
        action = "unblocked" if user.is_verified else "blocked"
        return jsonify({
            'message': f'User {user.email} has been {action}',
            'user_id': user.id,
            'is_verified': user.is_verified
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling user block: {e}")
        return jsonify({'error': 'Failed to update user status'}), 500

@admin_bp.route('/users/<int:user_id>/admin', methods=['PUT'])
@admin_required
def toggle_admin_rights(user_id):
    # Get the user to modify
    user = User.query.get_or_404(user_id)
    
    # Get current admin user
    current_user_id = get_jwt_identity()
    admin_user = User.query.get(current_user_id)
    
    # Prevent admin from removing their own admin rights
    if user.id == admin_user.id:
        return jsonify({'error': 'You cannot change your own admin status'}), 400
    
    # Toggle is_admin status
    user.is_admin = not user.is_admin
    
    try:
        db.session.commit()
        
        action = "granted" if user.is_admin else "removed"
        return jsonify({
            'message': f'Admin rights {action} for user {user.email}',
            'user_id': user.id,
            'is_admin': user.is_admin
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling admin rights: {e}")
        return jsonify({'error': 'Failed to update admin status'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    # Get the user to delete
    user = User.query.get_or_404(user_id)
    
    # Get current admin user
    current_user_id = get_jwt_identity()
    admin_user = User.query.get(current_user_id)
    
    # Prevent admin from deleting themselves
    if user.id == admin_user.id:
        return jsonify({'error': 'You cannot delete yourself'}), 400
    
    try:
        # Save email for confirmation message
        user_email = user.email
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': f'User {user_email} has been deleted',
            'user_id': user_id
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500

# Article Management
@admin_bp.route('/articles', methods=['GET'])
@admin_required
def get_articles():
    # Get search and filter parameters
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    # Base query for articles
    query = Article.query
    
    # Apply category filter if provided
    if category:
        query = query.filter(Article.category == category)
    
    # Apply search filter if provided
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            or_(
                Article.title.ilike(search_term),
                Article.summary.ilike(search_term),
                Article.source_name.ilike(search_term)
            )
        )
    
    # Get all articles ordered by newest first
    articles = query.order_by(desc(Article.created_at)).all()
    
    # Format the results
    article_list = [article.to_dict() for article in articles]
    
    return jsonify({
        'items': article_list,
        'total': len(article_list)
    })

@admin_bp.route('/articles', methods=['POST'])
@admin_required
def create_article():
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    try:
        # Create new article
        new_article = Article(
            title=data.get('title'),
            content=data.get('content'),
            summary=data.get('summary', ''),
            image_url=data.get('image_url', ''),
            source_url=data.get('source_url', ''),
            source_name=data.get('source_name', 'MedAI'),
            category=data.get('category', 'general'),
            published_at=datetime.datetime.utcnow(),
            is_hidden=data.get('is_hidden', False),
            is_featured=data.get('is_featured', False),
            manual_entry=True
        )
        
        db.session.add(new_article)
        db.session.commit()
        
        return jsonify({
            'message': 'Article created successfully',
            'article': new_article.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating article: {e}")
        return jsonify({'error': 'Failed to create article'}), 500

@admin_bp.route('/articles/<int:article_id>', methods=['PUT'])
@admin_required
def update_article(article_id):
    # Get the article
    article = Article.query.get_or_404(article_id)
    
    # Get request data
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
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
        
        # Update timestamp
        article.updated_at = datetime.datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Article updated successfully',
            'article': article.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating article: {e}")
        return jsonify({'error': 'Failed to update article'}), 500

@admin_bp.route('/articles/<int:article_id>/visibility', methods=['PUT'])
@admin_required
def toggle_article_visibility(article_id):
    # Get the article
    article = Article.query.get_or_404(article_id)
    
    try:
        # Toggle visibility
        article.is_hidden = not article.is_hidden
        
        db.session.commit()
        
        status = "hidden" if article.is_hidden else "visible"
        return jsonify({
            'message': f'Article is now {status}',
            'article_id': article.id,
            'is_hidden': article.is_hidden
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling article visibility: {e}")
        return jsonify({'error': 'Failed to update article visibility'}), 500

@admin_bp.route('/articles/<int:article_id>/featured', methods=['PUT'])
@admin_required
def toggle_article_featured(article_id):
    # Get the article
    article = Article.query.get_or_404(article_id)
    
    try:
        # Toggle featured status
        article.is_featured = not article.is_featured
        
        db.session.commit()
        
        status = "featured" if article.is_featured else "not featured"
        return jsonify({
            'message': f'Article is now {status}',
            'article_id': article.id,
            'is_featured': article.is_featured
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling article featured status: {e}")
        return jsonify({'error': 'Failed to update article featured status'}), 500

@admin_bp.route('/articles/<int:article_id>', methods=['DELETE'])
@admin_required
def delete_article(article_id):
    # Get the article
    article = Article.query.get_or_404(article_id)
    
    try:
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({
            'message': 'Article deleted successfully',
            'article_id': article_id
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting article: {e}")
        return jsonify({'error': 'Failed to delete article'}), 500

# RSS Feed Management
@admin_bp.route('/rss-feeds', methods=['GET'])
@admin_required
def get_rss_feeds():
    # Get search parameter
    search = request.args.get('search', '')
    
    # Base query for RSS feeds
    query = RssFeed.query
    
    # Apply search filter if provided
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            or_(
                RssFeed.name.ilike(search_term),
                RssFeed.url.ilike(search_term),
                RssFeed.description.ilike(search_term)
            )
        )
    
    # Get all RSS feeds ordered by name
    rss_feeds = query.order_by(RssFeed.name).all()
    
    # Format the results
    rss_feed_list = [feed.to_dict() for feed in rss_feeds]
    
    return jsonify({
        'items': rss_feed_list,
        'total': len(rss_feed_list)
    })

@admin_bp.route('/rss-feeds', methods=['POST'])
@admin_required
def create_rss_feed():
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('url'):
        return jsonify({'error': 'Name and URL are required'}), 400
    
    # Check if URL already exists
    existing_feed = RssFeed.query.filter_by(url=data.get('url')).first()
    if existing_feed:
        return jsonify({'error': 'RSS feed with this URL already exists'}), 400
    
    try:
        # Create new RSS feed
        new_feed = RssFeed(
            name=data.get('name'),
            url=data.get('url'),
            description=data.get('description', ''),
            language=data.get('language', 'en'),
            is_active=data.get('is_active', True),
            category=data.get('category', 'general')
        )
        
        db.session.add(new_feed)
        db.session.commit()
        
        return jsonify({
            'message': 'RSS feed created successfully',
            'rss_feed': new_feed.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating RSS feed: {e}")
        return jsonify({'error': 'Failed to create RSS feed'}), 500

@admin_bp.route('/rss-feeds/<int:feed_id>', methods=['PUT'])
@admin_required
def update_rss_feed(feed_id):
    # Get the RSS feed
    rss_feed = RssFeed.query.get_or_404(feed_id)
    
    # Get request data
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Check if URL is being changed and already exists
    if 'url' in data and data['url'] != rss_feed.url:
        existing_feed = RssFeed.query.filter_by(url=data['url']).first()
        if existing_feed:
            return jsonify({'error': 'RSS feed with this URL already exists'}), 400
    
    try:
        # Update fields if provided
        if 'name' in data:
            rss_feed.name = data['name']
        if 'url' in data:
            rss_feed.url = data['url']
        if 'description' in data:
            rss_feed.description = data['description']
        if 'language' in data:
            rss_feed.language = data['language']
        if 'is_active' in data:
            rss_feed.is_active = data['is_active']
        if 'category' in data:
            rss_feed.category = data['category']
        
        # Update timestamp
        rss_feed.updated_at = datetime.datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'RSS feed updated successfully',
            'rss_feed': rss_feed.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating RSS feed: {e}")
        return jsonify({'error': 'Failed to update RSS feed'}), 500

@admin_bp.route('/rss-feeds/<int:feed_id>/toggle', methods=['PUT'])
@admin_required
def toggle_rss_feed_active(feed_id):
    # Get the RSS feed
    rss_feed = RssFeed.query.get_or_404(feed_id)
    
    try:
        # Toggle active status
        rss_feed.is_active = not rss_feed.is_active
        
        db.session.commit()
        
        status = "active" if rss_feed.is_active else "inactive"
        return jsonify({
            'message': f'RSS feed is now {status}',
            'feed_id': rss_feed.id,
            'is_active': rss_feed.is_active
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling RSS feed status: {e}")
        return jsonify({'error': 'Failed to update RSS feed status'}), 500

@admin_bp.route('/rss-feeds/<int:feed_id>', methods=['DELETE'])
@admin_required
def delete_rss_feed(feed_id):
    # Get the RSS feed
    rss_feed = RssFeed.query.get_or_404(feed_id)
    
    try:
        db.session.delete(rss_feed)
        db.session.commit()
        
        return jsonify({
            'message': 'RSS feed deleted successfully',
            'feed_id': feed_id
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting RSS feed: {e}")
        return jsonify({'error': 'Failed to delete RSS feed'}), 500

# NLP Analysis
@admin_bp.route('/nlp/topics', methods=['GET'])
@admin_required
def analyze_topics():
    # Get analysis parameters
    days = request.args.get('days', 30, type=int)
    language = request.args.get('language', 'all')
    
    # Calculate the start date for analysis
    start_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # Query for user messages within the time range
    message_query = db.session.query(Message.content, Message.created_at, User.language)\
        .join(Chat, Message.chat_id == Chat.id)\
        .join(User, Chat.user_id == User.id)\
        .filter(
            Message.sender == 'user',
            Message.created_at >= start_date
        )
    
    # Filter by language if specified
    if language != 'all':
        message_query = message_query.filter(User.language == language)
    
    # Execute the query
    messages = message_query.all()
    
    # Health-related terms to look for based on language
    health_terms = {
        'en': [
            'pain', 'headache', 'migraine', 'fever', 'cough', 'cold', 'flu', 
            'diabetes', 'heart', 'blood pressure', 'diet', 'nutrition', 
            'exercise', 'weight', 'stress', 'anxiety', 'depression', 'sleep',
            'medication', 'treatment', 'symptoms', 'diagnosis', 'cancer',
            'allergy', 'vitamins', 'supplements', 'vaccine', 'covid'
        ],
        'fr': [
            'douleur', 'mal de tête', 'migraine', 'fièvre', 'toux', 'rhume', 'grippe',
            'diabète', 'cœur', 'tension artérielle', 'régime', 'nutrition',
            'exercice', 'poids', 'stress', 'anxiété', 'dépression', 'sommeil',
            'médicament', 'traitement', 'symptômes', 'diagnostic', 'cancer',
            'allergie', 'vitamines', 'suppléments', 'vaccin', 'covid'
        ]
    }
    
    # Combine terms if analyzing all languages
    terms_to_check = []
    if language == 'all':
        for lang_terms in health_terms.values():
            terms_to_check.extend(lang_terms)
    else:
        terms_to_check = health_terms.get(language, health_terms['en'])
    
    # Analyze topics
    topic_counter = Counter()
    sentiment_data = {'positive': 0, 'neutral': 0, 'negative': 0}
    time_series_data = {}
    
    for content, created_at, msg_language in messages:
        # Skip empty messages
        if not content:
            continue
        
        # Process topics
        content_lower = content.lower()
        for term in terms_to_check:
            # Check for word boundary matches
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, content_lower):
                topic_counter[term] += 1
        
        # Process sentiment
        try:
            blob = TextBlob(content)
            sentiment_score = blob.sentiment.polarity
            
            if sentiment_score > 0.1:
                sentiment_data['positive'] += 1
            elif sentiment_score < -0.1:
                sentiment_data['negative'] += 1
            else:
                sentiment_data['neutral'] += 1
        except:
            # If sentiment analysis fails, count as neutral
            sentiment_data['neutral'] += 1
        
        # Process time series
        date_key = created_at.strftime('%Y-%m-%d')
        if date_key not in time_series_data:
            time_series_data[date_key] = 0
        time_series_data[date_key] += 1
    
    # Prepare time series data for the last 7 days
    today = datetime.datetime.utcnow().date()
    time_labels = []
    time_values = []
    
    for i in range(6, -1, -1):
        date = today - datetime.timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        time_labels.append(date.strftime('%d/%m'))
        time_values.append(time_series_data.get(date_str, 0))
    
    # Prepare the top topics
    top_topics = topic_counter.most_common(15)
    topics_data = [{'topic': topic, 'count': count} for topic, count in top_topics]
    
    # Calculate sentiment percentages
    total_messages = sum(sentiment_data.values())
    sentiment_percentages = {}
    
    if total_messages > 0:
        for key, value in sentiment_data.items():
            sentiment_percentages[key] = round((value / total_messages) * 100, 1)
    else:
        sentiment_percentages = {'positive': 0, 'neutral': 0, 'negative': 0}
    
    return jsonify({
        'topics': topics_data,
        'sentiment': {
            'raw': sentiment_data,
            'percentages': sentiment_percentages
        },
        'time_series': {
            'labels': time_labels,
            'values': time_values
        },
        'message_count': len(messages),
        'analysis_period': {
            'days': days,
            'language': language
        }
    }) 