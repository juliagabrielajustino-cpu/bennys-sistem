import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* ELEMENTOS DO MENU */

const nomeMenu = document.getElementById("nomeMenu");
const emailMenu = document.getElementById("emailMenu");

const botaoSair = document.getElementById("sair");

const abrirMenu = document.getElementById("abrirMenu");
const menuLateral = document.getElementById("menuLateral");
const fundoMenu = document.getElementById("fundoMenu");

const elementosAdmin =
    document.querySelectorAll(".somente-admin");


/* ELEMENTOS DO HISTÓRICO */

const filtroPeriodo =
    document.getElementById("filtroPeriodo");

const botaoAtualizar =
    document.getElementById("atualizar");

const listaHistorico =
    document.getElementById("listaHistorico");

const totalPeriodo =
    document.getElementById("totalPeriodo");

const quantidadeRegistros =
    document.getElementById("quantidadeRegistros");

const quantidadeFinalizados =
    document.getElementById("quantidadeFinalizados");

const quantidadeAbertos =
    document.getElementById("quantidadeAbertos");

const descricaoPeriodo =
    document.getElementById("descricaoPeriodo");


/* ESTADO */

let usuarioAtual = null;
let todosRegistros = [];


/* FUNÇÕES AUXILIARES */

function converterTimestampEmData(timestamp) {
    if (!timestamp) {
        return null;
    }

    if (typeof timestamp.toDate === "function") {
        return timestamp.toDate();
    }

    return new Date(timestamp);
}


