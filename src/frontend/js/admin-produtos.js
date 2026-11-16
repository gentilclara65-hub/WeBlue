
/* ============================================================
   WEBLUE - ADMIN-PRODUTOS.JS
   Painel administrativo de produtos
   ============================================================ */


/* ============================================================
   1. ENDPOINT DA API
   ============================================================ */

const API_PRODUTOS = "/api/produtos";
const API_PEDIDOS = "/api/pedidos";
const TOKEN_ADMIN_KEY = "tokenAdminWeblue";
const REFRESH_TOKEN_ADMIN_KEY = "refreshTokenAdminWeblue";

const listaPedidosRecentes = document.getElementById("listaPedidosRecentes");
const listaEstoqueBaixo = document.getElementById("listaEstoqueBaixo");


function limparSessaoAdmin() {
    sessionStorage.removeItem(TOKEN_ADMIN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_ADMIN_KEY);
    sessionStorage.removeItem("administradorWeblue");

    localStorage.removeItem(TOKEN_ADMIN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_ADMIN_KEY);
    localStorage.removeItem("administradorWeblue");
}


function redirecionarParaLoginAdmin(
    mensagem = "Sua sessão administrativa expirou. Faça login novamente."
) {
    limparSessaoAdmin();

    window.location.href =
        `/admin-login.html?expirada=1&msg=${encodeURIComponent(mensagem)}`;
}


async function logoutAdminNoServidor() {
    const accessToken = sessionStorage.getItem(TOKEN_ADMIN_KEY);
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_ADMIN_KEY);

    if (!accessToken && !refreshToken) {
        return;
    }

    try {
        await fetch("/api/admin/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
            }),
        });
    } catch (erro) {
        console.warn("Logout administrativo falhou no servidor:", erro);
    }
}


async function requisitarComRefreshAdmin(url, opcoes = {}) {
    const accessToken = sessionStorage.getItem(TOKEN_ADMIN_KEY);
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_ADMIN_KEY);

    if (!accessToken) {
        redirecionarParaLoginAdmin(
            "Sessão administrativa expirada. Faça login novamente."
        );

        throw new Error("Sessão administrativa expirada.");
    }

    const headers = {
        ...(opcoes.headers || {}),
        "Authorization": `Bearer ${accessToken}`
    };

    const resposta = await fetch(url, {
        ...opcoes,
        headers,
    });

    if (resposta.status !== 401 || !refreshToken) {
        return resposta;
    }

    try {
        const refreshResposta = await fetch("/api/admin/auth/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            }),
        });

        if (!refreshResposta.ok) {
            throw new Error("Refresh token inválido.");
        }

        const novosTokens = await refreshResposta.json();

        sessionStorage.setItem(
            TOKEN_ADMIN_KEY,
            novosTokens.access_token
        );

        if (novosTokens.refresh_token) {
            sessionStorage.setItem(
                REFRESH_TOKEN_ADMIN_KEY,
                novosTokens.refresh_token
            );
        }

        return fetch(url, {
            ...opcoes,
            headers: {
                ...(opcoes.headers || {}),
                "Authorization": `Bearer ${novosTokens.access_token}`
            },
        });

    } catch (erro) {
        redirecionarParaLoginAdmin(
            "Sua sessão administrativa expirou. Faça login novamente."
        );

        throw erro;
    }
}


/* ============================================================
   2. ELEMENTOS DA PÁGINA
   ============================================================ */

const botaoNovoProduto = document.getElementById("botaoNovoProduto");
const botaoFecharModal = document.getElementById("botaoFecharModal");
const botaoCancelar = document.getElementById("botaoCancelar");
const botaoSalvar = document.getElementById("botaoSalvar");
const btnSairAdmin = document.getElementById("btnSairAdmin");

const modalProduto = document.getElementById("modalProduto");
const modalOverlay = document.getElementById("modalOverlay");
const tituloModal = document.getElementById("tituloModal");

const formProduto = document.getElementById("formProduto");

