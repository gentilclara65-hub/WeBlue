
/* ============================================================
   WEBLUE - CARRINHO DE COMPRAS
   ============================================================ */

const CHAVE_CARRINHO = "weblue-carrinho";
const CHAVE_CUPOM = "weblue-cupom";
const CHAVE_PAGAMENTO = "weblue-pagamento";
const CHAVE_ENDERECO = "weblue-endereco";

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

let calculoCupom = null;


/* ============================================================
   CARRINHO
   ============================================================ */

function obterCarrinho() {
    try {
        const salvo = localStorage.getItem(CHAVE_CARRINHO);
        const carrinho = salvo ? JSON.parse(salvo) : [];

        return Array.isArray(carrinho) ? carrinho : [];
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


/* ============================================================
   IMAGEM DO PRODUTO
   ============================================================ */

function obterImagemProduto(item) {
    return (
        item.imagem ||
        item.image ||
        item.foto ||
        item.urlImagem ||
        item.url_imagem ||
        item.imagemUrl ||
        item.imagem_url ||
        item.foto_url ||
        ""
    );
}


/* ============================================================
   CONTADOR
   ============================================================ */

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


/* ============================================================
   ALTERAR QUANTIDADE
   ============================================================ */

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

    if (obterCupom()) {
        revalidarCupom();
    } else {
        renderCarrinho();
    }
}


/* ============================================================
   REMOVER PRODUTO
   ============================================================ */

function removerDoCarrinho(produtoId) {
    const carrinho = obterCarrinho().filter(
        produto => String(produto.id) !== String(produtoId)
    );

    salvarCarrinho(carrinho);

    if (obterCupom()) {
        revalidarCupom();
    } else {
        renderCarrinho();
    }
}


/* ============================================================
   CUPOM E PAGAMENTO
   ============================================================ */

function obterCupom() {
    return localStorage.getItem(CHAVE_CUPOM) || "";
}

function obterPagamento() {
    return localStorage.getItem(CHAVE_PAGAMENTO) || "";
}


/* ============================================================
   RENDERIZAR CARRINHO
   ============================================================ */

function renderCarrinho() {
    const carrinho = obterCarrinho();

    atualizarContadorCarrinho();

    if (!listaCarrinho) return;

    if (!carrinho.length) {
        listaCarrinho.replaceChildren();

        calculoCupom = null;

        localStorage.removeItem(CHAVE_CUPOM);

        if (codigoCupom) {
            codigoCupom.value = "";
        }

        if (removerCupom) {
            removerCupom.style.display = "none";
        }

        if (mensagemCarrinho) {
            mensagemCarrinho.textContent =
                "Seu carrinho está vazio. Adicione produtos para continuar.";
        }

        if (quantidadeItens) {
            quantidadeItens.textContent = "0 itens";
        }

        if (subtotalCarrinho) {
            subtotalCarrinho.textContent = formatarPreco(0);
        }

        if (descontoCarrinho) {
            descontoCarrinho.textContent = formatarPreco(0);
        }

        if (totalCarrinho) {
            totalCarrinho.textContent = formatarPreco(0);
        }

        atualizarParcelamento();

        return;
    }

    if (mensagemCarrinho) {
        mensagemCarrinho.textContent = "";
    }

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

        /* IMAGEM */

        const imagemContainer = document.createElement("div");
        imagemContainer.className = "item-image";

        const imagemProduto = obterImagemProduto(item);

        if (imagemProduto) {
            const imagem = document.createElement("img");

            imagem.src = imagemProduto;
            imagem.alt = item.nome
                ? `Imagem de ${item.nome}`
                : "Imagem do produto WeBlue";

            imagem.loading = "lazy";

            imagem.onerror = function () {
                imagemContainer.replaceChildren();

                const fallback = document.createElement("div");
                fallback.className = "item-image-placeholder";
                fallback.textContent = "WeBlue";

                imagemContainer.appendChild(fallback);
            };

            imagemContainer.appendChild(imagem);
        } else {
            const placeholder = document.createElement("div");

            placeholder.className = "item-image-placeholder";
            placeholder.textContent = "WeBlue";

            imagemContainer.appendChild(placeholder);
        }

        /* DETALHES */

        const detalhes = document.createElement("div");
        detalhes.className = "item-details";

        const nome = document.createElement("h3");
        nome.textContent = item.nome || "Produto WeBlue";

        const precoUnitario = document.createElement("p");
        precoUnitario.textContent = `${formatarPreco(preco)} cada`;

        /* CONTROLES */

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
            "diminuir",
            "-",
            "",
            "Diminuir quantidade"
        );

        const quantidadeTexto = document.createElement("span");
        quantidadeTexto.textContent = String(quantidade);

        const aumentar = criarBotao(
            "aumentar",
            "+",
            "",
            "Aumentar quantidade"
        );

        const remover = criarBotao(
            "remover",
            "Remover",
            "btn-secondary",
            "Remover produto do carrinho"
        );

        controles.append(
            diminuir,
            quantidadeTexto,
            aumentar,
            remover
        );

        detalhes.append(
            nome,
            precoUnitario,
            controles
        );

        /* SUBTOTAL DO PRODUTO */

        const subtotalTexto = document.createElement("strong");
        subtotalTexto.textContent = formatarPreco(valorSubtotal);

        artigo.append(
            imagemContainer,
            detalhes,
            subtotalTexto
        );

        fragmento.appendChild(artigo);
    });

    listaCarrinho.replaceChildren(fragmento);

    if (quantidadeItens) {
        quantidadeItens.textContent =
            `${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`;
    }

    /* VALORES DO CARRINHO COM DESCONTO */

    const subtotalFinal = calculoCupom
        ? Number(calculoCupom.subtotal)
        : subtotal;

    const descontoFinal = calculoCupom
        ? Number(calculoCupom.desconto)
        : 0;

    const totalFinal = calculoCupom
        ? Number(calculoCupom.total)
        : subtotal;

    if (subtotalCarrinho) {
        subtotalCarrinho.textContent = formatarPreco(subtotalFinal);
    }

    if (descontoCarrinho) {
        descontoCarrinho.textContent = formatarPreco(descontoFinal);
    }

    if (totalCarrinho) {
        totalCarrinho.textContent = formatarPreco(totalFinal);
    }

    atualizarParcelamento();
}


