
# ============================================================
# IMPORTAÇÕES PADRÃO DO PYTHON
# ============================================================

from pathlib import Path


# ============================================================
# IMPORTAÇÕES DO FASTAPI
# ============================================================

from fastapi import (
    FastAPI,
    HTTPException,
    status,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


# ============================================================
# SQLALCHEMY
# ============================================================

from sqlalchemy import text


# ============================================================
# BANCO DE DADOS
# ============================================================

from .database import engine


# ============================================================
# ROUTER PRINCIPAL DA API
# ============================================================

from .api import api_router


# ============================================================
# CAMINHO DO FRONTEND
# ============================================================

FRONTEND_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend"
)


# ============================================================
# CRIAÇÃO DO FASTAPI
# ============================================================

app = FastAPI(
    title="API Weblue",
    description="API do e-commerce de cosméticos Weblue.",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://weblue-production.up.railway.app",
    ],

    allow_credentials=False,

    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
        "OPTIONS",
    ],

    allow_headers=["*"],
)


# ============================================================
# ROTAS DA API
# ============================================================

app.include_router(api_router)


# ============================================================
# ARQUIVOS ESTÁTICOS
# ============================================================

# CSS
app.mount(
    "/css",
    StaticFiles(
        directory=FRONTEND_DIR / "css"
    ),
    name="css",
)

# JavaScript
app.mount(
    "/js",
    StaticFiles(
        directory=FRONTEND_DIR / "js"
    ),
    name="js",
)

# Imagens
app.mount(
    "/img",
    StaticFiles(
        directory=FRONTEND_DIR / "img"
    ),
    name="img",
)


# ============================================================
# PÁGINAS DO FRONTEND
# ============================================================


# ============================================================
# PÁGINA DE CUPONS
# ============================================================

@app.get(
    "/cupons",
    include_in_schema=False,
)
@app.get(
    "/cupons.html",
    include_in_schema=False,
)
def pagina_cupons():

    arquivo = FRONTEND_DIR / "cupons.html"

    if not arquivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Página de cupons não encontrada."
        )

    return FileResponse(arquivo)


# ============================================================
# PÁGINA DE DETALHES DO PRODUTO
# ============================================================

@app.get(
    "/produto.html",
    include_in_schema=False,
)
def pagina_produto():

    return FileResponse(
        FRONTEND_DIR / "produto.html"
    )


# ============================================================
# PÁGINA DE CATEGORIAS
# ============================================================

@app.get(
    "/categoria.html",
    include_in_schema=False,
)
def pagina_categoria():

    return FileResponse(
        FRONTEND_DIR / "categoria.html"
    )


# ============================================================
# PÁGINA DE VALE-COMPRAS
# ============================================================

@app.get(
    "/vale-compras",
    include_in_schema=False,
)
@app.get(
    "/vale-compras.html",
    include_in_schema=False,
)
def pagina_vale_compras():

    arquivo = FRONTEND_DIR / "vale-compras.html"

    if not arquivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Página de vale-compras não encontrada."
        )

    return FileResponse(arquivo)


# ============================================================
# PÁGINA INICIAL
# ============================================================

@app.get(
    "/",
    include_in_schema=False,
)
def pagina_inicial():

    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# ============================================================
# INDEX.HTML
# ============================================================

@app.get(
    "/index",
    include_in_schema=False,
)
@app.get(
    "/index.html",
    include_in_schema=False,
)
def pagina_index():

    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# ============================================================
# HOME
# ============================================================

@app.get(
    "/home",
    include_in_schema=False,
)
@app.get(
    "/home.html",
    include_in_schema=False,
)
def pagina_home():

    return FileResponse(
        FRONTEND_DIR / "home.html"
    )


# ============================================================
# CADASTRO
# ============================================================

@app.get(
    "/cadastro",
    include_in_schema=False,
)
@app.get(
    "/cadastro.html",
    include_in_schema=False,
)
def pagina_cadastro():

    return FileResponse(
        FRONTEND_DIR / "cadastro.html"
    )


