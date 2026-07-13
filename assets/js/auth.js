import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const form = document.getElementById("loginForm");
const campoId = document.getElementById("idFuncionario");
const campoSenha = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");


function limparId(valor) {
    return valor
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/g, "");
}


function criarEmailInterno(idFuncionario) {
    return `${idFuncionario}@bennys.local`;
}


function traduzirErro(codigo) {
    const erros = {
        "auth/invalid-credential":
            "ID ou senha incorretos.",

        "auth/invalid-email":
            "O ID informado não é válido.",

        "auth/user-disabled":
            "Esta conta está desativada.",

        "auth/too-many-requests":
            "Muitas tentativas. Aguarde e tente novamente.",

        "auth/network-request-failed":
            "Verifique sua conexão com a internet."
    };

    return erros[codigo] ||
        "Não foi possível entrar no sistema.";
}


form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const idFuncionario = limparId(campoId.value);
    const senha = campoSenha.value;

    mensagem.textContent = "";

    if (!idFuncionario) {
        mensagem.textContent =
            "Digite o ID do funcionário.";

        campoId.focus();
        return;
    }

    if (!senha) {
        mensagem.textContent =
            "Digite sua senha.";

        campoSenha.focus();
        return;
    }

    const emailInterno =
        criarEmailInterno(idFuncionario);

    const botao = form.querySelector(
        'button[type="submit"]'
    );

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
        await signInWithEmailAndPassword(
            auth,
            emailInterno,
            senha
        );

        window.location.href =
            "pages/dashboard.html";

    } catch (erro) {
        console.error("Erro no login:", erro);

        mensagem.textContent =
            traduzirErro(erro.code);

    } finally {
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});


onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        window.location.href =
            "pages/dashboard.html";
    }
});
