from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import pickle
import nltk
from nltk.stem import WordNetLemmatizer
import json
import random

# Inicializa el lematizador
lemmatizer = WordNetLemmatizer()

# Carga los archivos necesarios
model = tf.keras.models.load_model('chatbot_model.h5')
words = pickle.load(open('words.pkl', 'rb'))
classes = pickle.load(open('classes.pkl', 'rb'))
# Cargar el archivo JSON con la codificación adecuada
with open('intents_spanish.json', 'r', encoding='utf-8') as f:
    intents = json.load(f)

app = Flask(__name__)

# Función para preprocesar el texto
def process_input(message):
    tokens = nltk.word_tokenize(message)
    tokens = [lemmatizer.lemmatize(token.lower()) for token in tokens]
    bag = [0] * len(words)
    for token in tokens:
        if token in words:
            bag[words.index(token)] = 1
    return np.array(bag)

# Función para obtener la respuesta del chatbot
def get_response(prediction):
    max_index = np.argmax(prediction)
    intent = classes[max_index]
    for i in intents['intents']:
        if i['tag'] == intent:
            return random.choice(i['responses'])
    return "No entiendo tu mensaje. Por favor, inténtalo de nuevo."

# Función para predecir la intención
def predict_intent(message):
    input_data = process_input(message)
    prediction = model.predict(np.array([input_data]))[0]
    return get_response(prediction)

# Ruta principal
@app.route('/')
def home():
    return render_template('index.html')

# Ruta para predecir
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'response': 'No se recibió ningún mensaje.'}), 400
    response = predict_intent(message)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
