
from decimal import Decimal
from pydantic import BaseModel, Field


class CriarProdutoRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    descricao: str = Field(min_length=5)
    preco: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    estoque: int = Field(ge=0)
    categoria: str = Field(min_length=2, max_length=100)
    subcategoria: str | None = Field(default=None, max_length=100)
    marca: str = Field(min_length=2, max_length=100)
    imagem_url: str | None = Field(default=None, max_length=500)
    status: str = Field(default="ATIVO", max_length=20)


class AtualizarProdutoRequest(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=150)
    descricao: str | None = Field(default=None, min_length=5)
    preco: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    estoque: int | None = Field(default=None, ge=0)
    categoria: str | None = Field(default=None, min_length=2, max_length=100)
    subcategoria: str | None = Field(default=None, max_length=100)
    marca: str | None = Field(default=None, min_length=2, max_length=100)
    imagem_url: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, max_length=20)
