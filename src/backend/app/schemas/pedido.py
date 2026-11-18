
from pydantic import BaseModel, Field, field_validator, model_validator


class ItemCarrinhoRequest(BaseModel):
    """Representa um produto adicionado ao carrinho."""

    produto_id: int = Field(gt=0)
    quantidade: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    """Dados enviados ao finalizar a compra."""

    endereco: str = Field(min_length=5, max_length=250)
    metodo_pagamento: str = Field(default="PIX")
    numero_cartao: str | None = Field(default=None, max_length=40)
    quantidade_parcelas: int = Field(default=1, ge=1, le=6)
    cupom_codigo: str | None = Field(default=None, max_length=40)
    itens: list[ItemCarrinhoRequest] = Field(min_length=1)

    @field_validator("metodo_pagamento")
    @classmethod
    def validar_metodo_pagamento(cls, valor: str) -> str:
        valor_normalizado = valor.strip().upper()

        if valor_normalizado not in {"PIX", "CARTAO"}:
            raise ValueError(
                "O método de pagamento deve ser PIX ou CARTAO."
            )

        return valor_normalizado

    @field_validator("cupom_codigo")
    @classmethod
    def normalizar_cupom(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip().upper()
        return valor or None

    @model_validator(mode="after")
    def validar_parcelamento(self):
        if self.metodo_pagamento == "PIX" and self.quantidade_parcelas != 1:
            raise ValueError(
                "O pagamento via PIX deve ser realizado à vista."
            )

        return self


class ResumoPedido(BaseModel):
    """Resumo do pedido gerado na compra."""

    id: int
    status: str
    valor_total: str
    metodo_pagamento: str
    endereco: str
    criado_em: str


class EstoqueResumo(BaseModel):
    """Resumo do estoque para a área administrativa ou cliente."""

    id: int
    nome: str
    estoque: int
    status: str
    preco: str