const produtoId = document.getElementById("produtoId");
const campoNome = document.getElementById("nome");
const campoDescricao = document.getElementById("descricao");
const campoPreco = document.getElementById("preco");
const campoEstoque = document.getElementById("estoque");
const campoCategoria = document.getElementById("categoria");
const campoSubcategoria = document.getElementById("subcategoria");
const campoMarca = document.getElementById("marca");
const campoImagemUrl = document.getElementById("imagemUrl");
const campoStatus = document.getElementById("status");

const pesquisaProduto = document.getElementById("pesquisaProduto");
const filtroStatus = document.getElementById("filtroStatus");

const listaProdutos = document.getElementById("listaProdutos");

const mensagem = document.getElementById("mensagem");

const totalProdutos = document.getElementById("totalProdutos");
const totalAtivos = document.getElementById("totalAtivos");
const totalInativos = document.getElementById("totalInativos");
const totalEstoque = document.getElementById("totalEstoque");


/* ============================================================
   3. ESTADO LOCAL
   ============================================================ */

let produtos = [];


function criarElementoTexto(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    elemento.textContent = String(texto ?? "");

    return elemento;
}


function mostrarEstadoLista(
    container,
    texto,
    classe = "sem-produtos"
) {
    if (container) {
        container.replaceChildren(
            criarElementoTexto("p", classe, texto)
        );
    }
}


/* ============================================================
   4. FORMATAR PREÇO
   ============================================================ */

function formatarPreco(valor) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return "R$ 0,00";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


/* ============================================================
   5. MOSTRAR MENSAGEM
   ============================================================ */

function mostrarMensagem(texto, tipo = "info") {
    if (!mensagem) {
        console.warn(texto);
        return;
    }

    mensagem.textContent = texto;

    mensagem.classList.remove(
        "sucesso",
        "erro",
        "info"
    );

    mensagem.classList.add(tipo);

    mensagem.hidden = false;

    window.clearTimeout(mostrarMensagem.timeout);

    mostrarMensagem.timeout = window.setTimeout(() => {
        mensagem.hidden = true;
    }, 5000);
}


/* ============================================================
   6. TRATAR ERROS DA API
   ============================================================ */

async function obterMensagemErro(response) {
    let textoResposta = "";

    try {
        textoResposta = await response.text();

    } catch (erro) {
        console.error("Não foi possível ler a resposta:", erro);
    }

    if (textoResposta) {
        try {
            const dados = JSON.parse(textoResposta);

            if (dados.detail) {
                if (Array.isArray(dados.detail)) {
                    return dados.detail.map((erro) => {
                        const campo = Array.isArray(erro.loc)
                            ? erro.loc[erro.loc.length - 1]
                            : "";

                        const descricaoErro =
                            erro.msg || "Erro de validação.";

                        return campo
                            ? `${campo}: ${descricaoErro}`
                            : descricaoErro;
                    }).join(" ");
                }

                return String(dados.detail);
            }

            if (dados.mensagem) {
                return String(dados.mensagem);
            }

            if (dados.message) {
                return String(dados.message);
            }

        } catch (erro) {
            console.warn(
                "A API retornou uma resposta que não é JSON:",
                textoResposta
            );
        }
    }

    if (response.status === 422) {
        return "Os dados enviados não passaram pela validação. Confira os campos obrigatórios.";
    }

    if (response.status >= 500) {
        console.error(
            "Erro interno retornado pelo servidor:",
            response.status,
            textoResposta
        );

        return "O servidor encontrou um erro interno ao processar o produto. Consulte os logs do backend.";
    }

    return textoResposta
        ? `Erro ${response.status}: ${textoResposta.slice(0, 300)}`
        : `Erro na requisição. Código HTTP: ${response.status}`;
}


/* ============================================================
   7. CARREGAR PRODUTOS
   ============================================================ */

