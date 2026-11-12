
// ============================================================
// WEBLUE - PÁGINA DE DETALHES DO PRODUTO
// ============================================================

const API_PRODUTO = "/api/produtos/catalogo/";
const CHAVE_CARRINHO = "weblue-carrinho";

// ============================================================
// ELEMENTOS HTML
// ============================================================

const mensagemProduto = document.getElementById("mensagemProduto");
const detalhesProduto = document.getElementById("detalhesProduto");

const imagemProduto = document.getElementById("imagemProduto");
const categoriaProduto = document.getElementById("categoriaProduto");
const nomeProduto = document.getElementById("nomeProduto");
const marcaProduto = document.getElementById("marcaProduto");
const descricaoProduto = document.getElementById("descricaoProduto");
const precoProduto = document.getElementById("precoProduto");
const estoqueProduto = document.getElementById("estoqueProduto");

const quantidadeProduto = document.getElementById("quantidadeProduto");
const diminuirQuantidade = document.getElementById("diminuirQuantidade");
const aumentarQuantidade = document.getElementById("aumentarQuantidade");

const adicionarCarrinho = document.getElementById("adicionarCarrinho");
const comprarAgora = document.getElementById("comprarAgora");

// ============================================================
// VARIÁVEIS
// ============================================================

let produtoAtual = null;
let quantidadeAtual = 1;

// ============================================================
// FORMATAR PREÇO
// ============================================================

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ============================================================
// OBTER ID DO PRODUTO PELA URL
// ============================================================

function obterIdProduto() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}

// ============================================================
// CARREGAR PRODUTO
// ============================================================

async function carregarProduto() {
    const id = obterIdProduto();

    if (!id || !/^\d+$/.test(id)) {
        mostrarErro("Produto não encontrado.");
        return;
    }

    try {
        const resposta = await fetch(
            `${API_PRODUTO}${encodeURIComponent(id)}`
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível encontrar este produto.");
        }

        const dados = await resposta.json();

        produtoAtual = dados.produto;

        if (!produtoAtual) {
            throw new Error("Produto não encontrado.");
        }

        exibirProduto(produtoAtual);

    } catch (erro) {
        console.error("Erro ao carregar produto:", erro);
        mostrarErro("Não foi possível carregar o produto. Tente novamente.");
    }
}

// ============================================================
// EXIBIR PRODUTO NA PÁGINA
// ============================================================

function exibirProduto(produto) {
    mensagemProduto.hidden = true;
    detalhesProduto.hidden = false;

    categoriaProduto.textContent = produto.categoria || "";
    nomeProduto.textContent = produto.nome || "Produto";
    marcaProduto.textContent = produto.marca
        ? `Marca: ${produto.marca}`
        : "";

    descricaoProduto.textContent =
        produto.descricao || "Descrição não disponível.";

    precoProduto.textContent = formatarPreco(produto.preco);

    const estoque = Number(produto.estoque) || 0;

    estoqueProduto.textContent = estoque > 0
        ? `${estoque} unidade(s) disponível(is)`
        : "Produto indisponível no momento.";

    imagemProduto.src = produto.imagem_url || "/img/produto-sem-imagem.png";
    imagemProduto.alt = produto.nome || "Imagem do produto";

    imagemProduto.onerror = function () {
        this.onerror = null;
        this.removeAttribute("src");
        this.alt = "Imagem não disponível";
    };

    atualizarQuantidade();

    if (estoque <= 0) {
        adicionarCarrinho.disabled = true;
        comprarAgora.disabled = true;

        adicionarCarrinho.textContent = "Produto indisponível";
    }
}

// ============================================================
// MOSTRAR ERRO
// ============================================================

function mostrarErro(mensagem) {
    mensagemProduto.textContent = mensagem;
    mensagemProduto.hidden = false;
    detalhesProduto.hidden = true;
}

// ============================================================
// ATUALIZAR QUANTIDADE
// ============================================================

function atualizarQuantidade() {
    quantidadeProduto.textContent = quantidadeAtual;
}

// ============================================================
// DIMINUIR QUANTIDADE
// ============================================================

diminuirQuantidade.addEventListener("click", function () {
    if (quantidadeAtual > 1) {
        quantidadeAtual--;
        atualizarQuantidade();
    }
});

// ============================================================
// AUMENTAR QUANTIDADE
// ============================================================

aumentarQuantidade.addEventListener("click", function () {
    if (!produtoAtual) return;

    const estoque = Number(produtoAtual.estoque) || 0;

    if (quantidadeAtual < estoque) {
        quantidadeAtual++;
        atualizarQuantidade();
    }
});

// ============================================================
// ADICIONAR PRODUTO À SACOLA
// ============================================================

function adicionarProdutoSacola() {
    if (!produtoAtual) return false;

    const estoque = Number(produtoAtual.estoque) || 0;

    if (estoque <= 0) {
        alert("Este produto está indisponível.");
        return false;
    }

    if (quantidadeAtual > estoque) {
        alert("Quantidade maior que o estoque disponível.");
        return false;
    }

    let carrinho = [];

    try {
        carrinho = JSON.parse(
            localStorage.getItem(CHAVE_CARRINHO)
        ) || [];

        if (!Array.isArray(carrinho)) {
            carrinho = [];
        }
    } catch (erro) {
        carrinho = [];
    }

    const itemExistente = carrinho.find(
        item => String(item.id) === String(produtoAtual.id)
    );

    if (itemExistente) {
        const novaQuantidade =
            Number(itemExistente.quantidade || 0) + quantidadeAtual;

        if (novaQuantidade > estoque) {
            alert("Não há estoque suficiente para essa quantidade.");
            return false;
        }

        itemExistente.quantidade = novaQuantidade;

    } else {
        carrinho.push({
            id: produtoAtual.id,
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            imagem_url: produtoAtual.imagem_url,
            quantidade: quantidadeAtual
        });
    }

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(carrinho)
    );

    return true;
}

// ============================================================
// BOTÃO ADICIONAR À SACOLA
// ============================================================

adicionarCarrinho.addEventListener("click", function () {
    if (adicionarProdutoSacola()) {
        alert("Produto adicionado à sua sacola!");
    }
});

// ============================================================
// BOTÃO COMPRAR AGORA
// ============================================================

comprarAgora.addEventListener("click", function () {
    if (adicionarProdutoSacola()) {
        window.location.href = "/carrinho";
    }
});

// ============================================================
// INICIAR PÁGINA
// ============================================================

carregarProduto();