function formatarData(data) {
    if (!data) {
        return "—";
    }

    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function formatarHorario(data) {
    if (!data) {
        return "—";
    }

    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatarDuracao(totalMinutos) {
    const minutosSeguros = Math.max(
        0,
        Math.floor(Number(totalMinutos) || 0)
    );

    const horas = Math.floor(minutosSeguros / 60);
    const minutos = minutosSeguros % 60;

    return (
        String(horas).padStart(2, "0") +
        "h" +
        String(minutos).padStart(2, "0") +
        "min"
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
    const nomePadrao =
        obterNomePeloEmail(usuario.email);

    nomeMenu.textContent = nomePadrao;
    emailMenu.textContent =
        usuario.email || "Sem e-mail";

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


/* FILTROS */

function inicioDoDia(data) {
    const resultado = new Date(data);

    resultado.setHours(0, 0, 0, 0);

    return resultado;
}


function obterInicioDaSemana() {
    const hoje = inicioDoDia(new Date());

    hoje.setDate(hoje.getDate() - 6);

    return hoje;
}


function obterInicioDoMes() {
    const hoje = new Date();

    return new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
    );
}


function registroDentroDoPeriodo(registro, periodo) {
    const entrada =
        converterTimestampEmData(registro.entrada);

    if (!entrada) {
        return false;
    }

    const agora = new Date();

    if (periodo === "hoje") {
        return (
            entrada >= inicioDoDia(agora)
        );
    }

    if (periodo === "semana") {
        return (
            entrada >= obterInicioDaSemana()
        );
    }

    if (periodo === "mes") {
        return (
            entrada >= obterInicioDoMes()
        );
    }

    return true;
}


function atualizarDescricaoPeriodo(periodo) {
    const textos = {
        todos: "Exibindo todos os seus registros.",
        hoje: "Exibindo os registros de hoje.",
        semana: "Exibindo os registros dos últimos 7 dias.",
        mes: "Exibindo os registros deste mês."
    };

    descricaoPeriodo.textContent =
        textos[periodo] ||
        textos.todos;
}


/* MONTAR REGISTRO */

function criarRegistroHTML(registro) {
    const entrada =
        converterTimestampEmData(registro.entrada);

    const saida =
        converterTimestampEmData(registro.saida);

    const aberto =
        registro.status === "aberto";

    const textoStatus =
        aberto ? "Em andamento" : "Finalizado";

    const classeStatus =
        aberto ? "aberto" : "finalizado";

    const duracao =
        aberto
            ? "Em andamento"
            : formatarDuracao(
                registro.totalMinutos
            );

    return `
        <article class="registro-historico">

            <div>
                <span>Data</span>

                <strong>
                    ${formatarData(entrada)}
                </strong>
            </div>

            <div>
                <span>Entrada</span>

                <strong>
                    ${formatarHorario(entrada)}
                </strong>
            </div>

            <div>
                <span>Saída</span>

                <strong>
                    ${formatarHorario(saida)}
                </strong>
            </div>

            <div>
                <span>Total</span>

                <strong>
                    ${duracao}
                </strong>
            </div>

            <div>
                <span>Status</span>

                <strong
                    class="status-registro ${classeStatus}"
                >
                    ${textoStatus}
                </strong>
            </div>

        </article>
    `;
}


/* EXIBIR HISTÓRICO */

function exibirHistorico() {
    const periodo = filtroPeriodo.value;

    atualizarDescricaoPeriodo(periodo);

    const registrosFiltrados =
        todosRegistros.filter((registro) =>
            registroDentroDoPeriodo(
                registro,
                periodo
            )
        );

    const finalizados =
        registrosFiltrados.filter(
            (registro) =>
                registro.status === "finalizado"
        );

    const abertos =
        registrosFiltrados.filter(
            (registro) =>
                registro.status === "aberto"
        );

    const minutosTotais =
        finalizados.reduce(
            (total, registro) =>
                total +
                (Number(registro.totalMinutos) || 0),
            0
        );

    quantidadeRegistros.textContent =
        registrosFiltrados.length;

    quantidadeFinalizados.textContent =
        finalizados.length;

    quantidadeAbertos.textContent =
        abertos.length;

    totalPeriodo.textContent =
        formatarDuracao(minutosTotais);

    if (registrosFiltrados.length === 0) {
        listaHistorico.innerHTML = `
            <p class="sem-registros">
                Nenhum registro encontrado neste período.
            </p>
        `;

        return;
    }

    listaHistorico.innerHTML =
        registrosFiltrados
            .map(criarRegistroHTML)
            .join("");
}


/* CARREGAR REGISTROS */

async function carregarHistorico() {
    if (!usuarioAtual) {
        return;
    }

    listaHistorico.innerHTML = `
        <p class="carregando">
            Carregando histórico...
        </p>
    `;

    botaoAtualizar.disabled = true;
    botaoAtualizar.textContent = "Atualizando...";

    try {
        const consulta = query(
            collection(db, "pontos"),
            where(
                "usuarioId",
                "==",
                usuarioAtual.uid
            )
        );

        const resultado = await getDocs(consulta);

        todosRegistros = resultado.docs.map(
            (documento) => ({
                id: documento.id,
                ...documento.data()
            })
        );

        todosRegistros.sort((a, b) => {
            const entradaA =
                converterTimestampEmData(a.entrada);

            const entradaB =
                converterTimestampEmData(b.entrada);

            return (
                (entradaB?.getTime() || 0) -
                (entradaA?.getTime() || 0)
            );
        });

        exibirHistorico();

    } catch (erro) {
        console.error(
            "Erro ao carregar histórico:",
            erro
        );

        listaHistorico.innerHTML = `
            <p class="erro-historico">
                Não foi possível carregar o histórico.
            </p>
        `;

    } finally {
        botaoAtualizar.disabled = false;
        botaoAtualizar.textContent = "Atualizar";
    }
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

filtroPeriodo.addEventListener(
    "change",
    exibirHistorico
);

botaoAtualizar.addEventListener(
    "click",
    carregarHistorico
);

botaoSair.addEventListener(
    "click",
    sairDaConta
);


/* PROTEGER E INICIAR */

onAuthStateChanged(
    auth,
    async (usuario) => {
        if (!usuario) {
            window.location.href =
                "../index.html";

            return;
        }

        usuarioAtual = usuario;

        await carregarPerfil(usuario);
        await carregarHistorico();
    }
);
