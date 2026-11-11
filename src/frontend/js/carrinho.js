
/* ============================================================
   WEBLUE - CARRINHO DE COMPRAS
   ============================================================ */

const CHAVE_CARRINHO = "weblue-carrinho";
const CHAVE_CUPOM = "weblue-cupom";
const CHAVE_PAGAMENTO = "weblue-pagamento";

const listaCarrinho = document.getElementById("listaCarrinho");
const mensagemCarrinho = document.getElementById("mensagemCarrinho");
const quantidadeItens = document.getElementById("quantidadeItens");
const subtotalCarrinho = document.getElementById("subtotalCarrinho");
const descontoCarrinho = document.getElementById("descontoCarrinho");
const totalCarrinho = document.getElementById("totalCarrinho");

const codigoCupom = document.getElementById("codigoCupom");
const botaoAplicarCupom = document.getElementById("botaoAplicarCupom");
const mensagemCupom = document.getElementById("mensagemCupom");
const removerCupom = document.getElementById("removerCupom");

const mensagemPagamento = document.getElementById("mensagemPagamento");
const botaoCheckout = document.getElementById("botaoCheckout");

function obterCarrinho() {
    try {
        const salvo = localStorage.getItem(CHAVE_CARRINHO);
        return salvo ? JSON.parse(salvo) : [];
    } catch (erro) {
        console.error("Erro ao ler o carrinho:", erro);
        return [];
    }
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(valor) || 0);
}

function atualizarContadorCarrinho() {
    const carrinho = obterCarrinho();

    const quantidade = carrinho.reduce(
        (soma, item) => soma + Number(item.quantidade || 0),
        0
    );

    const contador = document.getElementById("contadorCarrinho");

    if (contador) {
        contador.textContent = String(quantidade);
    }
}

function alterarQuantidade(produtoId, delta) {
    const carrinho = obterCarrinho();

    const item = carrinho.find(
        produto => String(produto.id) === String(produtoId)
    );

    if (!item) return;

    item.quantidade = Math.max(
        1,
        Number(item.quantidade || 1) + delta
    );

    salvarCarrinho(carrinho);
    renderCarrinho();
}

function removerDoCarrinho(produtoId) {
    const carrinho = obterCarrinho().filter(
        produto => String(produto.id) !== String(produtoId)
    );

    salvarCarrinho(carrinho);
    renderCarrinho();
}

function obterCupom() {
    return localStorage.getItem(CHAVE_CUPOM) || "";
}

function obterPagamento() {
    return localStorage.getItem(CHAVE_PAGAMENTO) || "";
}

function renderCarrinho() {
    const carrinho = obterCarrinho();

    atualizarContadorCarrinho();

    if (!listaCarrinho) return;

    if (!carrinho.length) {
        listaCarrinho.replaceChildren();

        mensagemCarrinho.textContent =
            "Seu carrinho está vazio. Adicione produtos para continuar.";

        quantidadeItens.textContent = "0 itens";
        subtotalCarrinho.textContent = formatarPreco(0);
        descontoCarrinho.textContent = formatarPreco(0);
        totalCarrinho.textContent = formatarPreco(0);

        return;
    }

    mensagemCarrinho.textContent = "";

    let subtotal = 0;
    let quantidadeTotal = 0;

    const fragmento = document.createDocumentFragment();

    carrinho.forEach(item => {
        const quantidade = Number(item.quantidade || 0);
        const preco = Number(item.preco || 0);
        const valorSubtotal = preco * quantidade;

        subtotal += valorSubtotal;
        quantidadeTotal += quantidade;

        const artigo = document.createElement("article");
        artigo.className = "item";

        const detalhes = document.createElement("div");

        const nome = document.createElement("h3");
        nome.textContent = item.nome || "Produto WeBlue";

        const precoUnitario = document.createElement("p");
        precoUnitario.textContent =
            `${formatarPreco(preco)} cada`;

        const controles = document.createElement("div");
        controles.className = "controls";

        function criarBotao(acao, texto, classe = "", rotulo = "") {
            const botao = document.createElement("button");

            botao.type = "button";
            botao.dataset.acao = acao;
            botao.dataset.id = String(item.id);
            botao.textContent = texto;

            if (classe) {
                botao.className = classe;
            }

            if (rotulo) {
                botao.setAttribute("aria-label", rotulo);
            }

            return botao;
        }

        const diminuir = criarBotao(
            "diminuir", "-", "", "Diminuir quantidade"
        );

        const quantidadeTexto = document.createElement("span");
        quantidadeTexto.textContent = String(quantidade);

        const aumentar = criarBotao(
            "aumentar", "+", "", "Aumentar quantidade"
        );

        const remover = criarBotao(
            "remover", "Remover", "btn-secondary",
            "Remover produto do carrinho"
        );

        controles.append(
            diminuir,
            quantidadeTexto,
            aumentar,
            remover
        );

        detalhes.append(nome, precoUnitario, controles);

        const subtotalTexto = document.createElement("strong");
        subtotalTexto.textContent = formatarPreco(valorSubtotal);

        artigo.append(detalhes, subtotalTexto);
        fragmento.appendChild(artigo);
    });

    listaCarrinho.replaceChildren(fragmento);

    quantidadeItens.textContent =
        `${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`;

    subtotalCarrinho.textContent = formatarPreco(subtotal);

    // O desconto só é calculado quando houver uma regra de cupom validada.
    // Não aplicar descontos fictícios no navegador.
    descontoCarrinho.textContent = formatarPreco(0);
    totalCarrinho.textContent = formatarPreco(subtotal);
}

