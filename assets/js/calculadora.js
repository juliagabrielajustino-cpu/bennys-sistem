import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* PREÇOS */

const precos = {
    pneu: 500,
    chave: 1000,
    kitBasico: 1000,
    kitAvancado: 3000,
    reparinho: 1000
};

const nomes = {
    pneu: "Pneu",
    chave: "Chave Inglesa",
    kitBasico: "Kit Básico",
    kitAvancado: "Kit Avançado",
    reparinho: "Reparinho"
};


/* ELEMENTOS DO MENU */

const nomeMenu = document.getElementById("nomeMenu");
const emailMenu = document.getElementById("emailMenu");

const botaoSair = document.getElementById("sair");

const abrirMenu = document.getElementById("abrirMenu");
const menuLateral = document.getElementById("menuLateral");
const fundoMenu = document.getElementById("fundoMenu");

const elementosAdmin =
    document.querySelectorAll(".somente-admin");


/* ELEMENTOS DA CALCULADORA */

const camposServicos = {
    pneu: document.getElementById("pneu"),
    chave: document.getElementById("chave"),
    kitBasico: document.getElementById("kitBasico"),
    kitAvancado: document.getElementById("kitAvancado"),
    reparinho: document.getElementById("reparinho")
};

const usarTuning =
    document.getElementById("usarTuning");

const campoTuning =
    document.getElementById("campoTuning");

const tuning =
    document.getElementById("tuning");

const valorTuningFinal =
    document.getElementById("valorTuningFinal");

const atendimentoExterno =
    document.getElementById("atendimentoExterno");

const campoLocal =
    document.getElementById("campoLocal");

const local =
    document.getElementById("local");

const botaoCalcular =
    document.getElementById("calcular");

const botaoLimpar =
    document.getElementById("limpar");


/* ELEMENTOS DO ORÇAMENTO */

const resumoServicos =
    document.getElementById("resumoServicos");

const subtotalServicosElemento =
    document.getElementById("subtotalServicos");

const valorDescontoElemento =
    document.getElementById("valorDesconto");

const servicosComDescontoElemento =
    document.getElementById("servicosComDesconto");

const valorTuningResumoElemento =
    document.getElementById("valorTuningResumo");

const valorDeslocamentoElemento =
    document.getElementById("valorDeslocamento");

const resultadoElemento =
    document.getElementById("resultado");


/* FUNÇÕES AUXILIARES */

function formatarDinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function obterQuantidade(campo) {
    const valor = Number(campo.value);

    if (!Number.isFinite(valor) || valor < 0) {
        return 0;
    }

    return Math.floor(valor);
}


function obterParceriaSelecionada() {
    return document.querySelector(
        'input[name="parceria"]:checked'
    );
}


function obterNomePeloEmail(email) {
    if (!email) {
        return "Funcionário";
    }

    return email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letra) =>
            letra.toUpperCase()
        );
}


/* MENU MOBILE */

function alternarMenu() {
    menuLateral.classList.toggle("aberto");
    fundoMenu.classList.toggle("ativo");
}


function fecharMenu() {
    menuLateral.classList.remove("aberto");
    fundoMenu.classList.remove("ativo");
}


abrirMenu.addEventListener("click", alternarMenu);
fundoMenu.addEventListener("click", fecharMenu);


/* PERFIL */

async function carregarPerfil(usuario) {
    const nomePadrao = obterNomePeloEmail(usuario.email);

    nomeMenu.textContent = nomePadrao;
    emailMenu.textContent = usuario.email || "Sem e-mail";

    elementosAdmin.forEach((elemento) => {
        elemento.style.display = "none";
    });

    try {
        const referenciaUsuario = doc(
            db,
            "usuarios",
            usuario.uid
        );

        const documentoUsuario = await getDoc(
            referenciaUsuario
        );

        if (!documentoUsuario.exists()) {
            return;
        }

        const dados = documentoUsuario.data();

        nomeMenu.textContent =
            dados.nome || nomePadrao;

        const cargo = String(
            dados.cargo || "Funcionário"
        )
            .trim()
            .toLowerCase();

        const administrador =
            cargo === "administrador" ||
            cargo === "admin" ||
            cargo === "dono";

        if (administrador) {
            elementosAdmin.forEach((elemento) => {
                elemento.style.display = "flex";
            });
        }

    } catch (erro) {
        console.error(
            "Erro ao carregar perfil:",
            erro
        );
    }
}


/* MOSTRAR E ESCONDER CAMPOS */

function atualizarCamposVisiveis() {
    campoTuning.classList.toggle(
        "ativo",
        usarTuning.checked
    );

    campoLocal.classList.toggle(
        "ativo",
        atendimentoExterno.checked
    );
}


