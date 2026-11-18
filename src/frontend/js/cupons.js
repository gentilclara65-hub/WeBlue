
const listaCupons = document.getElementById("lista-cupons");
const mensagemCarregamento = document.getElementById("mensagem-carregamento");
const mensagemErro = document.getElementById("mensagem-erro");
const contadorCupons = document.getElementById("contador-cupons");

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

function criarCardCupom(cupom) {
    const card = criarElemento("article", "cupom-card");

    const desconto = criarElemento(
        "h3",
        "cupom-desconto",
        cupom.descricao
    );

    const codigoArea = criarElemento("div", "cupom-codigo-area");

    const codigo = criarElemento(
        "span",
        "cupom-codigo",
        cupom.codigo
    );

    const botaoCopiar = criarElemento(
        "button",
        "botao-copiar",
        "Copiar código"
    );

    botaoCopiar.type = "button";
    botaoCopiar.setAttribute(
        "aria-label",
        `Copiar código ${cupom.codigo}`
    );

    botaoCopiar.addEventListener("click", async () => {
        const textoOriginal = "Copiar código";

        try {
            await copiarTexto(cupom.codigo);
            botaoCopiar.textContent = "Copiado!";
        } catch (erro) {
            botaoCopiar.textContent = "Não foi possível copiar";
        }

        botaoCopiar.disabled = true;

        setTimeout(() => {
            botaoCopiar.textContent = textoOriginal;
            botaoCopiar.disabled = false;
        }, 1800);
    });

    codigoArea.append(codigo, botaoCopiar);

    const condicoes = criarElemento("div", "cupom-condicoes");

    const minimo = criarElemento("p");
    const minimoLabel = criarElemento("strong", "", "Compra mínima: ");
    minimo.append(minimoLabel, document.createTextNode(formatarMoeda(cupom.minimo)));

    condicoes.append(minimo);

    if (cupom.limite !== null && cupom.limite !== undefined) {
        const limite = criarElemento("p");
        const limiteLabel = criarElemento("strong", "", "Desconto máximo: ");

        limite.append(
            limiteLabel,
            document.createTextNode(formatarMoeda(cupom.limite))
        );

        condicoes.append(limite);
    }

    card.append(desconto, codigoArea, condicoes);

    return card;
}

async function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return;
    }

    const campoTemporario = document.createElement("textarea");

    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "");
    campoTemporario.style.position = "absolute";
    campoTemporario.style.left = "-9999px";

    document.body.appendChild(campoTemporario);
    campoTemporario.select();

    const copiou = document.execCommand("copy");

    campoTemporario.remove();

    if (!copiou) {
        throw new Error("Não foi possível copiar o código.");
    }
}

async function carregarCupons() {
    mensagemCarregamento.hidden = false;
    mensagemErro.hidden = true;
    listaCupons.replaceChildren();

    try {
        const resposta = await fetch("/api/cupons");

        if (!resposta.ok) {
            throw new Error("Erro ao consultar os cupons.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados.cupons)) {
            throw new Error("A resposta da API está em formato inválido.");
        }

        if (dados.cupons.length === 0) {
            mensagemCarregamento.textContent =
                "Não há cupons disponíveis no momento.";

            contadorCupons.textContent = "0 cupons";
            return;
        }

        dados.cupons.forEach((cupom) => {
            listaCupons.appendChild(criarCardCupom(cupom));
        });

        contadorCupons.textContent =
            `${dados.cupons.length} cupons`;

        mensagemCarregamento.hidden = true;

    } catch (erro) {
        console.error("Erro ao carregar cupons:", erro);

        mensagemCarregamento.hidden = true;
        mensagemErro.hidden = false;
        contadorCupons.textContent = "Indisponível";
    }
}

carregarCupons();