# ============================================================
# LOGIN
# ============================================================

@app.get(
    "/login",
    include_in_schema=False,
)
@app.get(
    "/login.html",
    include_in_schema=False,
)
def pagina_login():

    return FileResponse(
        FRONTEND_DIR / "login.html"
    )


# ============================================================
# RECUPERAÇÃO DE SENHA
# ============================================================

@app.get(
    "/recuperar-senha",
    include_in_schema=False,
)
@app.get(
    "/recuperar-senha.html",
    include_in_schema=False,
)
def pagina_recuperar_senha():

    return FileResponse(
        FRONTEND_DIR / "recuperar-senha.html"
    )


# ============================================================
# ÁREA DO CLIENTE
# ============================================================

@app.get(
    "/cliente",
    include_in_schema=False,
)
@app.get(
    "/cliente.html",
    include_in_schema=False,
)
def pagina_cliente():

    return FileResponse(
        FRONTEND_DIR / "cliente.html"
    )


# ============================================================
# CARRINHO DE COMPRAS
# ============================================================

@app.get(
    "/carrinho",
    include_in_schema=False,
)
@app.get(
    "/carrinho.html",
    include_in_schema=False,
)
def pagina_carrinho():

    return FileResponse(
        FRONTEND_DIR / "carrinho.html"
    )


# ============================================================
# CHECKOUT
# ============================================================

@app.get(
    "/checkout",
    include_in_schema=False,
)
@app.get(
    "/checkout.html",
    include_in_schema=False,
)
def pagina_checkout():

    return FileResponse(
        FRONTEND_DIR / "checkout.html"
    )


# ============================================================
# HISTÓRICO DE PEDIDOS
# ============================================================

@app.get(
    "/pedidos",
    include_in_schema=False,
)
@app.get(
    "/pedidos.html",
    include_in_schema=False,
)
def pagina_pedidos():

    return FileResponse(
        FRONTEND_DIR / "pedidos.html"
    )


# ============================================================
# PAINEL ADMINISTRATIVO DE PRODUTOS
# ============================================================

@app.get(
    "/admin-produtos",
    include_in_schema=False,
)
@app.get(
    "/admin-produtos.html",
    include_in_schema=False,
)
def pagina_admin_produtos():

    return FileResponse(
        FRONTEND_DIR / "admin-produtos.html"
    )


# ============================================================
# DASHBOARD ADMINISTRATIVO
# ============================================================

@app.get(
    "/admin-dashboard",
    include_in_schema=False,
)
@app.get(
    "/admin-dashboard.html",
    include_in_schema=False,
)
def pagina_admin_dashboard():

    arquivo = FRONTEND_DIR / "admin-dashboard.html"

    if not arquivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Página dashboard não encontrada."
        )

    return FileResponse(arquivo)


# ============================================================
# PÁGINA DE LOGIN ADMINISTRATIVO
# ============================================================

@app.get(
    "/admin-login",
    include_in_schema=False,
)
@app.get(
    "/admin-login.html",
    include_in_schema=False,
)
def pagina_admin_login():

    arquivo = FRONTEND_DIR / "admin-login.html"

    if not arquivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Página de login administrativo não encontrada."
        )

    return FileResponse(arquivo)


# ============================================================
# INFORMAÇÕES DA API
# ============================================================

@app.get(
    "/api",
    tags=["Informações"],
)
def informacoes_api():

    return {
        "sistema": "Weblue",
        "mensagem": "API funcionando com sucesso",
    }


# ============================================================
# MONITORAMENTO DA API
# ============================================================

@app.get(
    "/health",
    tags=["Monitoramento"],
)
def verificar_saude():

    return {
        "status": "online"
    }


# ============================================================
# MONITORAMENTO DO BANCO DE DADOS
# ============================================================

@app.get(
    "/health/database",
    tags=["Monitoramento"],
)
def verificar_banco():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "online",
            "banco": "MySQL",
            "database": "weblue",
        }

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de dados indisponível",
        )
