
"""Adiciona informações de cupons aos pedidos."""

from alembic import op
import sqlalchemy as sa


# Identificadores da migração
revision = "004_pedido_cupom"
down_revision = "003_produto_subcategoria"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "pedidos",
        sa.Column(
            "cupom_codigo",
            sa.String(length=40),
            nullable=True
        )
    )

    op.add_column(
        "pedidos",
        sa.Column(
            "valor_subtotal",
            sa.Numeric(10, 2),
            nullable=True
        )
    )

    op.add_column(
        "pedidos",
        sa.Column(
            "valor_desconto",
            sa.Numeric(10, 2),
            nullable=True
        )
    )


def downgrade():
    op.drop_column("pedidos", "valor_desconto")
    op.drop_column("pedidos", "valor_subtotal")
    op.drop_column("pedidos", "cupom_codigo")
