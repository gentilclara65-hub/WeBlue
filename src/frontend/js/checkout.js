
/* ============================================================
   WEBLUE - CHECKOUT
   ============================================================
   Integração do carrinho, endereço, pagamento, parcelamento
   e cupons com a API de pedidos.
   ============================================================ */

const CHAVE_CARRINHO = "weblue-carrinho";
const CHAVE_CUPOM = "weblue-cupom";
const CHAVE_PAGAMENTO = "weblue-pagamento";
const CHAVE_ENDERECO = "weblue-endereco";

const resumoCheckout = document.getElementById("resumoCheckout");
const totalCheckout = document.getElementById("totalCheckout");
const formCheckout = document.getElementById("formCheckout");

const metodoPagamento = document.getElementById("metodoPagamento");
const campoCartao = document.getElementById("campoCartao");
const numeroCartao = document.getElementById("numeroCartao");

const campoParcelas = document.getElementById("campoParcelas");
const quantidadeParcelas = document.getElementById("quantidadeParcelas");
const resultadoParcelamento = document.getElementById("resultadoParcelamento");

const clienteCheckout = document.getElementById("clienteCheckout");
const campoEndereco = document.getElementById("endereco");

const botaoConfirmar = formCheckout?.querySelector("button[type='submit']");

const tokenCheckout = sessionStorage.getItem("tokenWeblue");

let calculoCupom = null;
let cupomValido = true;
let processandoCheckout = false;


/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */

if (!tokenCheckout) {
    sessionStorage.setItem("redirecionarAposLogin", "/checkout");
    window.location.href = "/login";
}


/* ============================================================
   FUNÇÕES AUXILIARES
   ============================================================ */

function formatarPreco(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number(valor) || 0);
}

function obterCarrinho() {
    try {
        const valor = localStorage.getItem(CHAVE_CARRINHO);
        const carrinho = valor ? JSON.parse(valor) : [];

        return Array.isArray(carrinho) ? carrinho : [];

    } catch (erro) {
        console.error("Erro ao ler carrinho:", erro);
        return [];
    }
}

function obterCupom() {
    return localStorage.getItem(CHAVE_CUPOM) || "";
}

function obterEndereco() {
    try {
        const valor = localStorage.getItem(CHAVE_ENDERECO);
        return valor ? JSON.parse(valor) : {};

    } catch (erro) {
        console.error("Erro ao recuperar endereço:", erro);
        return {};
    }
}

function obterPagamento() {
    return localStorage.getItem(CHAVE_PAGAMENTO) || "";
}

function mostrarMensagemCheckout(texto, tipo = "") {
    let mensagem = document.getElementById("mensagemCheckout");

    if (!mensagem && resumoCheckout) {
        mensagem = document.createElement("p");
        mensagem.id = "mensagemCheckout";
        resumoCheckout.appendChild(mensagem);
    }

    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.style.color = tipo === "erro" ? "#c03939" : "#27834a";
    mensagem.style.fontSize = "0.9rem";
}


/* ============================================================
   ENDEREÇO
   ============================================================ */

function formatarEndereco(endereco) {
    if (!endereco || typeof endereco !== "object") {
        return "";
    }

    const partes = [];

    if (endereco.nome) {
        partes.push(`Destinatário: ${endereco.nome}`);
    }

    if (endereco.rua || endereco.numero) {
        partes.push(
            `${endereco.rua || ""}, ${endereco.numero || "s/n"}`
        );
    }

    if (endereco.complemento) {
        partes.push(endereco.complemento);
    }

    if (endereco.bairro) {
        partes.push(endereco.bairro);
    }

    if (endereco.cidade || endereco.estado) {
        partes.push(
            `${endereco.cidade || ""} - ${endereco.estado || ""}`
        );
    }

    if (endereco.cep) {
        partes.push(`CEP: ${endereco.cep}`);
    }

    return partes.join(", ");
}

function carregarEndereco() {
    if (!campoEndereco) return;

    const endereco = obterEndereco();
    const enderecoFormatado = formatarEndereco(endereco);

    if (enderecoFormatado) {
        campoEndereco.value = enderecoFormatado;
    }
}


/* ============================================================
   PAGAMENTO
   ============================================================ */

function converterPagamento(pagamento) {
    const formas = {
        pix: "PIX",
        credito: "CARTAO",
        debito: "CARTAO",
        PIX: "PIX",
        CARTAO: "CARTAO"
    };

    return formas[pagamento] || "";
}

