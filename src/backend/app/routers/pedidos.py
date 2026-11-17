
# ============================================================
# ROTAS DO FLUXO DE VENDAS
# ============================================================

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..database import get_database
from ..models.cliente import Cliente
from ..models.item_pedido import ItemPedido
from ..models.pedido import Pedido, StatusPedido
from ..models.produto import Produto
from ..schemas.pedido import CheckoutRequest
from ..services.admin_security import verificar_token_admin
from ..services.security import verificar_token_acesso
from ..services.cupons import calcular_desconto


router = APIRouter(tags=["Pedidos e Vendas"])

seguranca_admin = HTTPBearer()
seguranca_cliente = HTTPBearer(auto_error=False)


def exigir_cliente_autenticado(
    credenciais: HTTPAuthorizationCredentials | None = Depends(seguranca_cliente),
    database: Session = Depends(get_database),
) -> Cliente:

    if credenciais is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cliente_id = verificar_token_acesso(
        credenciais.credentials,
        database
    )

    if cliente_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cliente = database.get(Cliente, cliente_id)

    if cliente is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cliente não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if cliente.status != "ATIVA":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta sem permissão de acesso.",
        )

    return cliente


def exigir_admin_autenticado(
    credenciais: HTTPAuthorizationCredentials = Depends(seguranca_admin),
    database: Session = Depends(get_database),
) -> int:

    admin_id = verificar_token_admin(
        credenciais.credentials,
        database
    )

    if admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo inválido ou expirado.",
        )

    return admin_id


def simular_pagamento(
    metodo_pagamento: str,
    numero_cartao: str | None
) -> bool:
    """Simula o resultado do pagamento sem depender de gateway real."""

    if metodo_pagamento == "PIX":
        return True

    if not numero_cartao:
        return False

    numeros = "".join(
        ch for ch in numero_cartao if ch.isdigit()
    )

    if len(numeros) < 13:
        return False

    return not all(
        digito == numeros[0] for digito in numeros
    )


# ============================================================
# CHECKOUT
# ============================================================

