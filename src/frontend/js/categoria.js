
/* ============================================================
   WEBLUE BEAUTY - JAVASCRIPT DA PÁGINA DE CATEGORIAS
============================================================ */

const API_PRODUTOS = "/api/produtos/catalogo";
const CHAVE_CARRINHO = "weblue-carrinho";

// ELEMENTOS HTML

const tituloCategoria = document.getElementById("tituloCategoria");
const breadcrumbCategoria = document.getElementById("breadcrumbCategoria");
const descricaoCategoria = document.getElementById("descricaoCategoria");

const listaSubcategorias = document.getElementById("listaSubcategorias");
const listaProdutos = document.getElementById("listaProdutos");

const mensagemProdutos = document.getElementById("mensagemProdutos");
const quantidadeProdutos = document.getElementById("quantidadeProdutos");
const tituloProdutos = document.getElementById("tituloProdutos");

const ordenacaoProdutos = document.getElementById("ordenacaoProdutos");

const botaoCarrinho = document.getElementById("botaoCarrinho");
const contadorCarrinho = document.getElementById("contadorCarrinho");

// CATEGORIA RECEBIDA PELA URL

const parametros = new URLSearchParams(window.location.search);

const categoriaAtual = parametros.get("categoria") || "Todas";

let produtosCarregados = [];
let subcategoriaSelecionada = "Todas";

// SUBCATEGORIAS

const subcategoriasPorCategoria = {
    "Skincare": [
        "Todas",
        "Limpeza facial",
        "Hidratantes",
        "Séruns",
        "Protetor solar",
        "Máscaras faciais"
    ],

    "Maquiagem": [
        "Todas",
        "Base",
        "Corretivo",
        "Pó",
        "Blush",
        "Batom",
        "Máscara de cílios"
    ],

    "Cabelos": [
        "Todas",
        "Shampoo",
        "Condicionador",
        "Máscaras capilares",
        "Finalizadores",
        "Tratamentos"
    ],

    "Corpo e Banho": [
        "Todas",
        "Hidratantes corporais",
        "Sabonetes",
        "Óleos corporais",
        "Esfoliantes"
    ],

    "Fragrâncias": [
        "Todas",
        "Perfumes",
        "Body splash",
        "Desodorantes"
    ],

    "Masculino": [
        "Todas",
        "Barba",
        "Cabelo",
        "Cuidados pessoais",
        "Fragrâncias"
    ],

    "Infantil": [
        "Todas",
        "Higiene infantil",
        "Cuidados com a pele",
        "Cabelos"
    ],

    "Kits e Presentes": [
        "Todas",
        "Kits de beleza",
        "Kits de skincare",
        "Kits de maquiagem",
        "Presentes"
    ],

    "Ofertas": [
        "Todas",
        "Skincare",
        "Maquiagem",
        "Cabelos",
        "Corpo e Banho",
        "Fragrâncias"
    ],

    "Cupons": [
        "Todas"
    ],

    "Vale-compras": [
        "Todas"
    ]
};

// NORMALIZAR TEXTO

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// FORMATAR PREÇO

