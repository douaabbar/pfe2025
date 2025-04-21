from flask import Blueprint, request, jsonify
import random
import time
from backend.utils.health_api import get_health_response

unauth_chat_bp = Blueprint('unauth_chat', __name__)

# Réponses prédéfinies en français pour les messages courants
COMMON_FR_RESPONSES = {
    "bonjour": [
        "Bonjour! Comment puis-je vous aider aujourd'hui?",
        "Bonjour! Avez-vous des questions sur votre santé?",
        "Bonjour! Je suis MedAI, votre assistant santé."
    ],
    "merci": [
        "De rien! N'hésitez pas si vous avez d'autres questions.",
        "C'est un plaisir de vous aider!",
        "Je vous en prie. Votre santé est importante."
    ],
    "au revoir": [
        "Au revoir! Prenez soin de vous.",
        "À bientôt! N'oubliez pas de prendre soin de votre santé.",
        "Au revoir et bonne journée!"
    ]
}

# Réponses prédéfinies en anglais pour les messages courants
COMMON_EN_RESPONSES = {
    "hello": [
        "Hello! How can I help you today?",
        "Hi there! Do you have any health questions?",
        "Hello! I'm MedAI, your health assistant."
    ],
    "thanks": [
        "You're welcome! Feel free to ask if you have any other questions.",
        "Happy to help!",
        "You're welcome. Your health matters."
    ],
    "goodbye": [
        "Goodbye! Take care of yourself.",
        "See you soon! Don't forget to take care of your health.",
        "Goodbye and have a great day!"
    ]
}

@unauth_chat_bp.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint pour le chat non authentifié
    Reçoit un message utilisateur et renvoie une réponse
    """
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({"error": "Missing message parameter"}), 400
    
    user_message = data['message'].lower().strip()
    language = data.get('language', 'en')
    
    # Simuler un délai de réponse pour plus de réalisme
    time.sleep(0.5)
    
    # Vérifier les messages courants pour des réponses prédéfinies
    if language == 'fr':
        for key, responses in COMMON_FR_RESPONSES.items():
            if key in user_message:
                return jsonify({"message": random.choice(responses)}), 200
    else:
        for key, responses in COMMON_EN_RESPONSES.items():
            if key in user_message:
                return jsonify({"message": random.choice(responses)}), 200
    
    # Pour les autres messages, utiliser la fonction get_health_response
    try:
        response = get_health_response(user_message)
        
        # Si la réponse est en anglais mais l'utilisateur préfère le français
        if language == 'fr' and response:
            # Note: Dans une application réelle, vous utiliseriez un service de traduction
            disclaimer = "\n\n(Remarque: Pour des réponses en français plus précises, veuillez vous connecter.)"
            return jsonify({"message": response + disclaimer}), 200
            
        return jsonify({"message": response}), 200
        
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        
        # Réponses de secours selon la langue
        if language == 'fr':
            fallback = "Je comprends votre préoccupation. Pour une analyse plus détaillée, veuillez vous connecter ou créer un compte. Cela me permettra de mieux comprendre votre situation personnelle."
        else:
            fallback = "I understand your concern. For a more detailed analysis, please log in or create an account. This will help me better understand your personal situation."
            
        return jsonify({"message": fallback}), 200 