@router.post(
    "/checkout",
    status_code=status.HTTP_200_OK,
    summary="Finalizar compra e registrar pedido",
)
def finalizar_compra(
    dados: CheckoutRequest,
    database: Session = Depends(get_database),
    cliente: Cliente = Depends(exigir_cliente_autenticado),
):
    """Valida o carrinho, aplica cupom, confirma a venda e atualiza o estoque."""

    quantidades = {}

    for item in dados.itens:
        quantidades[item.produto_id] = (
            quantidades.get(item.produto_id, 0) + item.quantidade
        )

    try:
        produtos = database.execute(
            select(Produto)
            .where(Produto.id.in_(quantidades))
            .order_by(Produto.id)
            .with_for_update()
        ).scalars().all()

        produtos_por_id = {
            produto.id: produto for produto in produtos
        }

        for produto_id in sorted(quantidades):
            produto = produtos_por_id.get(produto_id)

            if produto is None or produto.status != "ATIVO":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Produto {produto_id} não encontrado "
                        "ou indisponível."
                    ),
                )

            if produto.estoque < quantidades[produto_id]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Produto '{produto.nome}' não possui "
                        f"estoque suficiente. Disponível: {produto.estoque}"
                    ),
                )

        # ----------------------------------------------------
        # CALCULAR SUBTOTAL COM OS PREÇOS DO BANCO
        # ----------------------------------------------------

        itens_do_pedido = []
        subtotal_pedido = Decimal("0.00")

        for produto_id in sorted(quantidades):
            produto = produtos_por_id[produto_id]
            quantidade = quantidades[produto_id]

            preco_unitario = Decimal(str(produto.preco))
            subtotal_item = preco_unitario * quantidade

            subtotal_pedido += subtotal_item

            itens_do_pedido.append(
                {
                    "produto": produto,
                    "quantidade": quantidade,
                    "preco_unitario": preco_unitario,
                    "subtotal": subtotal_item,
                }
            )

        # ----------------------------------------------------
        # VALIDAR E CALCULAR O CUPOM
        # ----------------------------------------------------

        codigo_cupom = dados.cupom_codigo
        valor_desconto = Decimal("0.00")

        if codigo_cupom:
            try:
                resultado_cupom = calcular_desconto(
                    codigo_cupom,
                    subtotal_pedido
                )

                codigo_cupom = resultado_cupom["codigo"]
                valor_desconto = resultado_cupom["desconto"]

            except ValueError as erro:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(erro),
                )

        total_pedido = subtotal_pedido - valor_desconto

        # ----------------------------------------------------
        # SIMULAR PAGAMENTO
        # ----------------------------------------------------

        if not simular_pagamento(
            dados.metodo_pagamento,
            dados.numero_cartao
        ):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    "Pagamento recusado. Verifique os dados "
                    "do pagamento e tente novamente."
                ),
            )

        # ----------------------------------------------------
        # ATUALIZAR ESTOQUE
        # ----------------------------------------------------

        for item in itens_do_pedido:
            produto = item["produto"]
            quantidade = item["quantidade"]

            resultado = database.execute(
                update(Produto)
                .where(
                    Produto.id == produto.id,
                    Produto.status == "ATIVO",
                    Produto.estoque >= quantidade,
                )
                .values(
                    estoque=Produto.estoque - quantidade
                )
                .execution_options(
                    synchronize_session=False
                )
            )

            if resultado.rowcount != 1:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"O estoque de '{produto.nome}' foi alterado. "
                        "Atualize o carrinho e tente novamente."
                    ),
                )

        # ----------------------------------------------------
        # REGISTRAR PEDIDO
        # ----------------------------------------------------

        pedido = Pedido(
            cliente_id=cliente.id,
            status=StatusPedido.PAGO,
            valor_total=total_pedido,
            cupom_codigo=codigo_cupom,
            valor_subtotal=subtotal_pedido,
            valor_desconto=valor_desconto,
        )

        database.add(pedido)
        database.flush()

        # ----------------------------------------------------
        # REGISTRAR ITENS DO PEDIDO
        # ----------------------------------------------------

        for item in itens_do_pedido:
            database.add(
                ItemPedido(
                    pedido_id=pedido.id,
                    produto_id=item["produto"].id,
                    quantidade=item["quantidade"],
                    preco_unitario=item["preco_unitario"],
                    subtotal=item["subtotal"],
                )
            )

        database.flush()
        database.refresh(pedido)

        # ----------------------------------------------------
        # RESPOSTA DO CHECKOUT
        # ----------------------------------------------------

        resposta = {
            "mensagem": "Pedido registrado com sucesso.",
            "pedido": {
                "id": pedido.id,
                "status": pedido.status.value,
                "valor_total": str(pedido.valor_total),
                "valor_subtotal": str(pedido.valor_subtotal),
                "valor_desconto": str(pedido.valor_desconto),
                "cupom_codigo": pedido.cupom_codigo,
                "metodo_pagamento": dados.metodo_pagamento,
                "endereco": dados.endereco,
                "criado_em": (
                    pedido.criado_em.isoformat()
                    if pedido.criado_em
                    else None
                ),
                "itens": [
                    {
                        "produto_id": item["produto"].id,
                        "nome": item["produto"].nome,
                        "quantidade": item["quantidade"],
                        "subtotal": str(item["subtotal"]),
                    }
                    for item in itens_do_pedido
                ],
            },
        }

        database.commit()

        return resposta

    except Exception:
        database.rollback()
        raise


# ============================================================
# HISTÓRICO DE PEDIDOS DO CLIENTE
# ============================================================

@router.get(
    "/me",
    summary="Listar pedidos do cliente",
)
def listar_pedidos_cliente(
    database: Session = Depends(get_database),
    cliente: Cliente = Depends(exigir_cliente_autenticado),
):
    """Retorna o histórico do cliente autenticado."""

    pedidos = (
        database.execute(
            select(Pedido)
            .where(Pedido.cliente_id == cliente.id)
            .order_by(Pedido.criado_em.desc())
        )
        .scalars()
        .all()
    )

    resposta = []

    for pedido in pedidos:
        itens = []

        for item in pedido.itens:
            itens.append(
                {
                    "produto_id": item.produto_id,
                    "nome": (
                        item.produto.nome
                        if item.produto
                        else "Produto"
                    ),
                    "quantidade": item.quantidade,
                    "subtotal": str(item.subtotal),
                }
            )

        resposta.append(
            {
                "id": pedido.id,
                "status": pedido.status.value,
                "valor_total": str(pedido.valor_total),
                "valor_subtotal": (
                    str(pedido.valor_subtotal)
                    if pedido.valor_subtotal is not None
                    else None
                ),
                "valor_desconto": (
                    str(pedido.valor_desconto)
                    if pedido.valor_desconto is not None
                    else None
                ),
                "cupom_codigo": pedido.cupom_codigo,
                "criado_em": (
                    pedido.criado_em.isoformat()
                    if pedido.criado_em
                    else None
                ),
                "itens": itens,
            }
        )

    return {
        "total": len(resposta),
        "pedidos": resposta
    }