async function carregarProdutos() {
    mostrarEstadoLista(
        listaProdutos,
        "Carregando produtos...",
        "carregando"
    );

    try {
        const response = await requisitarComRefreshAdmin(
            API_PRODUTOS,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        const dados = await response.json();

        produtos = Array.isArray(dados.produtos)
            ? dados.produtos
            : [];

        atualizarEstatisticas();
        aplicarFiltros();

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);

        mostrarEstadoLista(
            listaProdutos,
            "Não foi possível carregar os produtos."
        );

        mostrarMensagem(
            erro.message || "Não foi possível carregar os produtos.",
            "erro"
        );
    }
}


/* ============================================================
   8. CARREGAR RESUMO ADMINISTRATIVO
   ============================================================ */

async function carregarResumoAdmin() {
    try {
        const [pedidosResposta, estoqueResposta] = await Promise.all([
            requisitarComRefreshAdmin(API_PEDIDOS, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }),

            requisitarComRefreshAdmin(`${API_PEDIDOS}/estoque`, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }),
        ]);

        if (!pedidosResposta.ok || !estoqueResposta.ok) {
            throw new Error(
                "Não foi possível carregar o resumo administrativo."
            );
        }

        const pedidosDados = await pedidosResposta.json();
        const estoqueDados = await estoqueResposta.json();

        const pedidos = Array.isArray(pedidosDados.pedidos)
            ? pedidosDados.pedidos
            : [];

        const estoque = Array.isArray(estoqueDados.produtos)
            ? estoqueDados.produtos
            : [];

        const itensRecentes = pedidos.slice(0, 3);

        if (listaPedidosRecentes) {
            if (!itensRecentes.length) {
                mostrarEstadoLista(
                    listaPedidosRecentes,
                    "Nenhum pedido registrado."
                );

            } else {
                const fragmento = document.createDocumentFragment();

                itensRecentes.forEach((pedido) => {
                    const valor = Number(pedido.valor_total || 0);

                    const data = pedido.criado_em
                        ? new Date(pedido.criado_em).toLocaleString("pt-BR")
                        : "-";

                    const itens = (pedido.itens || [])
                        .slice(0, 2)
                        .map((item) =>
                            `${item.quantidade}x ${item.nome || "Produto"}`
                        )
                        .join(", ");

                    const linha = document.createElement("div");
                    linha.className = "admin-item-resumo";

                    linha.append(
                        criarElementoTexto("strong", "", `#${pedido.id}`),
                        criarElementoTexto(
                            "span",
                            "",
                            pedido.status || "Indefinido"
                        ),
                        criarElementoTexto("small", "", data),
                        criarElementoTexto(
                            "small",
                            "",
                            itens || "Sem itens"
                        ),
                        criarElementoTexto(
                            "strong",
                            "",
                            valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                            })
                        )
                    );

                    fragmento.appendChild(linha);
                });

                listaPedidosRecentes.replaceChildren(fragmento);
            }
        }

        const estoqueBaixo = estoque
            .filter((produto) => Number(produto.estoque) <= 3)
            .slice(0, 4);

        if (listaEstoqueBaixo) {
            if (!estoqueBaixo.length) {
                mostrarEstadoLista(
                    listaEstoqueBaixo,
                    "Estoque saudável para todos os produtos."
                );

            } else {
                const fragmento = document.createDocumentFragment();

                estoqueBaixo.forEach((produto) => {
                    const linha = document.createElement("div");
                    linha.className = "admin-item-resumo";

                    linha.append(
                        criarElementoTexto(
                            "strong",
                            "",
                            produto.nome || "Produto"
                        ),
                        criarElementoTexto(
                            "span",
                            "",
                            `Disponível: ${produto.estoque}`
                        ),
                        criarElementoTexto(
                            "small",
                            "",
                            produto.categoria || "Sem categoria"
                        )
                    );

                    fragmento.appendChild(linha);
                });

                listaEstoqueBaixo.replaceChildren(fragmento);
            }
        }

    } catch (erro) {
        console.error(
            "Erro ao carregar resumo administrativo:",
            erro
        );

        if (listaPedidosRecentes) {
            mostrarEstadoLista(
                listaPedidosRecentes,
                "Não foi possível carregar os pedidos."
            );
        }

        if (listaEstoqueBaixo) {
            mostrarEstadoLista(
                listaEstoqueBaixo,
                "Não foi possível carregar o estoque."
            );
        }
    }
}