/* ============================================================
   EVENTOS DOS BOTÕES DO CARRINHO
   ============================================================ */

if (listaCarrinho) {
    listaCarrinho.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-acao]");

        if (!botao || !listaCarrinho.contains(botao)) {
            return;
        }

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
}


/* ============================================================
   CUPOM
   ============================================================ */

function mostrarMensagemCupom(texto, tipo = "") {
    if (!mensagemCupom) return;

    mensagemCupom.textContent = texto;
    mensagemCupom.className = `coupon-message ${tipo}`;
}

async function validarCupomNaApi(codigo) {
    const carrinho = obterCarrinho();

    const itens = carrinho.map(item => ({
        produto_id: Number(item.id),
        quantidade: Number(item.quantidade || 1)
    }));

    try {
        const resposta = await fetch(
                   "/api/cupons/validar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    codigo: codigo,
                    itens: itens
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.detail || "Não foi possível validar o cupom."
            );
        }

        return dados;

    } catch (erro) {
        console.error("Erro ao validar cupom:", erro);
        throw erro;
    }
}


/* ============================================================
   REVALIDAR CUPOM
   ============================================================ */

async function revalidarCupom() {
    const cupom = obterCupom();

    if (!cupom) {
        calculoCupom = null;
        renderCarrinho();
        return;
    }

    const carrinho = obterCarrinho();

    if (!carrinho.length) {
        calculoCupom = null;

        localStorage.removeItem(CHAVE_CUPOM);

        if (codigoCupom) {
            codigoCupom.value = "";
        }

        if (removerCupom) {
            removerCupom.style.display = "none";
        }

        mostrarMensagemCupom(
            "Cupom removido porque o carrinho está vazio."
        );

        renderCarrinho();
        return;
    }

    try {
        const dados = await validarCupomNaApi(cupom);

        calculoCupom = dados;

        mostrarMensagemCupom(
            "Cupom validado com sucesso!",
            "sucesso"
        );

        if (removerCupom) {
            removerCupom.style.display = "inline-block";
        }

    } catch (erro) {
        calculoCupom = null;

        localStorage.removeItem(CHAVE_CUPOM);

        if (codigoCupom) {
            codigoCupom.value = "";
        }

        if (removerCupom) {
            removerCupom.style.display = "none";
        }

        mostrarMensagemCupom(
            erro.message || "O cupom não pode mais ser aplicado.",
            "erro"
        );
    }

    renderCarrinho();
}