# ============================================================
# LISTAR TODOS OS PEDIDOS - ADMINISTRADOR
# ============================================================

@router.get(
    "",
    summary="Listar todos os pedidos",
)
def listar_pedidos(
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):
    """Lista pedidos do sistema para consulta administrativa."""

    pedidos = (
        database.execute(
            select(Pedido)
            .order_by(Pedido.criado_em.desc())
        )
        .scalars()
        .all()
    )

    resposta = []

    for pedido in pedidos:
        resposta.append(
            {
                "id": pedido.id,
                "cliente_id": pedido.cliente_id,
                "status": pedido.status.value,
                "valor_total": str(pedido.valor_total),
                "valor_subtotal": (
                    str(pedido.valor_subtotal)
                    if pedido.valor_subtotal is not None
                    else None
                ),
                "valor_desconto": (
                    str(pedido.valor_desconto)
                    if pedido.valor_desconto is not None
                    else None
                ),
                "cupom_codigo": pedido.cupom_codigo,
                "criado_em": (
                    pedido.criado_em.isoformat()
                    if pedido.criado_em
                    else None
                ),
                "itens": [
                    {
                        "produto_id": item.produto_id,
                        "nome": (
                            item.produto.nome
                            if item.produto
                            else "Produto"
                        ),
                        "quantidade": item.quantidade,
                        "subtotal": str(item.subtotal),
                    }
                    for item in pedido.itens
                ],
            }
        )

    return {
        "total": len(resposta),
        "pedidos": resposta
    }


# ============================================================
# CONSULTAR ESTOQUE
# ============================================================

@router.get(
    "/estoque",
    summary="Consultar disponibilidade de estoque",
)
def consultar_estoque(
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):
    """Retorna os produtos com quantidade disponível em estoque."""

    produtos = database.execute(
        select(Produto).order_by(Produto.id)
    ).scalars().all()

    return {
        "total": len(produtos),
        "produtos": [
            {
                "id": produto.id,
                "nome": produto.nome,
                "estoque": produto.estoque,
                "status": produto.status,
                "preco": str(produto.preco),
                "categoria": produto.categoria,
            }
            for produto in produtos
        ],
    }


# ============================================================
# RELATÓRIO DE VENDAS
# ============================================================

@router.get(
    "/relatorios/vendas",
    summary="Resumo geral de vendas"
)
def relatorio_vendas(
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):
    pedidos = (
        database.execute(
            select(Pedido)
            .where(Pedido.status == StatusPedido.PAGO)
        )
        .scalars()
        .all()
    )

    total_vendas = sum(
        (Decimal(str(p.valor_total)) for p in pedidos),
        Decimal("0.00")
    )

    quantidade_pedidos = len(pedidos)

    ticket_medio = (
        total_vendas / quantidade_pedidos
        if quantidade_pedidos
        else Decimal("0.00")
    )

    return {
        "faturamento_total": round(float(total_vendas), 2),
        "quantidade_pedidos": quantidade_pedidos,
        "ticket_medio": round(float(ticket_medio), 2)
    }


# ============================================================
# RELATÓRIO DE PRODUTOS MAIS VENDIDOS
# ============================================================

@router.get(
    "/relatorios/produtos",
    summary="Produtos mais vendidos"
)
def relatorio_produtos(
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):
    resultado = (
        database.query(
            Produto.nome,
            func.sum(ItemPedido.quantidade).label("total")
        )
        .join(
            ItemPedido,
            Produto.id == ItemPedido.produto_id
        )
        .group_by(Produto.nome)
        .order_by(
            func.sum(ItemPedido.quantidade).desc()
        )
        .all()
    )

    return [
        {
            "produto": item.nome,
            "quantidade_vendida": int(item.total)
        }
        for item in resultado
    ]