/* ============================================================
   9. ATUALIZAR ESTATÍSTICAS
   ============================================================ */

function atualizarEstatisticas() {
    const quantidadeTotal = produtos.length;

    const quantidadeAtivos = produtos.filter(
        (produto) => produto.status === "ATIVO"
    ).length;

    const quantidadeInativos = produtos.filter(
        (produto) => produto.status === "INATIVO"
    ).length;

    const quantidadeEstoque = produtos.reduce(
        (total, produto) => {
            const estoque = Number(produto.estoque);

            return total + (
                Number.isNaN(estoque)
                    ? 0
                    : estoque
            );
        },
        0
    );

    totalProdutos.textContent = quantidadeTotal;
    totalAtivos.textContent = quantidadeAtivos;
    totalInativos.textContent = quantidadeInativos;
    totalEstoque.textContent = quantidadeEstoque;
}


/* ============================================================
   10. APLICAR FILTROS
   ============================================================ */

function aplicarFiltros() {
    const termo = pesquisaProduto.value.trim().toLowerCase();
    const statusSelecionado = filtroStatus.value;

    const produtosFiltrados = produtos.filter((produto) => {
        const nome = String(produto.nome || "").toLowerCase();
        const categoria = String(produto.categoria || "").toLowerCase();
        const subcategoria = String(
            produto.subcategoria || ""
        ).toLowerCase();
        const marca = String(produto.marca || "").toLowerCase();

        const correspondePesquisa =
            !termo ||
            nome.includes(termo) ||
            categoria.includes(termo) ||
            subcategoria.includes(termo) ||
            marca.includes(termo);

        const correspondeStatus =
            !statusSelecionado ||
            produto.status === statusSelecionado;

        return correspondePesquisa && correspondeStatus;
    });

    renderizarProdutos(produtosFiltrados);
}


/* ============================================================
   11. RENDERIZAR PRODUTOS
   ============================================================ */