function carregarPagamento() {
    if (!metodoPagamento) return;

    const pagamentoSalvo = obterPagamento();
    const pagamentoApi = converterPagamento(pagamentoSalvo);

    if (pagamentoApi) {
        metodoPagamento.value = pagamentoApi;
    }

    atualizarCampoPagamento();
}

function atualizarCampoPagamento() {
    const metodo = metodoPagamento?.value || "PIX";

    /*
       O projeto utiliza pagamento simulado.
       Não coletamos nem enviamos dados reais de cartão.
    */

    if (campoCartao) {
        campoCartao.classList.add("hidden");
    }

    if (numeroCartao) {
        numeroCartao.value = "";
        numeroCartao.disabled = true;
    }

    if (metodo === "CARTAO") {
        campoParcelas?.classList.remove("hidden");

        if (quantidadeParcelas && !quantidadeParcelas.value) {
            quantidadeParcelas.value = "1";
        }

    } else {
        campoParcelas?.classList.add("hidden");

        if (quantidadeParcelas) {
            quantidadeParcelas.value = "1";
        }
    }

    localStorage.setItem(CHAVE_PAGAMENTO, metodo);

    atualizarResumoParcelamento();
}

if (metodoPagamento) {
    metodoPagamento.addEventListener("change", atualizarCampoPagamento);
}


/* ============================================================
   CÁLCULO DAS PARCELAS
   ============================================================ */

function obterTotalAtual() {
    const carrinho = obterCarrinho();

    const subtotalCarrinho = carrinho.reduce((total, item) => {
        const preco = Number(item.preco || 0);
        const quantidade = Number(item.quantidade || 1);

        return total + (preco * quantidade);
    }, 0);

    if (calculoCupom) {
        const totalCupom = Number(calculoCupom.total);

        if (Number.isFinite(totalCupom)) {
            return Math.max(0, totalCupom);
        }
    }

    return subtotalCarrinho;
}

function calcularValoresParcelas(total, quantidade) {
    /*
       O backend utiliza a mesma regra:
       divide os centavos igualmente e distribui
       os centavos restantes entre as primeiras parcelas.
    */

    const totalCentavos = Math.round(
        (Number(total) + Number.EPSILON) * 100
    );

    const valorBase = Math.floor(totalCentavos / quantidade);
    const resto = totalCentavos % quantidade;

    const parcelas = [];

    for (let indice = 0; indice < quantidade; indice++) {
        let centavos = valorBase;

        if (indice < resto) {
            centavos += 1;
        }

        parcelas.push(centavos / 100);
    }

    return parcelas;
}

function atualizarResumoParcelamento() {
    if (!resultadoParcelamento) return;

    const metodo = metodoPagamento?.value || "PIX";

    if (metodo !== "CARTAO") {
        resultadoParcelamento.textContent =
            "No PIX, o pagamento é realizado à vista.";

        return;
    }

    const quantidade = Number(quantidadeParcelas?.value || 1);
    const total = obterTotalAtual();

    if (
        !Number.isInteger(quantidade) ||
        quantidade < 1 ||
        quantidade > 6
    ) {
        resultadoParcelamento.textContent =
            "Selecione uma quantidade válida de parcelas.";

        return;
    }

    const parcelas = calcularValoresParcelas(total, quantidade);

    if (quantidade === 1) {
        resultadoParcelamento.textContent =
            `Pagamento em 1x de ${formatarPreco(parcelas[0])}, sem juros.`;

        return;
    }

    const valoresIguais = parcelas.every(
        valor => valor === parcelas[0]
    );

    if (valoresIguais) {
        resultadoParcelamento.textContent =
            `${quantidade}x de ${formatarPreco(parcelas[0])} sem juros.`;
    } else {
        resultadoParcelamento.textContent =
            `${quantidade} parcelas sem juros. ` +
            `Primeira parcela: ${formatarPreco(parcelas[0])}. ` +
            `As demais podem variar alguns centavos para fechar o total.`;
    }
}

if (quantidadeParcelas) {
    quantidadeParcelas.addEventListener(
        "change",
        atualizarResumoParcelamento
    );
}


/* ============================================================
   CONTA DO CLIENTE
   ============================================================ */

