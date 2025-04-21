import os
import datetime
from flask import Flask, jsonify, send_from_directory, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Create SQLAlchemy extension
db = SQLAlchemy(model_class=Base)

# Frontend build directory path
frontend_build_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'))

# Create Flask app
app = Flask(__name__, static_folder=None)  # Disable default static folder
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Disable automatic trailing slash redirects
app.url_map.strict_slashes = False

# Use Flask-CORS extension properly
CORS(app, 
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,  # Cache preflight requests for 1 hour
    automatic_options=True  # Handle OPTIONS automatically
)

# Configure JWT with more secure settings
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(days=1)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
jwt = JWTManager(app)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "mysql://root:@localhost:3306/Medai_db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Disable CSRF for API endpoints during debugging
app.config["WTF_CSRF_ENABLED"] = False  # Temporary for debugging

# Log all requests for debugging
@app.before_request
def log_request():
    print(f"Request: {request.method} {request.path}")
    print(f"  Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"  JSON data: {request.get_json()}")
    elif request.form:
        # Don't log passwords
        form_data = dict(request.form)
        if 'password' in form_data:
            form_data['password'] = '[REDACTED]'
        print(f"  Form data: {form_data}")

# Initialize extensions with app
db.init_app(app)
migrate = Migrate(app, db)  # This line enables flask db commands


# Import models to create tables
with app.app_context():
    # This will ensure all models are imported before creating tables
    from backend.models import User, Chat, Message, Feedback
    db.create_all()

# Register API blueprints
from backend.api.auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/api/auth')

from backend.api.chat import chat_bp
app.register_blueprint(chat_bp, url_prefix='/api/chat')

from backend.api.articles import articles_bp
app.register_blueprint(articles_bp, url_prefix='/api/articles')

from backend.api.profile import profile_bp
app.register_blueprint(profile_bp, url_prefix='/api/profile')

from backend.api.feedback import feedback_bp
app.register_blueprint(feedback_bp, url_prefix='/api/feedback')

from backend.api.admin import admin_bp
app.register_blueprint(admin_bp, url_prefix='/api/admin')

from backend.api.rss import rss_bp
app.register_blueprint(rss_bp, url_prefix='/api/rss')

from backend.api.unauthenticated_chat import unauth_chat_bp
app.register_blueprint(unauth_chat_bp, url_prefix='')

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    # Only return JSON 404 for API routes
    if request.path.startswith('/api/'):
        return jsonify({"error": "API endpoint not found"}), 404
    # For all other routes, let the frontend handle routing
    return send_from_directory(frontend_build_path, 'index.html')

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Server error"}), 500

# Serve static files from the React app
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(frontend_build_path, 'static'), path)

# Serve other static files (favicon, manifest, etc.)
@app.route('/<path:filename>')
def serve_public_files(filename):
    if '.' in filename:  # Only serve files with extensions
        return send_from_directory(frontend_build_path, filename)
    return send_from_directory(frontend_build_path, 'index.html')

# Root route and all other routes should serve the React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
        
    # First check if the path exists as a file in the build directory
    file_path = os.path.join(frontend_build_path, path)
    if os.path.isfile(file_path):
        return send_from_directory(frontend_build_path, path)
        
    # Otherwise, serve index.html for client-side routing
    return send_from_directory(frontend_build_path, 'index.html')