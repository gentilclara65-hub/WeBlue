
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_database
from ..models.produto import Produto
from ..schemas.cupom import ValidarCupomRequest
from ..services.cupons import CUPONS, calcular_desconto


router = APIRouter()


@router.get("")
def listar_cupons():
    """
    Retorna os cupons cadastrados no sistema
    para exibição na página de cupons.
    """

    lista_cupons = []

    for codigo, cupom in CUPONS.items():

        tipo = cupom["tipo"]
        valor = cupom["valor"]
        minimo = cupom["minimo"]
        limite = cupom["limite"]

        if tipo == "percentual":
            descricao = f"{valor}% de desconto"
        else:
            descricao = f"R$ {valor:.2f} de desconto"

        lista_cupons.append({
            "codigo": codigo,
            "tipo": tipo,
            "valor": float(valor),
            "descricao": descricao,
            "minimo": float(minimo),
            "limite": (
                float(limite)
                if limite is not None
                else None
            ),
        })

    return {
        "total": len(lista_cupons),
        "cupons": lista_cupons,
    }


@router.post("/validar")
def validar_cupom(
    dados: ValidarCupomRequest,
    db: Session = Depends(get_database),
):
    quantidades = {}

    for item in dados.itens:
        quantidades[item.produto_id] = (
            quantidades.get(item.produto_id, 0)
            + item.quantidade
        )

    produto_ids = list(quantidades.keys())

    produtos = db.scalars(
        select(Produto).where(Produto.id.in_(produto_ids))
    ).all()

    produtos_por_id = {
        produto.id: produto
        for produto in produtos
    }

    if len(produtos_por_id) != len(produto_ids):
        raise HTTPException(
            status_code=404,
            detail="Um ou mais produtos do carrinho não foram encontrados.",
        )

    subtotal = Decimal("0.00")

    for produto_id, quantidade in quantidades.items():
        produto = produtos_por_id[produto_id]

        if produto.status != "ATIVO":
            raise HTTPException(
                status_code=400,
                detail=f'O produto "{produto.nome}" não está disponível.',
            )

        preco = Decimal(str(produto.preco))
        subtotal += preco * quantidade

    try:
        resultado = calcular_desconto(
            dados.codigo,
            subtotal,
        )

    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        )

    return {
        "valido": True,
        "codigo": resultado["codigo"],
        "subtotal": float(resultado["subtotal"]),
        "desconto": float(resultado["desconto"]),
        "total": float(resultado["total"]),
        "mensagem": "Cupom aplicado com sucesso!",
    }
