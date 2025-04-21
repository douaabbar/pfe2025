from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc

from backend.app import db
from backend.models import Feedback, User

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/', methods=['POST'])
@jwt_required(optional=True)
def submit_feedback():
    """Submit user feedback"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if 'rating' not in data:
        return jsonify({"error": "Rating is required"}), 400
    
    # Validate rating value
    try:
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
    except ValueError:
        return jsonify({"error": "Rating must be a number"}), 400
    
    # Create new feedback
    new_feedback = Feedback(
        user_id=current_user_id,  # Can be None for anonymous feedback
        rating=rating,
        comment=data.get('comment')
    )
    
    db.session.add(new_feedback)
    db.session.commit()
    
    return jsonify(new_feedback.to_dict()), 201

@feedback_bp.route('/', methods=['GET'])
def get_all_feedback():
    """Get all feedback with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit per_page to 50 to avoid excessive queries
    if per_page > 50:
        per_page = 50
    
    # Get all feedback that has a comment (not empty)
    feedback_query = Feedback.query.filter(Feedback.comment.isnot(None), 
                                          Feedback.comment != '')
    
    # Order by rating (highest first) and then date (newest first)
    feedback_query = feedback_query.order_by(desc(Feedback.rating), 
                                             desc(Feedback.created_at))
    
    # Paginate the results
    paginated = feedback_query.paginate(page=page, per_page=per_page)
    
    # Format the response
    result = {
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "per_page": per_page,
        "items": [item.to_dict() for item in paginated.items]
    }
    
    return jsonify(result), 200

@feedback_bp.route('/top', methods=['GET'])
def get_top_feedback():
    """Get top-rated feedback for homepage"""
    count = request.args.get('count', 3, type=int)
    
    # Get feedback with high ratings (4-5) and comments
    top_feedback = Feedback.query.filter(
        Feedback.rating >= 4,
        Feedback.comment.isnot(None),
        Feedback.comment != ''
    ).order_by(
        desc(Feedback.rating),
        desc(Feedback.created_at)
    ).limit(count).all()
    
    return jsonify([item.to_dict() for item in top_feedback]), 200

@feedback_bp.route('/stats', methods=['GET'])
def get_feedback_stats():
    """Get feedback statistics"""
    # Get average rating
    avg_rating_result = db.session.query(
        db.func.avg(Feedback.rating).label('average')
    ).first()
    
    # Get count by rating
    rating_counts = {}
    for rating in range(1, 6):
        count = Feedback.query.filter(Feedback.rating == rating).count()
        rating_counts[rating] = count
    
    # Get total count
    total_count = Feedback.query.count()
    
    return jsonify({
        "average_rating": float(avg_rating_result.average) if avg_rating_result.average else 0,
        "total_count": total_count,
        "rating_counts": rating_counts
    }), 200

@feedback_bp.route('/', methods=['GET'])
@jwt_required()
def get_feedback():
    """Get all feedback (admin only)"""
    current_user_id = get_jwt_identity()
    
    # Check if user is admin (simplified - in real app would use proper role check)
    user = User.query.get(current_user_id)
    if not user or not user.is_professional:
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Get all feedback, most recent first
    all_feedback = Feedback.query.order_by(Feedback.created_at.desc()).all()
    
    return jsonify([f.to_dict() for f in all_feedback]), 200

@feedback_bp.route('/<int:feedback_id>', methods=['GET'])
@jwt_required()
def get_feedback_by_id(feedback_id):
    """Get a specific feedback"""
    current_user_id = get_jwt_identity()
    
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        return jsonify({"error": "Feedback not found"}), 404
    
    # Check if user is admin or the feedback owner
    user = User.query.get(current_user_id)
    if not user or (not user.is_professional and feedback.user_id != current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    return jsonify(feedback.to_dict()), 200

@feedback_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_feedback(user_id):
    """Get all feedback from a specific user"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is requesting their own feedback or is an admin
    user = User.query.get(current_user_id)
    if not user or (user_id != current_user_id and not user.is_professional):
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Get all feedback from user, most recent first
    user_feedback = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.created_at.desc()).all()
    
    return jsonify([f.to_dict() for f in user_feedback]), 200

@feedback_bp.route('/<int:feedback_id>', methods=['DELETE'])
@jwt_required()
def delete_feedback(feedback_id):
    """Delete a feedback entry"""
    current_user_id = get_jwt_identity()
    
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        return jsonify({"error": "Feedback not found"}), 404
    
    # Check if user is admin or the feedback owner
    user = User.query.get(current_user_id)
    if not user or (not user.is_professional and feedback.user_id != current_user_id):
        return jsonify({"error": "Unauthorized access"}), 403
    
    db.session.delete(feedback)
    db.session.commit()
    
    return jsonify({"message": "Feedback deleted successfully"}), 200