/* ============================================================
   CARREGAR CUPOM SALVO
   ============================================================ */

function carregarCupom() {
    const cupom = obterCupom();

    if (!cupom) return;

    if (codigoCupom) {
        codigoCupom.value = cupom;
    }

    if (removerCupom) {
        removerCupom.style.display = "inline-block";
    }

    mostrarMensagemCupom("Verificando seu cupom...");

    revalidarCupom();
}


/* ============================================================
   APLICAR CUPOM
   ============================================================ */

if (botaoAplicarCupom) {
    botaoAplicarCupom.addEventListener("click", async () => {
        const cupom = codigoCupom
            ? codigoCupom.value.trim().toUpperCase()
            : "";

        if (!cupom) {
            mostrarMensagemCupom(
                "Digite um código de cupom.",
                "erro"
            );
            return;
        }

        if (!obterCarrinho().length) {
            mostrarMensagemCupom(
                "Adicione produtos ao carrinho antes de aplicar um cupom.",
                "erro"
            );
            return;
        }

        botaoAplicarCupom.disabled = true;

        mostrarMensagemCupom("Validando seu cupom...");

        try {
            const dados = await validarCupomNaApi(cupom);

            calculoCupom = dados;

            localStorage.setItem(CHAVE_CUPOM, cupom);

            mostrarMensagemCupom(
                "Cupom validado com sucesso!",
                "sucesso"
            );

            if (removerCupom) {
                removerCupom.style.display = "inline-block";
            }

            renderCarrinho();

            console.log("Resultado da validação:", dados);

        } catch (erro) {
            calculoCupom = null;

            localStorage.removeItem(CHAVE_CUPOM);

            renderCarrinho();

            mostrarMensagemCupom(
                erro.message || "Não foi possível validar o cupom.",
                "erro"
            );

            if (removerCupom) {
                removerCupom.style.display = "none";
            }

        } finally {
            botaoAplicarCupom.disabled = false;
        }
    });
}


/* ============================================================
   REMOVER CUPOM
   ============================================================ */

if (removerCupom) {
    removerCupom.addEventListener("click", () => {
        localStorage.removeItem(CHAVE_CUPOM);

        calculoCupom = null;

        if (codigoCupom) {
            codigoCupom.value = "";
        }

        removerCupom.style.display = "none";

        mostrarMensagemCupom("Cupom removido.");

        renderCarrinho();
    });
}


/* ============================================================
   ENDEREÇO DE ENTREGA
   ============================================================ */

// Lê os dados diretamente do formulário.
function obterEnderecoDoFormulario() {
    const form = document.getElementById("formEndereco");

    if (!form) return {};

    const campos = [
        "nome",
        "cep",
        "numero",
        "rua",
        "complemento",
        "bairro",
        "cidade",
        "estado"
    ];

    const endereco = {};

    campos.forEach(campo => {
        const elemento = form.elements.namedItem(campo);

        endereco[campo] = elemento
            ? elemento.value.trim()
            : "";
    });

    return endereco;
}

// Salva o endereço preenchido no navegador.
function salvarEndereco() {
    const endereco = obterEnderecoDoFormulario();

    try {
        localStorage.setItem(
            CHAVE_ENDERECO,
            JSON.stringify(endereco)
        );

        return true;
    } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        alert("Não foi possível salvar seu endereço. Tente novamente.");
        return false;
    }
}

