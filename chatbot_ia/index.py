import streamlit as st
from chatbot import predict_class, get_response, intents

st.markdown(
    """
    <style>
    
    /* COLOR DE FONDO DE LA PAGINA */
    .stApp {
        background-color: #033569
    } 
    .st-emotion-cache-128upt6.ea3mdgi6 {
    background-color: #0a3c70;
    }
    
    /* PERSONALIZACION DEL TITULO */
    .stTitle {
        color: #f7f7f7; 
        font-size: 30px;
        font-weight: bold;
    }
    
    /* ESTILO DE CUADRO DE ENTRADA */
    .stTextInput > div > div {
        background-color: #033569;
        border-radius: 10px;
    }
    
    /* ESTILO DEL BOTON */
    .stButton > button {
        background-color: #000000;  
        color: Black;
        border-radius: 10px;
        padding: 5px 20px;
        font-size: 16px;
    }
    
    /* BURBUJAS DEL CHAT */
    .chat-bubble {
        background-color: #e61212; 
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
    }
    
    /* BURBUJAS DEL ASISTENTE */
    .assistant-bubble {
        background-color: #d1e7ff;  
        color: #0056b3; 
    }
    
    /* BURBUJAS DEL USUARIO */
    .user-bubble {
        background-color: #ffd1d1;  
        color: #cc0000;  
    }
    
    </style>
    """,
    unsafe_allow_html=True
)

# LOGO Y TÍTULO
col1, col2 = st.columns([1, 3])

with col1:
    st.image("logo_ers-Photoroom.png", width=150)

with col2:
    st.markdown('<div class="stTitle">Asistente Virtual</div>', unsafe_allow_html=True)

# INICIALIZAR ESTADO DE LA SESIÓN DE LOS MENSAJES 
if "messages" not in st.session_state:
    st.session_state.messages = []
if "first_message" not in st.session_state:
    st.session_state.first_message = True

# MOSTRAR MENSAJES EXISTENTES
for message in st.session_state.messages:
    bubble_class = "assistant-bubble" if message["role"] == "assistant" else "user-bubble"
    with st.chat_message(message["role"]):
        st.markdown(f'<div class="chat-bubble {bubble_class}">{message["content"]}</div>', unsafe_allow_html=True)

# MOSTRAR EN PRIMER MENSAJE DEL ASISTENTE 
if st.session_state.first_message:
    with st.chat_message("assistant"):
        st.markdown('<div class="chat-bubble assistant-bubble">¡Hola!, Soy el asistente virtual de ERS, estoy aqui para ayudarte</div>', unsafe_allow_html=True)
    st.session_state.messages.append({"role": "assistant", "content": "¡Hola!, Soy el asistente virtual de ERS, estoy aqui para ayudarte"})
    st.session_state.first_message = False

# CAPTURAR ENTRADA 
if prompt := st.chat_input("Escribe tu mensaje aquí..."):

    # MENSAJE DE USUARIO 
    with st.chat_message("user"):
        st.markdown(f'<div class="chat-bubble user-bubble">{prompt}</div>', unsafe_allow_html=True)
    st.session_state.messages.append({"role": "user", "content": prompt})

    insts = predict_class(prompt)
    res = get_response(insts, intents)
    
    # RESPUESTA DEL ASISTENTE 
    with st.chat_message("assistant"):
        st.markdown(f'<div class="chat-bubble assistant-bubble">{res}</div>', unsafe_allow_html=True)
    st.session_state.messages.append({"role": "assistant", "content": res})
