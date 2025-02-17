import json
import random
import os
import numpy as np
import pickle
import nltk
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import Dense, Dropout, Input # type: ignore
from tensorflow.keras.optimizers import SGD # type: ignore
from tensorflow.keras.optimizers.schedules import ExponentialDecay # type: ignore

# Verifica si el archivo JSON existe
if not os.path.isfile('intents_spanish.json'):
    print("El archivo intents_spanish.json no se encuentra.")
    exit()

# Carga del archivo JSON con las intenciones
try:
    date_file = open('intents_spanish.json', 'r', encoding='utf-8').read()
    intents = json.loads(date_file)
except Exception as e:
    print("Error al cargar el archivo JSON:", e)
    exit()

lemmatizer = WordNetLemmatizer()
words = []
classes = []
documents = []
ignore_words = ['?', '!']

# Recorre cada intención y sus patrones en el archivo JSON
for intent in intents['intents']:
    for pattern in intent['patterns']:
        w = nltk.word_tokenize(pattern)
        words.extend(w)
        documents.append((w, intent['tag']))
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

# Lematiza las palabras y las convierte en minúsculas, excluyendo las palabras ignoradas
words = [lemmatizer.lemmatize(w.lower()) for w in words if w not in ignore_words]
words = sorted(list(set(words)))
classes = sorted(list(set(classes)))

# Guarda las listas de palabras y clases en archivos pickle
pickle.dump(words, open('words.pkl', 'wb'))
pickle.dump(classes, open('classes.pkl', 'wb'))

training = []
output_empty = [0] * len(classes)

# Crea el conjunto de entrenamiento
for doc in documents:
    bag = []
    pattern_words = doc[0]
    pattern_words = [lemmatizer.lemmatize(word.lower()) for word in pattern_words]
    for word in words:
        bag.append(1) if word in pattern_words else bag.append(0)
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    training.append([bag, output_row])

# Mezcla aleatoriamente el conjunto de entrenamiento
random.shuffle(training)

# Divide el conjunto de entrenamiento en características (train_x) y etiquetas (train_y)
train_x = np.array([row[0] for row in training])
train_y = np.array([row[1] for row in training])

# Crea el modelo de red neuronal
model = Sequential()
model.add(Input(shape=(len(train_x[0]),)))  # Capa de entrada explícita
model.add(Dense(128, activation='relu'))      # Primera capa oculta
model.add(Dropout(0.5))
model.add(Dense(64, activation='relu'))       # Segunda capa oculta
model.add(Dropout(0.5))
model.add(Dense(len(train_y[0]), activation='softmax'))  # Capa de salida

# Configura el optimizador con una tasa de aprendizaje exponencialmente decreciente
lr_schedule = ExponentialDecay(
    initial_learning_rate=0.01,
    decay_steps=10000,
    decay_rate=0.9
)

sgd = SGD(learning_rate=lr_schedule, momentum=0.9, nesterov=True)
model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])

# Entrena el modelo con el conjunto de entrenamiento
hist = model.fit(train_x, train_y, epochs=200, batch_size=5, verbose=1)

# Guarda el modelo entrenado en un archivo h5
model.save('chatbot_model.h5')

print("Modelo creado y guardado.")