// Recupera o endereço salvo e preenche os campos.
function carregarEndereco() {
    const form = document.getElementById("formEndereco");

    if (!form) return;

    try {
        const enderecoSalvo = JSON.parse(
            localStorage.getItem(CHAVE_ENDERECO) || "{}"
        );

        Object.keys(enderecoSalvo).forEach(campo => {
            const elemento = form.elements.namedItem(campo);

            if (elemento && !elemento.value) {
                elemento.value = enderecoSalvo[campo] || "";
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar endereço:", erro);
    }
}

// Valida e salva o endereço antes de continuar.
function validarEndereco() {
    const form = document.getElementById("formEndereco");

    if (!form) {
        alert("Não foi possível localizar o formulário de endereço.");
        return false;
    }

    if (!form.reportValidity()) {
        const campoInvalido = form.querySelector(":invalid");

        if (campoInvalido) {
            campoInvalido.focus();
        }

        return false;
    }

    // Captura os dados atuais, mesmo que o navegador
    // não tenha disparado os eventos de preenchimento.
    const endereco = obterEnderecoDoFormulario();

    const camposObrigatorios = [
        "nome",
        "cep",
        "numero",
        "rua",
        "bairro",
        "cidade",
        "estado"
    ];

    const preenchido = camposObrigatorios.every(campo =>
        String(endereco[campo] || "").trim() !== ""
    );

    if (!preenchido) {
        alert("Preencha todos os campos obrigatórios do endereço.");
        return false;
    }

    const cepLimpo = String(endereco.cep).replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        alert("Informe um CEP válido com 8 números.");
        document.getElementById("cep")?.focus();
        return false;
    }

    // Salva antes de liberar o checkout.
    try {
        localStorage.setItem(
            CHAVE_ENDERECO,
            JSON.stringify(endereco)
        );
    } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        alert("Não foi possível salvar o endereço. Tente novamente.");
        return false;
    }

    return true;
}

// Carrega o endereço quando a página abre.
carregarEndereco();

// Salva automaticamente quando o usuário altera os campos.
const formularioEndereco = document.getElementById("formEndereco");

if (formularioEndereco) {
    formularioEndereco.addEventListener("input", salvarEndereco);
    formularioEndereco.addEventListener("change", salvarEndereco);
}


/* ============================================================
   PAGAMENTO
   ============================================================ */

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

    if (!mensagemPagamento) return;

    mensagemPagamento.textContent =
        `Forma selecionada: ${nomes[pagamento] || pagamento}.`;

    mensagemPagamento.style.color = "";
}

document.querySelectorAll(
    'input[name="formaPagamento"]'
).forEach(opcao => {
    opcao.addEventListener("change", () => {
        localStorage.setItem(CHAVE_PAGAMENTO, opcao.value);

        atualizarMensagemPagamento(opcao.value);
        atualizarParcelamento();
    });
});


/* ============================================================
   PARCELAMENTO
   ============================================================ */

function atualizarParcelamento() {
    const seletor = document.getElementById("quantidadeParcelas");
    const resultado = document.getElementById("resultadoParcelamento");

    if (!seletor || !resultado || !totalCarrinho) {
        return;
    }

    const pagamento = document.querySelector(
        'input[name="formaPagamento"]:checked'
    );

    if (!pagamento || pagamento.value !== "credito") {
        seletor.disabled = true;

        resultado.textContent =
            "Selecione cartão de crédito para simular as parcelas.";

        return;
    }

    seletor.disabled = false;

    const total = Number(
        totalCarrinho.textContent
            .replace(/[^\d,.-]/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
    ) || 0;

    if (total <= 0) {
        resultado.textContent =
            "Adicione produtos para simular as parcelas.";
        return;
    }

    const parcelas = Number(seletor.value) || 1;
    const valorParcela = total / parcelas;

    resultado.textContent =
        `${parcelas}x de ${formatarPreco(valorParcela)}`;
}


/* ============================================================
   CHECKOUT
   ============================================================ */

if (botaoCheckout) {
    botaoCheckout.addEventListener("click", evento => {
        const carrinho = obterCarrinho();
        const pagamento = obterPagamento();

        if (!carrinho.length) {
            evento.preventDefault();

            alert("Adicione pelo menos um produto ao carrinho.");
            return;
        }

        if (!validarEndereco()) {
            evento.preventDefault();
            return;
        }

        if (!pagamento) {
            evento.preventDefault();

            if (mensagemPagamento) {
                mensagemPagamento.textContent =
                    "Escolha uma forma de pagamento para continuar.";

                mensagemPagamento.style.color = "#c03939";
            }

            return;
        }

        localStorage.setItem(CHAVE_PAGAMENTO, pagamento);
    });
}


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

carregarCupom();
carregarPagamento();
renderCarrinho();
atualizarParcelamento();
