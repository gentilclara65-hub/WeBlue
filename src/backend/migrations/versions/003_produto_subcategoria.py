"""Add subcategoria to produtos.

Revision ID: 003_produto_subcategoria
Revises: 002_security_state
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "003_produto_subcategoria"
down_revision = "002_security_state"
branch_labels = None
depends_on = None


def _coluna_existe(tabela, coluna):
    colunas = inspect(op.get_bind()).get_columns(tabela)
    return any(item["name"] == coluna for item in colunas)


def upgrade():
    # Só cria a coluna se ela ainda não existir
    # (alguns bancos locais já receberam a coluna manualmente).
    if not _coluna_existe("produtos", "subcategoria"):
        op.add_column(
            "produtos",
            sa.Column("subcategoria", sa.String(length=100), nullable=True),
        )


def downgrade():
    if _coluna_existe("produtos", "subcategoria"):
        op.drop_column("produtos", "subcategoria")
