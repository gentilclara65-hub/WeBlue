
// ============================================================
// WEBLUE - JAVASCRIPT DA HOME
// ============================================================

// CONFIGURAÇÕES
const API_PRODUTOS = "/api/produtos/catalogo";
const CHAVE_CARRINHO = "weblue-carrinho";
const TEMPO_CARROSSEL = 6000;

// ELEMENTOS HTML
const listaProdutos = document.getElementById("listaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const formBusca = document.getElementById("formBusca");
const campoBusca = document.getElementById("campoBusca");
const botoesCategoria = document.querySelectorAll("[data-categoria]");
const botaoCarrinho = document.getElementById("botaoCarrinho");

// MODAL DA SACOLA
const modalSacola = document.getElementById("modalSacola");
const fecharModalSacola = document.getElementById("fecharModalSacola");
const continuarComprando = document.getElementById("continuarComprando");
const irParaSacola = document.getElementById("irParaSacola");

const imagemProdutoSacola = document.getElementById("imagemProdutoSacola");
const nomeProdutoSacola = document.getElementById("nomeProdutoSacola");
const precoProdutoSacola = document.getElementById("precoProdutoSacola");

// CARROSSEL
const imagemBanner = document.getElementById("imagemBanner");
const botaoBannerAnterior = document.getElementById("bannerAnterior");
const botaoBannerProximo = document.getElementById("bannerProximo");
const indicadoresBanner = document.getElementById("indicadoresBanner");

// IMAGENS DOS BANNERS
const imagensBanner = [
    {
        imagem: "/img/hero-weblue.png",
        descricao: "Banner principal Weblue"
    },
    {
        imagem: "/img/produtos/maquiagem.inafantil.weblue.png",
        descricao: "Maquiagem infantil Weblue"
    },
    {
        imagem: "/img/banhoecorpoweblue.png",
        descricao: "Produtos de banho e corpo Weblue"
    },
    {
        imagem: "/img/barbamasculinaweblue.jpeg",
        descricao: "Produtos para barba masculina Weblue"
    },
    {
        imagem: "/img/produtos/bannermake.jpeg",
        descricao: "Maquiagem e Glamour",
        destaque: true
    },
    {
    imagem: "/img/produtos/bannermontekit.jpeg",
    descricao: "Monte seu kit de beleza Weblue"
    } 
];

let slideAtual = 0;
let intervaloCarrossel = null;
let produtos = [];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterTextoProduto(produto) {
    return [
        produto.nome,
        produto.marca,
        produto.categoria,
        produto.subcategoria,
        produto.descricao
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function obterImagemProduto(produto) {
    if (!produto) return "";

    return (
        produto.imagem_url ||
        produto.imagem ||
        produto.foto_url ||
        produto.foto ||
        produto.url_imagem ||
        produto.caminho_imagem ||
        ""
    );
}

function produtoEstaEmPromocao(produto) {
    const preco = Number(produto.preco);

    const precoPromocional = Number(
        produto.preco_promocional ||
        produto.preco_promocao
    );

    return (
        produto.promocao === true ||
        produto.em_promocao === true ||
        produto.oferta === true ||
        (
            Number.isFinite(precoPromocional) &&
            precoPromocional > 0 &&
            Number.isFinite(preco) &&
            precoPromocional < preco
        )
    );
}

// ============================================================
// PÁGINA DE DETALHES DO PRODUTO
// ============================================================

function abrirDetalhesProduto(produto) {
    if (!produto || produto.id === undefined || produto.id === null) {
        console.error("Produto sem identificador:", produto);
        return;
    }

    const id = encodeURIComponent(String(produto.id));

    window.location.href = `/produto.html?id=${id}`;
}

// ============================================================
// DESTAQUE DE MAQUIAGEM NO BANNER
// ============================================================

function criarDestaqueBanner() {
    const heroArte = document.querySelector(".hero-arte");

    if (!heroArte || document.getElementById("destaqueMaquiagem")) {
        return;
    }

    const destaque = document.createElement("div");

    destaque.id = "destaqueMaquiagem";
    destaque.className = "destaque-maquiagem";
    destaque.setAttribute("aria-hidden", "true");

    destaque.innerHTML = `
        <span class="destaque-maquiagem__subtitulo">
            WEBLUE BEAUTY
        </span>

        <h2>Maquiagem e Glamour</h2>

        <p>
            Realce sua beleza e descubra seus novos favoritos.
        </p>

        <a
            href="/categoria.html?categoria=Maquiagem"
            class="destaque-maquiagem__botao"
        >
            Explorar maquiagem
            <span aria-hidden="true">→</span>
        </a>
    `;

    heroArte.appendChild(destaque);
}

// ============================================================
// INDICADORES DO CARROSSEL
// ============================================================

function criarIndicadoresBanner() {
    if (!indicadoresBanner) return;

    indicadoresBanner.replaceChildren();

    imagensBanner.forEach((banner, indice) => {
        const indicador = document.createElement("button");

        indicador.type = "button";
        indicador.className = "indicador-banner";
        indicador.dataset.slide = String(indice);

        indicador.setAttribute(
            "aria-label",
            `Mostrar banner ${indice + 1}: ${banner.descricao}`
        );

        indicador.addEventListener("click", () => {
            mostrarBanner(indice);
            reiniciarCarrossel();
        });

        indicadoresBanner.appendChild(indicador);
    });
}

// ============================================================
// MOSTRAR BANNER
// ============================================================

function mostrarBanner(indice) {
    if (!imagemBanner || imagensBanner.length === 0) return;

    slideAtual =
        (indice + imagensBanner.length) % imagensBanner.length;

    const banner = imagensBanner[slideAtual];

    imagemBanner.src = banner.imagem;
    imagemBanner.alt = banner.descricao;

    const destaque = document.getElementById("destaqueMaquiagem");

    if (destaque) {
        const exibirDestaque = banner.destaque === true;

        destaque.classList.toggle("visivel", exibirDestaque);

        destaque.setAttribute(
            "aria-hidden",
            exibirDestaque ? "false" : "true"
        );
    }

    if (indicadoresBanner) {
        indicadoresBanner
            .querySelectorAll("[data-slide]")
            .forEach((indicador, index) => {
                const ativo = index === slideAtual;

                indicador.classList.toggle("ativo", ativo);

                if (ativo) {
                    indicador.setAttribute("aria-current", "true");
                } else {
                    indicador.removeAttribute("aria-current");
                }
            });
    }
}

// ============================================================
// CARROSSEL AUTOMÁTICO
// ============================================================

function iniciarTemporizadorCarrossel() {
    clearInterval(intervaloCarrossel);

    if (document.hidden) return;

    intervaloCarrossel = setInterval(() => {
        mostrarBanner(slideAtual + 1);
    }, TEMPO_CARROSSEL);
}

function reiniciarCarrossel() {
    iniciarTemporizadorCarrossel();
}

function iniciarCarrossel() {
    if (!imagemBanner) {
        console.warn("Imagem do banner não encontrada.");
        return;
    }

    criarDestaqueBanner();
    criarIndicadoresBanner();
    mostrarBanner(0);
    iniciarTemporizadorCarrossel();

    if (botaoBannerAnterior) {
        botaoBannerAnterior.addEventListener("click", () => {
            mostrarBanner(slideAtual - 1);
            reiniciarCarrossel();
        });
    }

    if (botaoBannerProximo) {
        botaoBannerProximo.addEventListener("click", () => {
            mostrarBanner(slideAtual + 1);
            reiniciarCarrossel();
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearInterval(intervaloCarrossel);
        } else {
            iniciarTemporizadorCarrossel();
        }
    });
}

// ============================================================
// CARRINHO
// ============================================================

function obterCarrinho() {
    try {
        const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);

        const carrinho = carrinhoSalvo
            ? JSON.parse(carrinhoSalvo)
            : [];

        return Array.isArray(carrinho) ? carrinho : [];

    } catch (erro) {
        console.error("Não foi possível carregar o carrinho.", erro);
        return [];
    }
}

function salvarCarrinho(carrinho) {
    try {
        localStorage.setItem(
            CHAVE_CARRINHO,
            JSON.stringify(carrinho)
        );

        return true;

    } catch (erro) {
        console.error("Não foi possível salvar o carrinho.", erro);
        alert("Não foi possível salvar o produto na sacola.");
        return false;
    }
}

function atualizarContadorCarrinho() {
    const contador = document.getElementById("contadorCarrinho");

    if (!contador) return;

    const carrinho = obterCarrinho();

    const totalItens = carrinho.reduce(
        (soma, item) => soma + Number(item.quantidade || 0),
        0
    );

    contador.textContent = String(totalItens);
}

// ============================================================
// FORMATAR PREÇO
// ============================================================

function formatarPreco(preco) {
    const valor = Number(preco);

    if (!Number.isFinite(valor)) {
        return "Preço indisponível";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

// ============================================================
// ABRIR MODAL DA SACOLA
// ============================================================

function abrirModalSacola(produto) {
    if (!modalSacola) {
        console.warn("Modal da sacola não encontrado.");
        return;
    }

    if (nomeProdutoSacola) {
        nomeProdutoSacola.textContent =
            produto.nome || "Produto Weblue";
    }

    if (precoProdutoSacola) {
        precoProdutoSacola.textContent =
            formatarPreco(produto.preco);
    }

    if (imagemProdutoSacola) {
        const imagem = obterImagemProduto(produto);

        imagemProdutoSacola.onerror = null;
        imagemProdutoSacola.removeAttribute("src");

        if (imagem) {
            imagemProdutoSacola.style.display = "block";
            imagemProdutoSacola.alt =
                produto.nome || "Produto adicionado à sacola";

            imagemProdutoSacola.onerror = () => {
                console.error(
                    "Não foi possível carregar a imagem do produto:",
                    imagem
                );

                imagemProdutoSacola.style.display = "none";
            };

            imagemProdutoSacola.src = imagem;
        } else {
            imagemProdutoSacola.style.display = "none";
        }
    }

    modalSacola.classList.add("aberto");
    modalSacola.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (fecharModalSacola) {
        fecharModalSacola.focus();
    }
}

// ============================================================
// FECHAR MODAL DA SACOLA
// ============================================================

function fecharJanelaSacola() {
    if (!modalSacola) return;

    modalSacola.classList.remove("aberto");
    modalSacola.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (botaoCarrinho) {
        botaoCarrinho.focus();
    }
}

// ============================================================
// ADICIONAR PRODUTO AO CARRINHO
// ============================================================

function adicionarAoCarrinho(produto) {
    const carrinho = obterCarrinho();

    const imagemProduto = obterImagemProduto(produto);

    const itemExistente = carrinho.find(
        (item) => String(item.id) === String(produto.id)
    );

    if (itemExistente) {
        itemExistente.quantidade =
            Number(itemExistente.quantidade || 0) + 1;

        itemExistente.nome = produto.nome;
        itemExistente.preco = produto.preco;

        if (imagemProduto) {
            itemExistente.imagem_url = imagemProduto;
        }

    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem_url: imagemProduto,
            quantidade: 1
        });
    }

    if (!salvarCarrinho(carrinho)) return;

    atualizarContadorCarrinho();

    if (botaoCarrinho) {
        botaoCarrinho.classList.add("pulse");

        setTimeout(() => {
            botaoCarrinho.classList.remove("pulse");
        }, 250);
    }

    abrirModalSacola({
        ...produto,
        imagem_url: imagemProduto
    });
}

// ============================================================
// EVENTOS DO MODAL
// ============================================================

if (fecharModalSacola) {
    fecharModalSacola.addEventListener(
        "click",
        fecharJanelaSacola
    );
}

if (continuarComprando) {
    continuarComprando.addEventListener(
        "click",
        fecharJanelaSacola
    );
}

if (irParaSacola) {
    irParaSacola.addEventListener("click", () => {
        window.location.href = "/carrinho";
    });
}

if (modalSacola) {
    modalSacola.addEventListener("click", (evento) => {
        if (evento.target === modalSacola) {
            fecharJanelaSacola();
        }
    });
}

document.addEventListener("keydown", (evento) => {
    if (
        evento.key === "Escape" &&
        modalSacola &&
        modalSacola.classList.contains("aberto")
    ) {
        fecharJanelaSacola();
    }
});

// ============================================================
// CRIAR CARD DE PRODUTO
// ============================================================

function criarCardProduto(produto) {
    const card = document.createElement("article");
    card.classList.add("product-card");

    // ÁREA DA IMAGEM CLICÁVEL
    const linkImagem = document.createElement("a");
    linkImagem.classList.add("product-card__image-link");
    linkImagem.href = `/produto.html?id=${encodeURIComponent(produto.id)}`;
    linkImagem.setAttribute(
        "aria-label",
        `Ver detalhes de ${produto.nome || "produto"}`
    );

    const areaImagem = document.createElement("div");
    areaImagem.classList.add("product-card__image");

    const imagemProduto = obterImagemProduto(produto);

    if (imagemProduto) {
        const imagem = document.createElement("img");

        imagem.src = imagemProduto;
        imagem.alt = produto.nome || "Produto Weblue";
        imagem.loading = "lazy";

        imagem.addEventListener("error", () => {
            imagem.remove();
            areaImagem.classList.add("product-card__image--empty");
            areaImagem.textContent = "Weblue";
        });

        areaImagem.appendChild(imagem);
    } else {
        areaImagem.classList.add("product-card__image--empty");
        areaImagem.textContent = "Weblue";
    }

    linkImagem.appendChild(areaImagem);

    // CONTEÚDO
    const conteudo = document.createElement("div");
    conteudo.classList.add("product-card__content");

    const categoria = document.createElement("span");
    categoria.classList.add("product-card__category");
    categoria.textContent = produto.categoria || "Sem categoria";

    // NOME CLICÁVEL
    const linkNome = document.createElement("a");
    linkNome.classList.add("product-card__name-link");
    linkNome.href = `/produto.html?id=${encodeURIComponent(produto.id)}`;
    linkNome.style.textDecoration = "none";
    linkNome.style.color = "inherit";

    const nome = document.createElement("h3");
    nome.classList.add("product-card__name");
    nome.textContent = produto.nome || "Produto Weblue";

    linkNome.appendChild(nome);

    const marca = document.createElement("p");
    marca.classList.add("product-card__brand");
    marca.textContent = produto.marca || "Weblue";

    const descricao = document.createElement("p");
    descricao.classList.add("product-card__description");
    descricao.textContent =
        produto.descricao || "Produto Weblue.";

    const preco = document.createElement("strong");
    preco.classList.add("product-card__price");

    if (produtoEstaEmPromocao(produto)) {
        const precoAntigo = document.createElement("del");
        precoAntigo.textContent = formatarPreco(produto.preco);

        const precoAtual = Number(
            produto.preco_promocional || produto.preco_promocao
        );

        const precoPromocional = document.createElement("strong");
        precoPromocional.classList.add("product-card__price-promotion");
        precoPromocional.textContent = formatarPreco(precoAtual);

        preco.replaceChildren(precoAntigo, document.createTextNode(" "), precoPromocional);
    } else {
        preco.textContent = formatarPreco(produto.preco);
    }

    const estoque = document.createElement("span");
    estoque.classList.add("product-card__stock");

    const quantidadeEstoque = Number(produto.estoque || 0);

    if (quantidadeEstoque > 0) {
        estoque.textContent =
            `${quantidadeEstoque} unidade(s) disponível(is)`;
    } else {
        estoque.textContent =
            "Produto temporariamente indisponível";

        estoque.classList.add("product-card__stock--empty");
    }

    // BOTÃO DE ADICIONAR AO CARRINHO
    const botao = document.createElement("button");

    botao.type = "button";
    botao.classList.add("product-card__button");

    if (quantidadeEstoque > 0) {
        botao.textContent = "Adicionar ao carrinho";

        botao.addEventListener("click", () => {
            adicionarAoCarrinho(produto);
        });
    } else {
        botao.textContent = "Indisponível";
        botao.disabled = true;
    }

    conteudo.append(
        categoria,
        linkNome,
        marca,
        descricao,
        preco,
        estoque,
        botao
    );

    card.append(linkImagem, conteudo);

    return card;
}

// ============================================================
// EXIBIR PRODUTOS
// ============================================================

function exibirProdutos(lista) {
    if (!listaProdutos) {
        console.error('Elemento "listaProdutos" não encontrado.');
        return;
    }

    listaProdutos.replaceChildren();

    if (!lista || lista.length === 0) {
        if (mensagemProdutos) {
            mensagemProdutos.textContent =
                "Nenhum produto encontrado.";

            mensagemProdutos.style.display = "block";
        }

        return;
    }

    if (mensagemProdutos) {
        mensagemProdutos.style.display = "none";
    }

    lista.forEach((produto) => {
        listaProdutos.appendChild(criarCardProduto(produto));
    });
}

// ============================================================
// CARREGAR PRODUTOS DA API
// ============================================================

async function carregarProdutos() {
    if (!listaProdutos) {
        console.error('Elemento "listaProdutos" não encontrado.');
        return;
    }

    if (mensagemProdutos) {
        mensagemProdutos.textContent = "Carregando produtos...";
        mensagemProdutos.style.display = "block";
    }

    try {
        const resposta = await fetch(API_PRODUTOS);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        console.log("Resposta da API:", dados);

        const produtosRecebidos = Array.isArray(dados)
            ? dados
            : Array.isArray(dados.produtos)
                ? dados.produtos
                : [];

        produtos = produtosRecebidos.filter((produto) => {
            return normalizarTexto(produto.status) === "ativo";
        });

        console.log("Produtos ativos:", produtos);

        exibirProdutos(produtos);

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);

        if (mensagemProdutos) {
            mensagemProdutos.textContent =
                "Não foi possível carregar os produtos.";

            mensagemProdutos.style.display = "block";
        }
    }
}

// ============================================================
// PESQUISAR PRODUTOS
// ============================================================

function pesquisarProdutos(texto) {
    const termo = normalizarTexto(texto);

    if (!termo) {
        exibirProdutos(produtos);
        return;
    }

    const resultado = produtos.filter((produto) => {
        return normalizarTexto(
            obterTextoProduto(produto)
        ).includes(termo);
    });

    exibirProdutos(resultado);
}

// ============================================================
// ABRIR PÁGINA DA CATEGORIA
// ============================================================

function abrirCategoria(categoria) {
    if (!categoria) return;

    const categoriaCodificada =
        encodeURIComponent(categoria);

    window.location.href =
        `/categoria.html?categoria=${categoriaCodificada}`;
}

// ============================================================
// EVENTOS DAS CATEGORIAS
// ============================================================

botoesCategoria.forEach((botao) => {
    botao.addEventListener("click", () => {
        const categoriaSelecionada =
            botao.dataset.categoria;

        if (!categoriaSelecionada) return;

        abrirCategoria(categoriaSelecionada);
    });
});

// ============================================================
// FORMULÁRIO DE PESQUISA
// ============================================================

if (formBusca && campoBusca) {
    formBusca.addEventListener("submit", (evento) => {
        evento.preventDefault();

        pesquisarProdutos(campoBusca.value);

        const secaoProdutos =
            document.getElementById("produtos");

        if (secaoProdutos) {
            secaoProdutos.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

// ============================================================
// BOTÃO DO CARRINHO
// ============================================================

if (botaoCarrinho) {
    botaoCarrinho.addEventListener("click", () => {
        window.location.href = "/carrinho";
    });
}

// ============================================================
// INICIAR A HOME
// ============================================================

function iniciarHome() {
    iniciarCarrossel();
    atualizarContadorCarrinho();
    carregarProdutos();
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        iniciarHome
    );
} else {
    iniciarHome();
}