async function carregarContaCheckout() {
    if (!tokenCheckout) return;

    try {
        const resposta = await fetch("/api/perfil", {
            headers: {
                Authorization: `Bearer ${tokenCheckout}`
            }
        });

        if (resposta.status === 401) {
            sessionStorage.removeItem("tokenWeblue");
            sessionStorage.setItem("redirecionarAposLogin", "/checkout");
            window.location.href = "/login";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.detail || "Não foi possível verificar sua conta."
            );
        }

        if (clienteCheckout) {
            clienteCheckout.textContent =
                `Compra vinculada à conta de ${dados.nome_completo} (${dados.email}).`;
        }

    } catch (erro) {
        console.error("Erro ao verificar conta:", erro);

        if (clienteCheckout) {
            clienteCheckout.textContent =
                erro.message || "Não foi possível verificar sua conta.";
        }

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }
    }
}


/* ============================================================
   VALIDAR CUPOM NO BACKEND
   ============================================================ */

async function validarCupomNaApi(codigo) {
    const carrinho = obterCarrinho();

    const itens = carrinho.map(item => ({
        produto_id: Number(item.id),
        quantidade: Number(item.quantidade || 1)
    }));

    const resposta = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            codigo,
            itens
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            typeof dados.detail === "string"
                ? dados.detail
                : "Não foi possível validar o cupom."
        );
    }

    return dados;
}


/* ============================================================
   RESUMO DA COMPRA
   ============================================================ */

function renderResumo() {
    if (!resumoCheckout) return;

    const carrinho = obterCarrinho();

    resumoCheckout.replaceChildren();

    if (!carrinho.length) {
        const mensagem = document.createElement("p");
        mensagem.textContent = "Seu carrinho está vazio.";

        resumoCheckout.appendChild(mensagem);

        if (totalCheckout) {
            totalCheckout.textContent = formatarPreco(0);
        }

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }

        atualizarResumoParcelamento();

        return;
    }

    let subtotal = 0;

    const fragmento = document.createDocumentFragment();

    carrinho.forEach(item => {
        const quantidade = Number(item.quantidade || 1);
        const preco = Number(item.preco || 0);
        const subtotalItem = preco * quantidade;

        subtotal += subtotalItem;

        const linha = document.createElement("div");
        linha.className = "resumo-item";

        const nome = document.createElement("span");
        nome.textContent =
            `${quantidade}x ${item.nome || "Produto WeBlue"}`;

        const valor = document.createElement("strong");
        valor.textContent = formatarPreco(subtotalItem);

        linha.append(nome, valor);
        fragmento.appendChild(linha);
    });

    const subtotalFinal = calculoCupom
        ? Number(calculoCupom.subtotal)
        : subtotal;

    const descontoFinal = calculoCupom
        ? Number(calculoCupom.desconto)
        : 0;

    const totalFinal = calculoCupom
        ? Number(calculoCupom.total)
        : subtotal;

    function adicionarLinha(titulo, valor) {
        const linha = document.createElement("div");
        linha.className = "resumo-item";

        const texto = document.createElement("span");
        texto.textContent = titulo;

        const preco = document.createElement("strong");
        preco.textContent = formatarPreco(valor);

        linha.append(texto, preco);
        fragmento.appendChild(linha);
    }

    adicionarLinha("Subtotal", subtotalFinal);
    adicionarLinha("Desconto", -descontoFinal);

    resumoCheckout.appendChild(fragmento);

    if (totalCheckout) {
        totalCheckout.textContent = formatarPreco(totalFinal);
    }

    atualizarResumoParcelamento();

    if (botaoConfirmar) {
        botaoConfirmar.disabled = false;
    }
}


/* ============================================================
   RECALCULAR CUPOM
   ============================================================ */

async function atualizarResumoComCupom() {
    const codigo = obterCupom();

    calculoCupom = null;
    cupomValido = true;

    if (!obterCarrinho().length) {
        renderResumo();
        return;
    }

    if (!codigo) {
        renderResumo();
        return;
    }

    mostrarMensagemCheckout("Verificando seu cupom...");

    try {
        const dados = await validarCupomNaApi(codigo);

        calculoCupom = dados;
        cupomValido = true;

        renderResumo();

        mostrarMensagemCheckout(
            `Cupom ${codigo} aplicado! Desconto de ${formatarPreco(dados.desconto)}.`
        );

    } catch (erro) {
        cupomValido = false;

        renderResumo();

        mostrarMensagemCheckout(
            `Não foi possível validar o cupom: ${erro.message}. Volte ao carrinho para removê-lo ou corrigir a compra.`,
            "erro"
        );

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }
    }
}


/* ============================================================
   VALIDAR DADOS DO CHECKOUT
   ============================================================ */

