import os

class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-secret-key")
    DEBUG = True

    # Database Config
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_HOST = os.environ.get("DB_HOST", "0.0.0.0")
    DB_NAME = os.environ.get("DB_NAME", "medai")
    
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email Config (for future AWS SES implementation)
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "email-smtp.us-east-1.amazonaws.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "True").lower() in ['true', '1', 't']
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "MedAI <medaiplatform@example.com>")
    
    # JWT Config
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
    
    # AWS Config (for future implementation)
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
    
    # Health API Configurations
    # English Content APIs
    PUBMED_API_KEY = os.environ.get("PUBMED_API_KEY", "02ec50dc49cb38494756622d9cedda709f09")  # PubMed Central API key
    
    # French Content Sources
    WHO_API_BASE_URL = "https://api.who.int/data"  # WHO API base URL
    
    # French Health Websites for Scraping (with permission)
    FRENCH_HEALTH_SOURCES = [
        {
            "name": "Sante.fr",
            "url": "https://www.sante.fr",
            "rss_feed": "https://www.sante.fr/feeds/news.xml"
        },
        {
            "name": "Ministère de la Santé",
            "url": "https://solidarites-sante.gouv.fr",
            "rss_feed": "https://solidarites-sante.gouv.fr/actualites/flux-d-actualites"
        }
    ]
    
    # Frontend URL for email links
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    # Upload folder for profile images, etc.
    UPLOAD_FOLDER = "static/uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    
    # In production, these must be set as environment variables
    SECRET_KEY = os.environ.get("SESSION_SECRET")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

def get_config(config_name=None):
    """Get configuration based on environment"""
    config_dict = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig,
        'default': DevelopmentConfig
    }
    
    # Use environment variable or default to 'default'
    if not config_name:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    return config_dict.get(config_name, config_dict['default'])