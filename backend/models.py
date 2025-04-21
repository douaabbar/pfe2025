import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    profile_image = Column(Text, nullable=True)
    is_professional = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    profession = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=True)
    language = Column(String(10), default='en')
    verification_token = Column(String(300), nullable=True)  # Kept for database compatibility but no longer used
    reset_token = Column(String(128), nullable=True)  # Token for password reset
    reset_token_expiry = Column(DateTime, nullable=True)  # When the reset token expires
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "profile_image": self.profile_image,
            "is_professional": self.is_professional,
            "is_admin": self.is_admin,
            "profession": self.profession,
            "bio": self.bio,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('chats.id'), nullable=False)
    sender = Column(String(10), nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    
    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "sender": self.sender,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="feedback")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user": self.user.to_dict() if self.user else None
        }

class RssFeed(db.Model):
    __tablename__ = 'rss_feeds'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    url = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    language = Column(String(10), default='en')
    is_active = Column(Boolean, default=True)
    category = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_fetch = Column(DateTime, nullable=True)
    
    # Relationships
    articles = relationship("Article", back_populates="rss_feed", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "description": self.description,
            "language": self.language,
            "is_active": self.is_active,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_fetch": self.last_fetch.isoformat() if self.last_fetch else None
        }

class Article(db.Model):
    __tablename__ = 'articles'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    source_url = Column(String(255), nullable=True)
    source_name = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_hidden = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    rss_feed_id = Column(Integer, ForeignKey('rss_feeds.id'), nullable=True)
    manual_entry = Column(Boolean, default=False)
    
    # Relationships
    rss_feed = relationship("RssFeed", back_populates="articles")
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "summary": self.summary,
            "image_url": self.image_url,
            "source_url": self.source_url,
            "source_name": self.source_name,
            "category": self.category,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_hidden": self.is_hidden,
            "is_featured": self.is_featured,
            "rss_feed_id": self.rss_feed_id,
            "manual_entry": self.manual_entry
        }