
from pydantic import BaseModel, Field


class ItemCupomRequest(BaseModel):
    produto_id: int = Field(gt=0)
    quantidade: int = Field(gt=0)


class ValidarCupomRequest(BaseModel):
    codigo: str = Field(min_length=1, max_length=40)
    itens: list[ItemCupomRequest] = Field(min_length=1)
