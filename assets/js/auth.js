import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    mensagem.innerHTML = "";

    try {

        await signInWithEmailAndPassword(
            auth,
            email.value,
            senha.value
        );

        window.location.href = "pages/dashboard.html";

    } catch (erro) {

        mensagem.innerHTML =
            "E-mail ou senha inválidos.";

    }

});

// Se já estiver logado, vai direto para o dashboard
onAuthStateChanged(auth, (user) => {

    if (user) {

        window.location.href =
            "pages/dashboard.html";

    }

});
