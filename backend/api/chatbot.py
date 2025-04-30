from flask import Blueprint, request, jsonify
import torch
import google.generativeai as genai
from transformers import BertForSequenceClassification, AutoTokenizer
import csv

chatbot_bp = Blueprint('chatbot_bp', __name__)

# Gemini setup
genai.configure(api_key="YOUR_GEMINI_KEY")
gemini_model = genai.GenerativeModel('gemini-1.5-pro')

# Load model/tokenizer
model = BertForSequenceClassification.from_pretrained('.', local_files_only=True)
tokenizer = AutoTokenizer.from_pretrained('.', local_files_only=True)
model.eval()

# Label mapping
label_mapping = {}
try:
    with open('./label_mapping.csv', newline='') as csvfile:
        reader = csv.reader(csvfile)
        label_mapping = {rows[1]: rows[0] for rows in reader}
except FileNotFoundError:
    label_mapping = {}

def translate_text(text, source_lang, target_lang):
    prompt = f"Translate the following {source_lang} medical text to {target_lang}:\n\n{text}"
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip() if hasattr(response, 'text') else ""
    except Exception:
        return ""

@chatbot_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text_french = data.get('text')
    if not text_french:
        return jsonify({'error': 'Missing text'}), 400

    text_english = translate_text(text_french, "French", "English")
    if not text_english:
        return jsonify({'error': 'Translation failed'}), 500

    inputs = tokenizer(text_english, return_tensors="pt", padding=True, truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1)
        pred_class = torch.argmax(logits, dim=1).item()
        confidence = probs[0][pred_class].item()

    disease_en = label_mapping.get(str(pred_class), f"Unknown class {pred_class}")
    disease_fr = translate_text(disease_en, "English", "French")

    doctor_prompt = f"Act as a professional French doctor. A patient describes these symptoms: {text_french}. Based on medical knowledge, they likely have {disease_fr}. Provide a detailed response in French and do not exceed 2 lines."
    doctor_response = gemini_model.generate_content(doctor_prompt)
    response_text = doctor_response.text.strip() if hasattr(doctor_response, 'text') else "Pas de réponse."

    return jsonify({
        'prediction1': disease_fr,
        'confidence': round(confidence * 100, 2),
        'class_id': pred_class,
        'prediction': response_text
    })
@chatbot_bp.route('/predict-en', methods=['POST'])
def predict_en():
    data = request.get_json()
    text_english = data.get('text')
    if not text_english:
        return jsonify({'error': 'Missing text'}), 400

    inputs = tokenizer(text_english, return_tensors="pt", padding=True, truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1)
        pred_class = torch.argmax(logits, dim=1).item()
        confidence = probs[0][pred_class].item()

    disease_en = label_mapping.get(str(pred_class), f"Unknown class {pred_class}")

    doctor_prompt = f"You are a professional doctor. A patient describes the following symptoms: {text_english}. Based on medical knowledge, they likely have {disease_en}. Provide a short, clear explanation in English, no more than 2 lines."
    doctor_response = gemini_model.generate_content(doctor_prompt)
    response_text = doctor_response.text.strip() if hasattr(doctor_response, 'text') else "No response available."

    return jsonify({
        'prediction1': disease_en,
        'confidence': round(confidence * 100, 2),
        'class_id': pred_class,
        'prediction': response_text
    })

@chatbot_bp.route('/find_doctor', methods=['POST'])
def find_doctor():
    data = request.get_json()
    symptoms = data.get('symptoms')
    city = data.get('city')
    if not symptoms or not city:
        return jsonify({"error": "Both symptoms and city are required."}), 400

    prompt = f"""
    You are a helpful assistant. Based on the provided symptoms and city, recommend one doctor or clinic near that city. Respond in plain text (not JSON). Include name, specialty, address, phone, and website if possible.
    
    Symptoms: {symptoms}
    City: {city}
    """
    response = gemini_model.generate_content(prompt)
    doctor_info = response.text.strip() if hasattr(response, 'text') else "No doctor info found."

    return jsonify({"doctor_info": doctor_info})



