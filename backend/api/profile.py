from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import os
import base64
import datetime

from backend.app import db
from backend.models import User

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_profile(user_id):
    """Get user profile"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is requesting their own profile - use string comparison
    if str(current_user_id) != str(user_id):
        print(f"GET profile - Authorization failed: {current_user_id} (token) tried to access profile for {user_id} (URL)")
        return jsonify({"error": "Unauthorized access"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user.to_dict()), 200

@profile_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_profile(user_id):
    """Update user profile"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is updating their own profile
    if str(current_user_id) != str(user_id):
        print(f"PUT profile - Authorization failed: {current_user_id} (token) tried to update profile for {user_id} (URL)")
        return jsonify({"error": "Unauthorized access"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        data = request.get_json()
        print(f"Received profile update request for user {user_id}")
        print(f"Request data keys: {data.keys() if data else 'No data'}")
        
        # Update basic profile fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'bio' in data:
            user.bio = data['bio']
        
        if 'is_professional' in data:
            user.is_professional = data['is_professional']
        
        if 'profession' in data:
            user.profession = data['profession']
        
        # Handle profile image
        if 'profile_image' in data:
            try:
                image_data = data['profile_image']
                print(f"Processing profile image update. Image data type: {type(image_data)}")
                
                # If empty string or null, remove the profile image
                if not image_data:
                    print("Removing profile image")
                    user.profile_image = None
                
                # If it's a data URL, process it
                elif isinstance(image_data, str) and image_data.startswith('data:image'):
                    print("Processing new profile image from data URL")
                    # Basic validation of image size
                    base64_content = image_data.split(',')[1] if ',' in image_data else image_data
                    approx_size = len(base64_content) * 3 / 4
                    
                    if approx_size > 5 * 1024 * 1024:  # 5MB limit
                        return jsonify({"error": "Image too large. Maximum size is 5MB"}), 400
                    
                    user.profile_image = image_data
                    print("Profile image updated successfully")
                
                # If it's a URL, store as is
                elif isinstance(image_data, str):
                    print("Storing profile image URL")
                    user.profile_image = image_data
                else:
                    print(f"Invalid image data type: {type(image_data)}")
                    return jsonify({"error": "Invalid image data format"}), 400
                    
            except Exception as e:
                print(f"Error processing profile image: {str(e)}")
                return jsonify({"error": f"Failed to process image: {str(e)}"}), 400
        
        # Update timestamp
        user.updated_at = datetime.datetime.utcnow()
        
        # Commit changes
        db.session.commit()
        print(f"Profile updated successfully for user {user_id}")
        
        # Return updated user data
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        print(f"Unexpected error in profile update: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/<int:user_id>/password', methods=['PUT'])
@jwt_required()
def change_password(user_id):
    """Change user password"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is changing their own password - use string comparison
    if str(current_user_id) != str(user_id):
        print(f"Password change - Authorization failed: {current_user_id} (token) tried to change password for {user_id} (URL)")
        return jsonify({"error": "Unauthorized access"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({"error": "Current and new passwords are required"}), 400
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({"error": "Current password is incorrect"}), 401
    
    # Update password
    user.set_password(data['new_password'])
    
    # Update timestamp
    user.updated_at = datetime.datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({"message": "Password updated successfully"}), 200

@profile_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_account(user_id):
    """Delete user account"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is deleting their own account - use string comparison
    if str(current_user_id) != str(user_id):
        print(f"Account deletion - Authorization failed: {current_user_id} (token) tried to delete account for {user_id} (URL)")
        return jsonify({"error": "Unauthorized access"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Delete user (cascade will delete related records)
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"message": "Account deleted successfully"}), 200

@profile_bp.route('/<int:user_id>/activity', methods=['GET'])
@jwt_required()
def get_user_activity(user_id):
    """Get user's recent activity including chats and feedback"""
    current_user_id = get_jwt_identity()
    
    # Ensure user is requesting their own activity data - use string comparison
    if str(current_user_id) != str(user_id):
        print(f"GET activity - Authorization failed: {current_user_id} (token) tried to access activity for {user_id} (URL)")
        return jsonify({"error": "Unauthorized access"}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get recent chats (last 5)
    from backend.models import Chat
    recent_chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.updated_at.desc()).limit(5).all()
    
    # Get recent feedback (last 5)
    from backend.models import Feedback
    recent_feedback = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.created_at.desc()).limit(5).all()
    
    return jsonify({
        "chats": [chat.to_dict() for chat in recent_chats],
        "feedback": [feedback.to_dict() for feedback in recent_feedback]
    }), 200