function validarDadosCheckout() {
    const carrinho = obterCarrinho();

    if (!carrinho.length) {
        alert("Adicione pelo menos um produto ao carrinho.");
        return false;
    }

    if (!campoEndereco || campoEndereco.value.trim().length < 5) {
        alert("Informe um endereço de entrega válido.");
        campoEndereco?.focus();
        return false;
    }

    if (!metodoPagamento || !metodoPagamento.value) {
        alert("Selecione uma forma de pagamento.");
        metodoPagamento?.focus();
        return false;
    }

    if (!["PIX", "CARTAO"].includes(metodoPagamento.value)) {
        alert("Forma de pagamento inválida.");
        return false;
    }

    if (metodoPagamento.value === "PIX") {
        if (quantidadeParcelas) {
            quantidadeParcelas.value = "1";
        }
    }

    if (metodoPagamento.value === "CARTAO") {
        const quantidade = Number(quantidadeParcelas?.value);

        if (
            !Number.isInteger(quantidade) ||
            quantidade < 1 ||
            quantidade > 6
        ) {
            alert("Selecione uma quantidade de parcelas entre 1 e 6.");
            quantidadeParcelas?.focus();
            return false;
        }
    }

    if (!cupomValido) {
        alert("Seu cupom precisa ser corrigido antes de finalizar a compra.");
        return false;
    }

    return true;
}


/* ============================================================
   FINALIZAR COMPRA
   ============================================================ */

if (formCheckout) {
    formCheckout.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (processandoCheckout) return;

        if (!tokenCheckout) {
            window.location.href = "/login";
            return;
        }

        if (!validarDadosCheckout()) {
            return;
        }

        processandoCheckout = true;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
            botaoConfirmar.textContent = "Processando compra...";
        }

        try {
            const codigoCupom = obterCupom();

            /*
               Revalida o cupom imediatamente antes
               de enviar o pedido.
            */

            if (codigoCupom) {
                const dadosCupom = await validarCupomNaApi(codigoCupom);

                calculoCupom = dadosCupom;
                cupomValido = true;
            }

            const carrinho = obterCarrinho();

            const metodo = metodoPagamento.value;

            const parcelas = metodo === "PIX"
                ? 1
                : Number(quantidadeParcelas?.value || 1);

            const body = {
                endereco: campoEndereco.value.trim(),
                metodo_pagamento: metodo,
                quantidade_parcelas: parcelas,
                cupom_codigo: codigoCupom || null,
                itens: carrinho.map(item => ({
                    produto_id: Number(item.id),
                    quantidade: Number(item.quantidade || 1)
                }))
            };

            const resposta = await fetch("/api/pedidos/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenCheckout}`
                },
                body: JSON.stringify(body)
            });

            const dados = await resposta.json();

            if (resposta.status === 401) {
                sessionStorage.removeItem("tokenWeblue");
                sessionStorage.setItem("redirecionarAposLogin", "/checkout");
                window.location.href = "/login";
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    typeof dados.detail === "string"
                        ? dados.detail
                        : "Não foi possível confirmar a compra."
                );
            }

            /*
               Limpa apenas o carrinho e o cupom.
               Endereço e forma de pagamento continuam salvos.
            */

            localStorage.removeItem(CHAVE_CARRINHO);
            localStorage.removeItem(CHAVE_CUPOM);

            const pedido = dados.pedido;

            let mensagemSucesso =
                `Compra realizada com sucesso!\nPedido nº ${pedido.id}`;

            if (pedido.metodo_pagamento === "CARTAO") {
                mensagemSucesso +=
                    `\nPagamento: Cartão\nParcelamento: ${pedido.quantidade_parcelas}x`;

                mensagemSucesso +=
                    `\nValor da primeira parcela: ${formatarPreco(pedido.valor_parcela)}`;
            } else {
                mensagemSucesso += "\nPagamento: PIX à vista";
            }

            alert(mensagemSucesso);

            window.location.href = "/pedidos";

        } catch (erro) {
            console.error("Erro ao finalizar compra:", erro);

            alert(
                erro.message || "Não foi possível finalizar sua compra."
            );

        } finally {
            processandoCheckout = false;

            if (botaoConfirmar) {
                botaoConfirmar.disabled = false;
                botaoConfirmar.textContent = "Confirmar compra";
            }
        }
    });
}


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

async function inicializarCheckout() {
    if (!tokenCheckout) return;

    carregarEndereco();
    carregarPagamento();

    renderResumo();

    await Promise.all([
        carregarContaCheckout(),
        atualizarResumoComCupom()
    ]);
}

inicializarCheckout();
