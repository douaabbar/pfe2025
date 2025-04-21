import os
import jwt
from flask import current_app
import datetime

def generate_verification_token(email):
    """
    Generate a JWT token for email verification
    """
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': email,
        'purpose': 'email_verification'
    }
    return jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY'),
        algorithm='HS256'
    )

def generate_password_reset_token(email):
    """
    Generate a JWT token for password reset
    """
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        'iat': datetime.datetime.utcnow(),
        'sub': email,
        'purpose': 'password_reset'
    }
    return jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY'),
        algorithm='HS256'
    )

def verify_token(token, purpose):
    """
    Verify a JWT token and return the email if valid
    """
    try:
        payload = jwt.decode(
            token, 
            current_app.config.get('JWT_SECRET_KEY'),
            algorithms=['HS256']
        )
        
        # Check if token has correct purpose
        if payload.get('purpose') != purpose:
            return None
            
        return payload['sub']  # Return the subject (email)
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None