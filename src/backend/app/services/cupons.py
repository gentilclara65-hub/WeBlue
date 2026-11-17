
from decimal import Decimal, ROUND_HALF_UP


CUPONS = {
    "INAUGURA10": {
        "tipo": "percentual",
        "valor": Decimal("10"),
        "limite": Decimal("25.00"),
        "minimo": Decimal("100.00"),
    },
    "INAUGURA15": {
        "tipo": "percentual",
        "valor": Decimal("15"),
        "limite": Decimal("40.00"),
        "minimo": Decimal("200.00"),
    },
    "BEMVINDA10": {
        "tipo": "percentual",
        "valor": Decimal("10"),
        "limite": Decimal("25.00"),
        "minimo": Decimal("120.00"),
    },
    "CUIDESE12": {
        "tipo": "percentual",
        "valor": Decimal("12"),
        "limite": Decimal("30.00"),
        "minimo": Decimal("150.00"),
    },
    "BELEZA15": {
        "tipo": "percentual",
        "valor": Decimal("15"),
        "limite": Decimal("45.00"),
        "minimo": Decimal("250.00"),
    },
    "MIMO20": {
        "tipo": "fixo",
        "valor": Decimal("20.00"),
        "limite": None,
        "minimo": Decimal("150.00"),
    },
    "ROTINA10": {
        "tipo": "percentual",
        "valor": Decimal("10"),
        "limite": Decimal("20.00"),
        "minimo": Decimal("100.00"),
    },
    "KIT15": {
        "tipo": "percentual",
        "valor": Decimal("15"),
        "limite": Decimal("35.00"),
        "minimo": Decimal("180.00"),
    },
    "WEBLUE25": {
        "tipo": "fixo",
        "valor": Decimal("25.00"),
        "limite": None,
        "minimo": Decimal("250.00"),
    },
    "SUPER10": {
        "tipo": "percentual",
        "valor": Decimal("10"),
        "limite": Decimal("15.00"),
        "minimo": Decimal("80.00"),
    },
}


def calcular_desconto(codigo: str, subtotal: Decimal) -> dict:
    codigo = codigo.strip().upper()

    cupom = CUPONS.get(codigo)

    if cupom is None:
        raise ValueError("Cupom inválido ou inexistente.")

    if subtotal < cupom["minimo"]:
        minimo = cupom["minimo"]
        raise ValueError(
            f"Este cupom exige uma compra mínima de R$ {minimo:.2f}."
        )

    if cupom["tipo"] == "percentual":
        desconto = subtotal * cupom["valor"] / Decimal("100")
        desconto = min(desconto, cupom["limite"])
    else:
        desconto = cupom["valor"]

    desconto = desconto.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    desconto = min(desconto, subtotal)

    total = (subtotal - desconto).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    return {
        "codigo": codigo,
        "subtotal": subtotal.quantize(Decimal("0.01")),
        "desconto": desconto,
        "total": total,
        "minimo": cupom["minimo"],
    }