/* CÁLCULO */

function calcular() {
    let subtotalServicos = 0;
    let itensResumo = "";

    for (const servico in camposServicos) {
        const quantidade = obterQuantidade(
            camposServicos[servico]
        );

        if (quantidade > 0) {
            const valorItem =
                quantidade * precos[servico];

            subtotalServicos += valorItem;

            itensResumo += `
                <div class="item-resumo">

                    <span>
                        ${nomes[servico]} (${quantidade}x)
                    </span>

                    <strong>
                        ${formatarDinheiro(valorItem)}
                    </strong>

                </div>
            `;
        }
    }

    const parceriaSelecionada =
        obterParceriaSelecionada();

    const percentualDesconto =
        parceriaSelecionada
            ? Number(parceriaSelecionada.value)
            : 0;

    /*
        O desconto entra somente nos serviços.
    */

    const valorDesconto =
        subtotalServicos *
        (percentualDesconto / 100);

    const servicosComDesconto =
        subtotalServicos - valorDesconto;

    /*
        Tuning sempre recebe +30%.
        A parceria não altera o tuning.
    */

    let tuningFinal = 0;

    if (usarTuning.checked) {
        const valorOriginalTuning =
            Math.max(
                0,
                Number(tuning.value) || 0
            );

        tuningFinal =
            valorOriginalTuning * 1.30;
    }

    /*
        O deslocamento só é somado quando
        atendimento externo estiver marcado.
    */

    let deslocamento = 0;

    if (atendimentoExterno.checked) {
        deslocamento =
            Math.max(
                0,
                Number(local.value) || 0
            );
    }

    const total =
        servicosComDesconto +
        tuningFinal +
        deslocamento;

    resumoServicos.innerHTML =
        itensResumo || `
            <p class="vazio">
                Nenhum serviço selecionado.
            </p>
        `;

    subtotalServicosElemento.textContent =
        formatarDinheiro(subtotalServicos);

    valorDescontoElemento.textContent =
        valorDesconto > 0
            ? "- " + formatarDinheiro(valorDesconto)
            : formatarDinheiro(0);

    servicosComDescontoElemento.textContent =
        formatarDinheiro(servicosComDesconto);

    valorTuningFinal.textContent =
        formatarDinheiro(tuningFinal);

    valorTuningResumoElemento.textContent =
        formatarDinheiro(tuningFinal);

    valorDeslocamentoElemento.textContent =
        deslocamento > 0
            ? "+ " + formatarDinheiro(deslocamento)
            : formatarDinheiro(0);

    resultadoElemento.textContent =
        formatarDinheiro(total);
}


/* LIMPAR */

function limpar() {
    Object.values(camposServicos).forEach((campo) => {
        campo.value = 0;
    });

    usarTuning.checked = false;
    tuning.value = 0;

    atendimentoExterno.checked = false;
    local.selectedIndex = 0;

    const semParceria = document.querySelector(
        'input[name="parceria"][value="0"]'
    );

    if (semParceria) {
        semParceria.checked = true;
    }

    atualizarCamposVisiveis();
    calcular();
}


/* LOGOUT */

async function sairDaConta() {
    try {
        await signOut(auth);

        window.location.href =
            "../index.html";

    } catch (erro) {
        console.error(
            "Erro ao sair da conta:",
            erro
        );
    }
}


/* EVENTOS */

botaoCalcular.addEventListener(
    "click",
    calcular
);

botaoLimpar.addEventListener(
    "click",
    limpar
);

botaoSair.addEventListener(
    "click",
    sairDaConta
);

usarTuning.addEventListener(
    "change",
    () => {
        atualizarCamposVisiveis();
        calcular();
    }
);

atendimentoExterno.addEventListener(
    "change",
    () => {
        atualizarCamposVisiveis();
        calcular();
    }
);

tuning.addEventListener(
    "input",
    calcular
);

local.addEventListener(
    "change",
    calcular
);

Object.values(camposServicos).forEach((campo) => {
    campo.addEventListener(
        "input",
        calcular
    );
});

document
    .querySelectorAll('input[name="parceria"]')
    .forEach((opcao) => {
        opcao.addEventListener(
            "change",
            calcular
        );
    });


/* PROTEGER E INICIAR A PÁGINA */

onAuthStateChanged(
    auth,
    async (usuario) => {
        if (!usuario) {
            window.location.href =
                "../index.html";

            return;
        }

        await carregarPerfil(usuario);

        atualizarCamposVisiveis();
        calcular();
    }
);