function renderizarProdutos(lista) {
    if (!lista.length) {
        mostrarEstadoLista(
            listaProdutos,
            "Nenhum produto encontrado."
        );

        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach((produto) => {
        const card = document.createElement("article");
        card.className = "admin-produto-card";

        const possuiImagem =
            produto.imagem_url &&
            String(produto.imagem_url).trim() !== "";

        const classeStatus =
            produto.status === "ATIVO" ? "ativo" : "inativo";

        const textoBotaoStatus =
            produto.status === "ATIVO" ? "Desativar" : "Reativar";

        const areaImagem = document.createElement("div");
        areaImagem.className = "admin-produto-imagem";

        if (possuiImagem) {
            const imagem = document.createElement("img");

            imagem.src = produto.imagem_url;
            imagem.alt = produto.nome || "Imagem do produto";
            imagem.loading = "lazy";

            imagem.addEventListener("error", () => {
                imagem.remove();

                areaImagem.appendChild(
                    criarElementoTexto(
                        "span",
                        "admin-produto-sem-imagem",
                        "Weblue"
                    )
                );
            }, { once: true });

            areaImagem.appendChild(imagem);

        } else {
            areaImagem.appendChild(
                criarElementoTexto(
                    "span",
                    "admin-produto-sem-imagem",
                    "Weblue"
                )
            );
        }

        const statusProduto = criarElementoTexto(
            "span",
            `status-produto ${classeStatus}`,
            produto.status || "INDEFINIDO"
        );

        areaImagem.appendChild(statusProduto);

        const conteudo = document.createElement("div");
        conteudo.className = "admin-produto-conteudo";

        conteudo.append(
            criarElementoTexto(
                "span",
                "admin-produto-categoria",
                produto.categoria || "Sem categoria"
            ),
            criarElementoTexto(
                "h3",
                "admin-produto-nome",
                produto.nome || "Produto Weblue"
            )
        );

        if (
            produto.subcategoria &&
            String(produto.subcategoria).trim()
        ) {
            conteudo.appendChild(
                criarElementoTexto(
                    "span",
                    "admin-produto-subcategoria",
                    `Subcategoria: ${produto.subcategoria}`
                )
            );
        }

        conteudo.append(
            criarElementoTexto(
                "p",
                "admin-produto-marca",
                produto.marca || "Sem marca"
            ),
            criarElementoTexto(
                "p",
                "admin-produto-descricao",
                produto.descricao || "Produto sem descrição."
            )
        );

        const dados = document.createElement("div");
        dados.className = "admin-produto-dados";

        dados.append(
            criarElementoTexto(
                "strong",
                "admin-produto-preco",
                formatarPreco(produto.preco)
            ),
            criarElementoTexto(
                "span",
                "admin-produto-estoque",
                `${produto.estoque} unidade(s)`
            )
        );

        conteudo.appendChild(dados);

        const acoes = document.createElement("div");
        acoes.className = "admin-produto-acoes";

        const botaoEditar = criarElementoTexto(
            "button",
            "botao-editar",
            "Editar"
        );

        botaoEditar.type = "button";
        botaoEditar.dataset.id = String(produto.id);

        const botaoStatus = criarElementoTexto(
            "button",
            "botao-status",
            textoBotaoStatus
        );

        botaoStatus.type = "button";
        botaoStatus.dataset.id = String(produto.id);
        botaoStatus.dataset.status = produto.status || "";

        acoes.append(botaoEditar, botaoStatus);

        conteudo.appendChild(acoes);

        card.append(areaImagem, conteudo);

        fragmento.appendChild(card);
    });

    listaProdutos.replaceChildren(fragmento);
}


/* ============================================================
   12. ABRIR MODAL PARA NOVO PRODUTO
   ============================================================ */

function abrirModalNovoProduto() {
    formProduto.reset();

    produtoId.value = "";

    campoStatus.value = "ATIVO";

    campoSubcategoria.value = "";

    tituloModal.textContent = "Novo produto";

    botaoSalvar.textContent = "Salvar produto";

    abrirModal();
}


/* ============================================================
   13. ABRIR MODAL
   ============================================================ */

function abrirModal() {
    modalProduto.hidden = false;

    document.body.classList.add("modal-aberto");

    window.setTimeout(() => {
        campoNome.focus();
    }, 50);
}


/* ============================================================
   14. FECHAR MODAL
   ============================================================ */

function fecharModal() {
    modalProduto.hidden = true;

    document.body.classList.remove("modal-aberto");

    formProduto.reset();

    produtoId.value = "";
}


/* ============================================================
   15. BUSCAR PRODUTO POR ID
   ============================================================ */

async function buscarProdutoPorId(id) {
    const response = await requisitarComRefreshAdmin(
        `${API_PRODUTOS}/${id}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(await obterMensagemErro(response));
    }

    const dados = await response.json();

    return dados.produto;
}


/* ============================================================
   16. ABRIR PRODUTO PARA EDIÇÃO
   ============================================================ */

async function editarProduto(id) {
    try {
        const produto = await buscarProdutoPorId(id);

        produtoId.value = produto.id;

        campoNome.value = produto.nome || "";
        campoDescricao.value = produto.descricao || "";
        campoPreco.value = produto.preco || "";
        campoEstoque.value = produto.estoque ?? 0;
        campoCategoria.value = produto.categoria || "";
        campoSubcategoria.value = produto.subcategoria || "";
        campoMarca.value = produto.marca || "";
        campoImagemUrl.value = produto.imagem_url || "";
        campoStatus.value = produto.status || "ATIVO";

        tituloModal.textContent = "Editar produto";

        botaoSalvar.textContent = "Salvar alterações";

        abrirModal();

    } catch (erro) {
        console.error("Erro ao buscar produto:", erro);

        mostrarMensagem(
            erro.message || "Não foi possível abrir o produto.",
            "erro"
        );
    }
}


/* ============================================================
   17. PREPARAR DADOS DO FORMULÁRIO
   ============================================================ */

function obterDadosFormulario() {
    const nome = campoNome.value.trim();
    const descricao = campoDescricao.value.trim();

    const preco = Number(campoPreco.value);
    const estoque = Number(campoEstoque.value);

    const categoria = campoCategoria.value.trim();
    const subcategoria = campoSubcategoria.value.trim();

    const marca = campoMarca.value.trim();
    const imagemUrl = campoImagemUrl.value.trim();

    const status = campoStatus.value;

    // Nome obrigatório.
    if (nome.length < 2) {
        throw new Error(
            "Informe o nome do produto com pelo menos 2 caracteres."
        );
    }

    // Descrição obrigatória.
    if (descricao.length < 5) {
        throw new Error(
            "A descrição é obrigatória e deve ter pelo menos 5 caracteres."
        );
    }

    // Preço obrigatório e maior que zero.
    if (
        !Number.isFinite(preco) ||
        preco <= 0
    ) {
        throw new Error(
            "Informe um preço válido maior que zero."
        );
    }

    // Estoque obrigatório.
    if (
        !Number.isInteger(estoque) ||
        estoque < 0
    ) {
        throw new Error(
            "Informe um estoque válido, igual ou maior que zero."
        );
    }

    // Categoria obrigatória.
    if (categoria.length < 2) {
        throw new Error(
            "Selecione uma categoria válida."
        );
    }

    // Marca obrigatória.
    if (marca.length < 2) {
        throw new Error(
            "Informe a marca do produto com pelo menos 2 caracteres."
        );
    }

    /*
       A subcategoria é opcional.
       Quando estiver vazia, será enviada como null.
    */

    return {
        nome: nome,
        descricao: descricao,
        preco: preco,
        estoque: estoque,
        categoria: categoria,
        subcategoria: subcategoria || null,
        marca: marca,
        imagem_url: imagemUrl || null,
        status: status
    };
}


/* ============================================================
   18. SALVAR PRODUTO
   ============================================================ */

async function salvarProduto(event) {
    event.preventDefault();

    if (botaoSalvar.disabled) {
        return;
    }

    try {
        const dadosProduto = obterDadosFormulario();

        const id = produtoId.value;
        const editando = Boolean(id);

        const url = editando
            ? `${API_PRODUTOS}/${id}`
            : API_PRODUTOS;

        const metodo = editando ? "PUT" : "POST";

        botaoSalvar.disabled = true;

        botaoSalvar.textContent = editando
            ? "Salvando alterações..."
            : "Salvando produto...";

        const response = await requisitarComRefreshAdmin(
            url,
            {
                method: metodo,

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(dadosProduto)
            }
        );

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        // Lê a resposta sem exigir que ela seja JSON.
        const respostaTexto = await response.text();

        if (respostaTexto) {
            try {
                JSON.parse(respostaTexto);
            } catch (erro) {
                console.warn(
                    "A API respondeu com sucesso, mas sem JSON válido:",
                    respostaTexto
                );
            }
        }

        fecharModal();

        mostrarMensagem(
            editando
                ? "Produto atualizado com sucesso."
                : "Produto cadastrado com sucesso.",
            "sucesso"
        );

        await carregarProdutos();

    } catch (erro) {
        console.error("Erro ao salvar produto:", erro);

        mostrarMensagem(
            erro.message || "Não foi possível salvar o produto.",
            "erro"
        );

    } finally {
        botaoSalvar.disabled = false;

        botaoSalvar.textContent = produtoId.value
            ? "Salvar alterações"
            : "Salvar produto";
    }
}


/* ============================================================
   19. ALTERAR STATUS
   ============================================================ */

async function alterarStatusProduto(id, statusAtual) {
    const estaAtivo = statusAtual === "ATIVO";

    const mensagemConfirmacao = estaAtivo
        ? "Deseja realmente desativar este produto?"
        : "Deseja reativar este produto?";

    const confirmou = window.confirm(mensagemConfirmacao);

    if (!confirmou) {
        return;
    }

    try {
        let response;

        if (estaAtivo) {
            response = await requisitarComRefreshAdmin(
                `${API_PRODUTOS}/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        } else {
            response = await requisitarComRefreshAdmin(
                `${API_PRODUTOS}/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        status: "ATIVO"
                    })
                }
            );
        }

        if (!response.ok) {
            throw new Error(await obterMensagemErro(response));
        }

        await response.text();

        mostrarMensagem(
            estaAtivo
                ? "Produto desativado com sucesso."
                : "Produto reativado com sucesso.",
            "sucesso"
        );

        await carregarProdutos();

    } catch (erro) {
        console.error("Erro ao alterar status:", erro);

        mostrarMensagem(
            erro.message || "Não foi possível alterar o status.",
            "erro"
        );
    }
}


/* ============================================================
   20. CLIQUES NOS CARDS
   ============================================================ */

listaProdutos.addEventListener("click", (event) => {
    const botaoEditar = event.target.closest(".botao-editar");

    if (botaoEditar) {
        const id = Number(botaoEditar.dataset.id);

        editarProduto(id);

        return;
    }

    const botaoStatus = event.target.closest(".botao-status");

    if (botaoStatus) {
        const id = Number(botaoStatus.dataset.id);
        const statusAtual = botaoStatus.dataset.status;

        alterarStatusProduto(id, statusAtual);
    }
});


/* ============================================================
   21. EVENTOS DO MODAL
   ============================================================ */

botaoNovoProduto.addEventListener(
    "click",
    abrirModalNovoProduto
);

botaoFecharModal.addEventListener(
    "click",
    fecharModal
);

botaoCancelar.addEventListener(
    "click",
    fecharModal
);

modalOverlay.addEventListener(
    "click",
    fecharModal
);


document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        !modalProduto.hidden
    ) {
        fecharModal();
    }
});


/* ============================================================
   22. EVENTO DO FORMULÁRIO
   ============================================================ */

formProduto.addEventListener(
    "submit",
    salvarProduto
);


/* ============================================================
   23. EVENTOS DOS FILTROS
   ============================================================ */

pesquisaProduto.addEventListener(
    "input",
    aplicarFiltros
);

filtroStatus.addEventListener(
    "change",
    aplicarFiltros
);


/* ============================================================
   24. ERRO DE IMAGEM
   ============================================================ */

listaProdutos.addEventListener(
    "error",
    (event) => {
        if (event.target.tagName !== "IMG") {
            return;
        }

        const container = event.target.closest(
            ".admin-produto-imagem"
        );

        event.target.remove();

        if (
            container &&
            !container.querySelector(".admin-produto-sem-imagem")
        ) {
            const placeholder = document.createElement("span");

            placeholder.className = "admin-produto-sem-imagem";
            placeholder.textContent = "Weblue";

            const status = container.querySelector(".status-produto");

            if (status) {
                container.insertBefore(placeholder, status);
            } else {
                container.appendChild(placeholder);
            }
        }
    },
    true
);


/* ============================================================
   25. LOGOUT DO ADMINISTRADOR
   ============================================================ */

if (btnSairAdmin) {
    btnSairAdmin.addEventListener("click", async () => {
        btnSairAdmin.disabled = true;
        btnSairAdmin.textContent = "Saindo...";

        try {
            await logoutAdminNoServidor();

        } finally {
            limparSessaoAdmin();

            window.location.href = "/admin-login.html";
        }
    });
}


/* ============================================================
   26. INICIALIZAÇÃO
   ============================================================ */

const tokenAdminAtivo = sessionStorage.getItem(TOKEN_ADMIN_KEY);

if (!tokenAdminAtivo) {
    redirecionarParaLoginAdmin(
        "Você precisa estar autenticado para acessar o painel administrativo."
    );

} else {
    carregarProdutos();

    carregarResumoAdmin();
}
