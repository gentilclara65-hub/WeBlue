
# ============================================================
# IMPORTAÇÕES
# ============================================================

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String,
    Text,
    Numeric,
    Integer,
    BigInteger,
    DateTime
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column
)

from ..database import Base


# ============================================================
# MODELO PRODUTO
# ============================================================

class Produto(Base):

    __tablename__ = "produtos"

    # ID
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    # NOME
    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    # DESCRIÇÃO
    descricao: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # PREÇO
    preco: Mapped[Decimal] = mapped_column(
        Numeric(precision=10, scale=2),
        nullable=False
    )

    # ESTOQUE
    estoque: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    # CATEGORIA
    categoria: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # SUBCATEGORIA
    subcategoria: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    # MARCA
    marca: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # IMAGEM
    imagem_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    # STATUS
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ATIVO"
    )

    # DATA DE CRIAÇÃO
    data_criacao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now
    )

    # DATA DE ATUALIZAÇÃO
    data_atualizacao: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now
    )
