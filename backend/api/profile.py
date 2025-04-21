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
    
    print(f"Profile update request received for user ID: {user_id}")
    print(f"Authenticated user ID from token: {current_user_id}")
    print(f"Type of user_id (URL parameter): {type(user_id)}, value: {user_id}")
    print(f"Type of current_user_id (from token): {type(current_user_id)}, value: {current_user_id}")
    
    # Debug the raw token
    from flask import request
    auth_header = request.headers.get('Authorization', '')
    print(f"Authorization header: {auth_header[:15]}... (truncated)")
    
    # Check if there's a type conversion issue
    if str(current_user_id) == str(user_id):
        print("User IDs match when converted to strings")
    else:
        print("User IDs don't match even when converted to strings")
        print(f"String comparison: '{str(current_user_id)}' vs '{str(user_id)}'")
        
    # IMPORTANT: Fix - use string comparison instead of direct comparison
    # This resolves issues where one might be a string and one might be an int
    if str(current_user_id) != str(user_id):
        print(f"Authorization failed: {current_user_id} (token) tried to update profile for {user_id} (URL)")
        print(f"Authorization comparison result: {current_user_id} != {user_id} is {current_user_id != user_id}")
        return jsonify({"error": "Unauthorized access"}), 403
    
    print("Authorization passed - user is allowed to update their profile")
    
    user = User.query.get(user_id)
    if not user:
        print(f"User not found: {user_id}")
        return jsonify({"error": "User not found"}), 404
    
    try:
        data = request.get_json()
        print(f"Received profile data: {data.keys() if data else 'No data'}")
    
        # Update basic profile fields
        if 'full_name' in data:
            print(f"Updating full_name from '{user.full_name}' to '{data['full_name']}'")
            user.full_name = data['full_name']
    
        if 'bio' in data:
            print(f"Updating bio: {'(content changed)' if data['bio'] != user.bio else '(unchanged)'}")
            user.bio = data['bio']
    
        if 'is_professional' in data:
            print(f"Updating is_professional from {user.is_professional} to {data['is_professional']}")
            user.is_professional = data['is_professional']
    
        if 'profession' in data:
            print(f"Updating profession from '{user.profession}' to '{data['profession']}'")
            user.profession = data['profession']
    
        # Handle profile image (base64 encoded)
        if 'profile_image' in data and data['profile_image']:
            # Validate base64 image
            try:
                # Check if it's a data URL (should start with data:image)
                if data['profile_image'].startswith('data:image'):
                    print("Profile image update: Valid data URL detected")
                    # It's a valid image data URL, store it directly
                    image_data = data['profile_image']
                    
                    # Basic validation - ensure it's not too large
                    # Approximate size of base64 data (4/3 of the actual size)
                    # Strip metadata part (data:image/jpeg;base64,)
                    base64_content = image_data.split(',')[1] if ',' in image_data else image_data
                    approx_size = len(base64_content) * 3 / 4  # Convert base64 size to binary size
                    
                    max_size = 5 * 1024 * 1024  # 5MB limit
                    print(f"Image size: approximately {approx_size/1024:.2f} KB")
                    
                    if approx_size > max_size:
                        print(f"Image too large: {approx_size/1024/1024:.2f} MB exceeds 5MB limit")
                        return jsonify({"error": "Image too large. Maximum size is 5MB"}), 400
                    
                    user.profile_image = image_data
                    print("Profile image updated successfully")
                else:
                    # If it's just a URL (not base64), store as is
                    print("Storing profile image as URL")
                    user.profile_image = data['profile_image']
            except Exception as e:
                print(f"Error processing profile image: {str(e)}")
                return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        elif 'profile_image' in data and data['profile_image'] == '':
            # Handle image removal
            print("Removing profile image (empty string received)")
            user.profile_image = None
    
        # Update timestamp
        user.updated_at = datetime.datetime.utcnow()
    
        print("Committing profile changes to database")
        db.session.commit()
    
        print("Profile update successful")
        return jsonify(user.to_dict()), 200
    except Exception as e:
        print(f"Unexpected error in profile update: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

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