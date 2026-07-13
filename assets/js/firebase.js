// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

// Authentication
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Configuração do seu projeto
const firebaseConfig = {
    apiKey: "AIzaSyDDWnC0tr3NOwtra5YbBTeZRvhUKSwGOS0",
    authDomain: "bennys-pontos.firebaseapp.com",
    projectId: "bennys-pontos",
    storageBucket: "bennys-pontos.firebasestorage.app",
    messagingSenderId: "889151192731",
    appId: "1:889151192731:web:fb0eecc0e8b1a46f09d03e",
    measurementId: "G-8D0NNNQBXK"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Serviços
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta para os outros arquivos
export { auth, db };