listaCarrinho.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-acao]");

    if (!botao || !listaCarrinho.contains(botao)) return;

    const acao = botao.dataset.acao;
    const produtoId = botao.dataset.id;

    if (acao === "aumentar") {
        alterarQuantidade(produtoId, 1);
    }

    if (acao === "diminuir") {
        alterarQuantidade(produtoId, -1);
    }

    if (acao === "remover") {
        removerDoCarrinho(produtoId);
    }
});

/* CUPOM */

function mostrarMensagemCupom(texto, tipo = "") {
    mensagemCupom.textContent = texto;
    mensagemCupom.className = `coupon-message ${tipo}`;
}

function carregarCupom() {
    const cupom = obterCupom();

    if (cupom) {
        codigoCupom.value = cupom;
        mostrarMensagemCupom(
            "Cupom registrado para validação na finalização da compra."
        );
        removerCupom.style.display = "inline-block";
    }
}

botaoAplicarCupom.addEventListener("click", () => {
    const cupom = codigoCupom.value.trim().toUpperCase();

    if (!cupom) {
        mostrarMensagemCupom(
            "Digite um código de cupom.",
            "erro"
        );
        return;
    }

    localStorage.setItem(CHAVE_CUPOM, cupom);

    mostrarMensagemCupom(
        "Cupom registrado! A validade e o desconto serão verificados no checkout.",
        "sucesso"
    );

    removerCupom.style.display = "inline-block";
});

removerCupom.addEventListener("click", () => {
    localStorage.removeItem(CHAVE_CUPOM);

    codigoCupom.value = "";
    removerCupom.style.display = "none";

    mostrarMensagemCupom("Cupom removido.");
});

/* PAGAMENTO */

function carregarPagamento() {
    const pagamento = obterPagamento();

    if (!pagamento) return;

    const opcao = document.querySelector(
        `input[name="formaPagamento"][value="${pagamento}"]`
    );

    if (opcao) {
        opcao.checked = true;
        atualizarMensagemPagamento(pagamento);
    }
}

function atualizarMensagemPagamento(pagamento) {
    const nomes = {
        credito: "Cartão de crédito",
        debito: "Cartão de débito",
        pix: "Pix"
    };

    mensagemPagamento.textContent =
        `Forma selecionada: ${nomes[pagamento]}.`;
}

document.querySelectorAll('input[name="formaPagamento"]').forEach(opcao => {
    opcao.addEventListener("change", () => {
        localStorage.setItem(CHAVE_PAGAMENTO, opcao.value);
        atualizarMensagemPagamento(opcao.value);
    });
});

/* CONTINUAR PARA O CHECKOUT */

botaoCheckout.addEventListener("click", evento => {
    const carrinho = obterCarrinho();
    const pagamento = obterPagamento();

    if (!carrinho.length) {
        evento.preventDefault();
        alert("Adicione pelo menos um produto ao carrinho.");
        return;
    }

    if (!pagamento) {
        evento.preventDefault();
        mensagemPagamento.textContent =
            "Escolha uma forma de pagamento para continuar.";

        mensagemPagamento.style.color = "#c03939";
        return;
    }

    // Os dados ficam disponíveis para a página de checkout.
    localStorage.setItem(CHAVE_PAGAMENTO, pagamento);
});

/* INICIALIZAÇÃO */

carregarCupom();
carregarPagamento();
renderCarrinho();
