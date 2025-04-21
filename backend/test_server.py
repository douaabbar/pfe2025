from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

# Sample hardcoded French health articles
FRENCH_ARTICLES = [
    {
        'id': 'fr-1',
        'title': 'Conseils pour une alimentation saine',
        'summary': 'Découvrez comment une alimentation équilibrée peut améliorer votre santé générale.',
        'content': '<h2>Les bases d\'une alimentation équilibrée</h2><p>Une alimentation saine est essentielle pour maintenir un bon état de santé.</p>',
        'category': 'nutrition',
        'image_url': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=2070',
        'source_url': 'https://www.santepubliquefrance.fr',
        'source_name': 'Santé Publique France',
        'created_at': datetime.utcnow().isoformat()
    },
    {
        'id': 'fr-2',
        'title': 'L\'importance de l\'activité physique régulière',
        'summary': 'L\'exercice régulier est crucial pour maintenir un mode de vie sain.',
        'content': '<h2>Les bienfaits de l\'activité physique</h2><p>L\'activité physique régulière offre de nombreux avantages pour la santé.</p>',
        'category': 'fitness',
        'image_url': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=2070',
        'source_url': 'https://www.mangerbouger.fr',
        'source_name': 'Manger Bouger',
        'created_at': datetime.utcnow().isoformat()
    },
    {
        'id': 'fr-3',
        'title': 'Santé mentale: prendre soin de son bien-être psychologique',
        'summary': 'La santé mentale est aussi importante que la santé physique.',
        'content': '<h2>Stratégies pour améliorer votre bien-être mental</h2><p>Prendre soin de sa santé mentale implique plusieurs pratiques quotidiennes.</p>',
        'category': 'mental_health',
        'image_url': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070',
        'source_url': 'https://www.psycom.org',
        'source_name': 'Psycom',
        'created_at': datetime.utcnow().isoformat()
    }
]

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/api/articles/categories')
def get_categories():
    categories = ['general', 'nutrition', 'fitness', 'mental_health', 'preventive_care']
    return jsonify(categories)

@app.route('/api/articles')
def get_articles():
    return jsonify(FRENCH_ARTICLES)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

if __name__ == '__main__':
    app.run(port=5000, debug=True) 