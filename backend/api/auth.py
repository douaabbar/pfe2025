from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import re
import uuid
import secrets

from backend.app import db
from backend.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['full_name', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    # Validate email format
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_pattern.match(data['email']):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    # Create new user
    new_user = User(
        full_name=data['full_name'],
        email=data['email'],
        is_professional=data.get('is_professional', False),
        profession=data.get('profession'),
        bio=data.get('bio'),
        is_verified=True,  # Set to True by default now
    )
    new_user.set_password(data['password'])
    
    # Save user to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "Registration successful. You can now log in.",
        "user_id": new_user.id
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Check if user exists
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Email verification check removed
    
    # Generate access token
    access_token = create_access_token(
        identity=str(user.id),  # Convert user.id to string to avoid Subject error
        expires_delta=datetime.timedelta(days=1)
    )
    
    response = jsonify({
        "token": access_token,
        "user": user.to_dict()
    })
    
    return response, 200

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user.to_dict()), 200

# Add a route for forgot password
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset link"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    # Don't reveal whether or not the user exists in the database
    # Always return a success response
    
    if user:
        # Generate a unique reset token
        reset_token = secrets.token_urlsafe(32)
        
        # Set expiration (24 hours from now)
        reset_expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        
        # Store token and expiration in database
        user.reset_token = reset_token
        user.reset_token_expiry = reset_expiration
        db.session.commit()
        
        # In a real app, send an email with the reset link
        # reset_link = f"{frontend_url}/reset-password/{reset_token}"
        # send_reset_email(user.email, reset_link)
        
        # For now, just log the token
        print(f"Password reset requested for {user.email}")
        print(f"Reset token: {reset_token}")
    
    # Return success regardless of whether user exists
    return jsonify({"message": "If an account exists with that email, a password reset link has been sent."}), 200

# Add a route to verify the reset token
@auth_bp.route('/verify-reset-token/<token>', methods=['GET'])
def verify_reset_token(token):
    """Verify a password reset token"""
    if not token:
        return jsonify({"error": "Token is required"}), 400
    
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400
    
    # Check if token is expired
    if user.reset_token_expiry < datetime.datetime.utcnow():
        return jsonify({"error": "Token has expired"}), 400
    
    return jsonify({"message": "Token is valid"}), 200

# Add a route to validate the reset token and set a new password
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using a valid token"""
    data = request.get_json()
    
    if not data or 'token' not in data or 'password' not in data:
        return jsonify({"error": "Token and new password are required"}), 400
    
    token = data['token']
    new_password = data['password']
    
    # Find user with this token
    user = User.query.filter_by(reset_token=token).first()
    
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400
    
    # Check if token is expired
    if user.reset_token_expiry < datetime.datetime.utcnow():
        return jsonify({"error": "Token has expired"}), 400
    
    # Update password and clear token
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    
    return jsonify({"message": "Password has been reset successfully"}), 200