function formatarPreco(preco) {
    const valor = Number(preco);

    if (!Number.isFinite(valor)) {
        return "Consulte o preço";
    }

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// OBTER NOME DO PRODUTO

function obterNome(produto) {
    return produto.nome || produto.titulo || produto.name || "Produto";
}

// OBTER CATEGORIA DO PRODUTO

function obterCategoria(produto) {
    return produto.categoria || produto.category || "";
}

// OBTER SUBCATEGORIA DO PRODUTO

function obterSubcategoria(produto) {
    return produto.subcategoria || produto.sub_categoria || "";
}

// OBTER IMAGEM DO PRODUTO

function obterImagem(produto) {
    return produto.imagem ||
        produto.foto ||
        produto.url_imagem ||
        produto.image ||
        "";
}

// CONFIGURAR TÍTULO

function configurarPagina() {

    if (tituloCategoria) {
        tituloCategoria.textContent = categoriaAtual;
    }

    if (breadcrumbCategoria) {
        breadcrumbCategoria.textContent = categoriaAtual;
    }

    if (tituloProdutos) {
        tituloProdutos.textContent = categoriaAtual;
    }

    if (descricaoCategoria) {
        descricaoCategoria.textContent =
            `Confira nossos produtos de ${categoriaAtual} e encontre seus favoritos.`;
    }

    document.title = `${categoriaAtual} | WeBlue Beauty`;
}

// CRIAR SUBCATEGORIAS

function carregarSubcategorias() {

    if (!listaSubcategorias) return;

    listaSubcategorias.innerHTML = "";

    const subcategorias =
        subcategoriasPorCategoria[categoriaAtual] || ["Todas"];

    subcategorias.forEach(subcategoria => {

        const botao = document.createElement("button");

        botao.type = "button";
        botao.className =
            "subcategoria" +
            (subcategoria === "Todas" ? " ativa" : "");

        botao.textContent = subcategoria;
        botao.dataset.subcategoria = subcategoria;

        botao.addEventListener("click", () => {

            subcategoriaSelecionada = subcategoria;

            document.querySelectorAll(".subcategoria").forEach(item => {
                item.classList.remove("ativa");
            });

            botao.classList.add("ativa");

            renderizarProdutos();
        });

        listaSubcategorias.appendChild(botao);

    });
}

// FILTRAR PRODUTOS DA CATEGORIA

function filtrarProdutos() {

    let produtos = [...produtosCarregados];

    if (categoriaAtual !== "Todas") {

        produtos = produtos.filter(produto => {

            const categoriaProduto =
                normalizarTexto(obterCategoria(produto));

            const categoriaEscolhida =
                normalizarTexto(categoriaAtual);

            return categoriaProduto === categoriaEscolhida;
        });
    }

    if (subcategoriaSelecionada !== "Todas") {

        produtos = produtos.filter(produto => {

            return normalizarTexto(obterSubcategoria(produto)) ===
                normalizarTexto(subcategoriaSelecionada);

        });
    }

    return produtos;
}

// ORDENAR PRODUTOS

function ordenarProdutos(produtos) {

    const ordem = ordenacaoProdutos?.value || "padrao";

    if (ordem === "menor-preco") {
        return produtos.sort((a, b) =>
            Number(a.preco) - Number(b.preco)
        );
    }

    if (ordem === "maior-preco") {
        return produtos.sort((a, b) =>
            Number(b.preco) - Number(a.preco)
        );
    }

    if (ordem === "nome") {
        return produtos.sort((a, b) =>
            obterNome(a).localeCompare(obterNome(b), "pt-BR")
        );
    }

    return produtos;
}

// CRIAR CARD DO PRODUTO

function criarCardProduto(produto) {

    const card = document.createElement("article");
    card.className = "card-produto";

    const imagem = obterImagem(produto);

    const nome = obterNome(produto);

    const preco = formatarPreco(produto.preco);

    const imagemProduto = document.createElement("img");

    imagemProduto.className = "imagem-produto";
    imagemProduto.src = imagem;
    imagemProduto.alt = nome;
    imagemProduto.loading = "lazy";

    imagemProduto.onerror = () => {
        imagemProduto.style.display = "none";
    };

    const informacoes = document.createElement("div");
    informacoes.className = "informacoes-produto";

    const categoria = document.createElement("span");
    categoria.className = "categoria-produto";
    categoria.textContent = obterCategoria(produto);

    const titulo = document.createElement("h3");
    titulo.textContent = nome;

    const precoProduto = document.createElement("p");
    precoProduto.className = "preco-produto";
    precoProduto.textContent = preco;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-adicionar";
    botao.textContent = "Adicionar à sacola";

    botao.addEventListener("click", () => {
        adicionarAoCarrinho(produto);
    });

    informacoes.appendChild(categoria);
    informacoes.appendChild(titulo);
    informacoes.appendChild(precoProduto);
    informacoes.appendChild(botao);

    card.appendChild(imagemProduto);
    card.appendChild(informacoes);

    return card;
}

// MOSTRAR PRODUTOS

function renderizarProdutos() {

    if (!listaProdutos) return;

    listaProdutos.innerHTML = "";

    let produtos = filtrarProdutos();

    produtos = ordenarProdutos(produtos);

    if (quantidadeProdutos) {
        quantidadeProdutos.textContent =
            `${produtos.length} produto(s) encontrado(s)`;
    }

    if (produtos.length === 0) {

        mensagemProdutos.textContent =
            "Nenhum produto encontrado nesta categoria.";

        mensagemProdutos.style.display = "block";

        return;
    }

    mensagemProdutos.style.display = "none";

    produtos.forEach(produto => {

        listaProdutos.appendChild(criarCardProduto(produto));

    });
}

// CARREGAR PRODUTOS DA API

async function carregarProdutos() {

    try {

        mensagemProdutos.textContent = "Carregando produtos...";

        const resposta = await fetch(API_PRODUTOS);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        const dados = await resposta.json();

        produtosCarregados = Array.isArray(dados)
            ? dados
            : dados.produtos || [];

        produtosCarregados = produtosCarregados.filter(produto => {

            if (!produto.status) return true;

            return normalizarTexto(produto.status) === "ativo";
        });

        renderizarProdutos();

    } catch (erro) {

        console.error("Erro ao carregar produtos:", erro);

        mensagemProdutos.textContent =
            "Não foi possível carregar os produtos. Verifique a conexão com o servidor.";

        if (quantidadeProdutos) {
            quantidadeProdutos.textContent = "";
        }

    }
}

// CARRINHO

function obterCarrinho() {

    try {

        const carrinho = JSON.parse(
            localStorage.getItem(CHAVE_CARRINHO)
        );

        return Array.isArray(carrinho) ? carrinho : [];

    } catch (erro) {

        return [];

    }
}

// ATUALIZAR CONTADOR

function atualizarContadorCarrinho() {

    const carrinho = obterCarrinho();

    const quantidade = carrinho.reduce((total, item) => {

        return total + Number(item.quantidade || 1);

    }, 0);

    if (contadorCarrinho) {
        contadorCarrinho.textContent = quantidade;
    }
}

// ADICIONAR À SACOLA

function adicionarAoCarrinho(produto) {

    const carrinho = obterCarrinho();

    const idProduto = produto.id;

    const produtoExistente = carrinho.find(item =>
        String(item.id) === String(idProduto)
    );

    if (produtoExistente) {

        produtoExistente.quantidade =
            Number(produtoExistente.quantidade || 1) + 1;

    } else {

        carrinho.push({

            id: idProduto,
            nome: obterNome(produto),
            preco: Number(produto.preco),
            imagem: obterImagem(produto),
            quantidade: 1

        });

    }

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(carrinho)
    );

    atualizarContadorCarrinho();

    alert("Produto adicionado à sacola!");
}

// BOTÃO DA SACOLA

if (botaoCarrinho) {

    botaoCarrinho.addEventListener("click", () => {

        window.location.href = "/carrinho";

    });

}

// EVENTO DE ORDENAÇÃO

if (ordenacaoProdutos) {

    ordenacaoProdutos.addEventListener("change", () => {

        renderizarProdutos();

    });

}

// INICIALIZAÇÃO

configurarPagina();
carregarSubcategorias();
atualizarContadorCarrinho();
carregarProdutos();
