
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_database
from ..models.produto import Produto
from ..schemas.cupom import ValidarCupomRequest
from ..services.cupons import calcular_desconto


router = APIRouter()


@router.post("/validar")
def validar_cupom(
    dados: ValidarCupomRequest,
    db: Session = Depends(get_database),
):
    quantidades = {}

    for item in dados.itens:
        quantidades[item.produto_id] = (
            quantidades.get(item.produto_id, 0) + item.quantidade
        )

    produto_ids = list(quantidades.keys())

    produtos = db.scalars(
        select(Produto).where(Produto.id.in_(produto_ids))
    ).all()

    produtos_por_id = {produto.id: produto for produto in produtos}

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
