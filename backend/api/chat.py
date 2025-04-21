from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import datetime

from backend.app import db
from backend.models import Chat, Message, User
from backend.utils.health_api import get_health_response

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message in a chat session (authenticated)"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({"error": "Message content is required"}), 400
    
    # Get or create chat
    chat_id = data.get('chat_id')
    if chat_id:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify chat belongs to user
        if chat.user_id != user_id:
            return jsonify({"error": "Unauthorized access to chat"}), 403
    else:
        # Create new chat
        chat = Chat(user_id=user_id)
        db.session.add(chat)
        db.session.commit()
        chat_id = chat.id
    
    # Add user message to chat
    user_message = Message(
        chat_id=chat_id,
        sender='user',
        content=data['content']
    )
    db.session.add(user_message)
    
    # Update chat title if this is the first message
    if not chat.title:
        # Use first 30 chars of message as chat title
        chat.title = data['content'][:30] + ('...' if len(data['content']) > 30 else '')
    
    # Update chat timestamp
    chat.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    
    # Get AI response
    response_content = get_health_response(data['content'])
    
    # Add AI message to chat
    ai_message = Message(
        chat_id=chat_id,
        sender='ai',
        content=response_content
    )
    db.session.add(ai_message)
    db.session.commit()
    
    # Return both messages
    return jsonify([
        user_message.to_dict(),
        ai_message.to_dict()
    ]), 201

@chat_bp.route('/guest-message', methods=['POST'])
def guest_message():
    """Send a message as a guest (no authentication)"""
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({"error": "Message content is required"}), 400
    
    # Create temporary message object (not saved to DB)
    user_message = {
        "id": f"temp-{datetime.datetime.utcnow().timestamp()}",
        "sender": "user",
        "content": data['content'],
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    # Get AI response
    response_content = get_health_response(data['content'])
    
    # Create temporary AI message
    ai_message = {
        "id": f"temp-{datetime.datetime.utcnow().timestamp() + 1}",
        "sender": "ai",
        "content": response_content,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    # Return both messages
    return jsonify([user_message, ai_message]), 200

@chat_bp.route('/history/<int:user_id>', methods=['GET'])
@jwt_required()
def get_chat_history(user_id):
    """Get chat history for a user"""
    current_user_id = get_jwt_identity()
    
    # Verify user is requesting their own history
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403
    
    # Get all chats for the user, ordered by most recent first
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.updated_at.desc()).all()
    
    return jsonify([chat.to_dict() for chat in chats]), 200

@chat_bp.route('/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Get a specific chat with all messages"""
    user_id = get_jwt_identity()
    
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    # Verify chat belongs to user
    if chat.user_id != user_id:
        return jsonify({"error": "Unauthorized access to chat"}), 403
    
    # Get all messages in the chat, ordered by creation time
    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.created_at).all()
    
    return jsonify({
        "chat": chat.to_dict(),
        "messages": [message.to_dict() for message in messages]
    }), 200

@chat_bp.route('/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Delete a chat"""
    user_id = get_jwt_identity()
    
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    # Verify chat belongs to user
    if chat.user_id != user_id:
        return jsonify({"error": "Unauthorized access to chat"}), 403
    
    # Delete chat (cascade will delete messages)
    db.session.delete(chat)
    db.session.commit()
    
    return jsonify({"message": "Chat deleted successfully"}), 200

@chat_bp.route('/<int:chat_id>/rename', methods=['PUT'])
@jwt_required()
def rename_chat(chat_id):
    """Rename a chat"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if 'title' not in data:
        return jsonify({"error": "Chat title is required"}), 400
    
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    # Verify chat belongs to user
    if chat.user_id != user_id:
        return jsonify({"error": "Unauthorized access to chat"}), 403
    
    # Update chat title
    chat.title = data['title']
    db.session.commit()
    
    return jsonify(chat.to_dict()), 200

@chat_bp.route('/new', methods=['POST'])
@jwt_required()
def create_new_chat():
    """Create a new empty chat"""
    user_id = get_jwt_identity()
    
    # Create new chat
    new_chat = Chat(user_id=user_id)
    db.session.add(new_chat)
    db.session.commit()
    
    return jsonify(new_chat.to_dict()), 201