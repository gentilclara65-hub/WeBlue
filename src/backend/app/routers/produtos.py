
# ============================================================
# IMPORTAÇÕES
# ============================================================

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from pathlib import Path
import uuid


# ============================================================
# IMPORTAÇÕES INTERNAS DA WEBLUE
# ============================================================

from ..database import get_database
from ..models.produto import Produto
from ..services.admin_security import verificar_token_admin

from ..schemas.produto import (
    CriarProdutoRequest,
    AtualizarProdutoRequest,
)


# ============================================================
# CRIAÇÃO DO ROUTER
# ============================================================

router = APIRouter(
    tags=["Produtos"]
)

seguranca_admin = HTTPBearer()


def exigir_admin_autenticado(
    credenciais: HTTPAuthorizationCredentials = Depends(seguranca_admin),
    database: Session = Depends(get_database),
) -> int:

    admin_id = verificar_token_admin(
        credenciais.credentials,
        database
    )

    if admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo inválido ou expirado."
        )

    return admin_id


# ============================================================
# CADASTRAR PRODUTO
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar novo produto"
)
def cadastrar_produto(
    dados: CriarProdutoRequest,
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Cadastra um novo produto no banco de dados.

    Fluxo:

    1. Recebe os dados.
    2. Valida os dados com Pydantic.
    3. Cria um objeto Produto.
    4. Salva no MySQL.
    5. Retorna o produto cadastrado.
    """

    # ========================================================
    # NORMALIZAÇÃO DOS DADOS
    # ========================================================

    nome = dados.nome.strip()

    descricao = dados.descricao.strip()

    categoria = dados.categoria.strip()

    subcategoria = (
        dados.subcategoria.strip()
        if dados.subcategoria and dados.subcategoria.strip()
        else None
    )

    marca = dados.marca.strip()

    # ========================================================
    # VALIDAÇÃO ADICIONAL
    # ========================================================

    if len(nome) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O nome do produto é inválido."
        )

    if len(descricao) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A descrição do produto é inválida."
        )

    if len(categoria) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A categoria do produto é inválida."
        )

    if len(marca) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A marca do produto é inválida."
        )

    # ========================================================
    # CRIAÇÃO DO PRODUTO
    # ========================================================

    novo_produto = Produto(

        nome=nome,

        descricao=descricao,

        preco=dados.preco,

        estoque=dados.estoque,

        categoria=categoria,

        subcategoria=subcategoria,

        marca=marca,

        imagem_url=(
            dados.imagem_url.strip()
            if dados.imagem_url
            else None
        ),

        status="ATIVO"
    )

    # ========================================================
    # SALVAR NO BANCO
    # ========================================================

    database.add(novo_produto)

    database.commit()

    database.refresh(novo_produto)

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "mensagem": "Produto cadastrado com sucesso.",

        "produto": {

            "id": novo_produto.id,

            "nome": novo_produto.nome,

            "descricao": novo_produto.descricao,

            "preco": str(novo_produto.preco),

            "estoque": novo_produto.estoque,

            "categoria": novo_produto.categoria,

            "subcategoria": novo_produto.subcategoria,

            "marca": novo_produto.marca,

            "imagem_url": novo_produto.imagem_url,

            "status": novo_produto.status,

            "data_criacao": novo_produto.data_criacao,

            "data_atualizacao": novo_produto.data_atualizacao
        }
    }


# ============================================================
# LISTAR CATÁLOGO PÚBLICO
# ============================================================

@router.get(
    "/catalogo",
    summary="Listar catálogo público de produtos"
)
def listar_catalogo_publico(
    database: Session = Depends(get_database),
):

    """Retorna somente os produtos ativos para a vitrine da loja."""

    consulta = (
        select(Produto)
        .where(Produto.status == "ATIVO")
        .order_by(Produto.id)
    )

    produtos = database.scalars(consulta).all()

    lista_produtos = []

    for produto in produtos:

        lista_produtos.append({

            "id": produto.id,

            "nome": produto.nome,

            "descricao": produto.descricao,

            "preco": str(produto.preco),

            "estoque": produto.estoque,

            "categoria": produto.categoria,

            "subcategoria": produto.subcategoria,

            "marca": produto.marca,

            "imagem_url": produto.imagem_url,

            "status": produto.status,

            "data_criacao": produto.data_criacao,

            "data_atualizacao": produto.data_atualizacao,
        })

    return {
        "total": len(lista_produtos),
        "produtos": lista_produtos,
    }


# ============================================================
# BUSCAR PRODUTO DO CATÁLOGO POR ID (CONSULTA PÚBLICA)
# ============================================================

@router.get(
    "/catalogo/{produto_id}",
    summary="Buscar produto ativo do catálogo por ID"
)
def buscar_produto_catalogo(
    produto_id: int,
    database: Session = Depends(get_database),
):

    """
    Busca um produto ativo pelo ID, sem exigir login
    administrativo.

    Esta rota será utilizada pela página produto.html.
    """

    consulta = select(Produto).where(
        Produto.id == produto_id,
        Produto.status == "ATIVO"
    )

    produto = database.execute(
        consulta
    ).scalar_one_or_none()

    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou indisponível."
        )

    return {
        "produto": {

            "id": produto.id,

            "nome": produto.nome,

            "descricao": produto.descricao,

            "preco": str(produto.preco),

            "estoque": produto.estoque,

            "categoria": produto.categoria,

            "subcategoria": produto.subcategoria,

            "marca": produto.marca,

            "imagem_url": produto.imagem_url,

            "status": produto.status,

            "data_criacao": produto.data_criacao,

            "data_atualizacao": produto.data_atualizacao,
        }
    }


# ============================================================
# LISTAR PRODUTOS (ADMINISTRAÇÃO)
# ============================================================

@router.get(
    "",
    summary="Listar produtos"
)
def listar_produtos(
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Retorna todos os produtos cadastrados,
    incluindo os produtos inativos.
    """

    # ========================================================
    # CONSULTA
    # ========================================================

    consulta = (
        select(Produto)
        .order_by(Produto.id)
    )

    resultado = database.scalars(consulta)

    produtos = resultado.all()

    # ========================================================
    # PREPARAR RESPOSTA
    # ========================================================

    lista_produtos = []

    for produto in produtos:

        lista_produtos.append({

            "id": produto.id,

            "nome": produto.nome,

            "descricao": produto.descricao,

            "preco": str(produto.preco),

            "estoque": produto.estoque,

            "categoria": produto.categoria,

            "subcategoria": produto.subcategoria,

            "marca": produto.marca,

            "imagem_url": produto.imagem_url,

            "status": produto.status,

            "data_criacao": produto.data_criacao,

            "data_atualizacao": produto.data_atualizacao
        })

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "total": len(lista_produtos),

        "produtos": lista_produtos
    }


# ============================================================
# BUSCAR PRODUTO POR ID
# ============================================================

@router.get(
    "/{produto_id}",
    summary="Buscar produto por ID"
)
def buscar_produto_por_id(
    produto_id: int,
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Busca um produto específico utilizando o seu ID.
    """

    # ========================================================
    # BUSCAR PRODUTO
    # ========================================================

    consulta = select(Produto).where(
        Produto.id == produto_id
    )

    produto = database.execute(
        consulta
    ).scalar_one_or_none()

    # ========================================================
    # VERIFICAR SE O PRODUTO EXISTE
    # ========================================================

    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado."
        )

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "produto": {

            "id": produto.id,

            "nome": produto.nome,

            "descricao": produto.descricao,

            "preco": str(produto.preco),

            "estoque": produto.estoque,

            "categoria": produto.categoria,

            "subcategoria": produto.subcategoria,

            "marca": produto.marca,

            "imagem_url": produto.imagem_url,

            "status": produto.status,

            "data_criacao": produto.data_criacao,

            "data_atualizacao": produto.data_atualizacao
        }
    }


# ============================================================
# ATUALIZAR PRODUTO
# ============================================================

@router.put(
    "/{produto_id}",
    summary="Atualizar produto"
)
def atualizar_produto(
    produto_id: int,
    dados: AtualizarProdutoRequest,
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Atualiza os dados de um produto existente.

    É possível atualizar apenas os campos desejados.
    """

    # ========================================================
    # BUSCAR PRODUTO
    # ========================================================

    consulta = select(Produto).where(
        Produto.id == produto_id
    )

    produto = database.execute(
        consulta
    ).scalar_one_or_none()

    # ========================================================
    # VERIFICAR SE O PRODUTO EXISTE
    # ========================================================

    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado."
        )

    # ========================================================
    # IDENTIFICAR CAMPOS ENVIADOS
    # ========================================================

    dados_atualizacao = dados.model_dump(
        exclude_unset=True
    )

    # ========================================================
    # NORMALIZAR NOME
    # ========================================================

    if "nome" in dados_atualizacao:

        if dados_atualizacao["nome"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O nome do produto é inválido."
            )

        nome = dados_atualizacao["nome"].strip()

        if len(nome) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O nome do produto é inválido."
            )

        dados_atualizacao["nome"] = nome

    # ========================================================
    # NORMALIZAR DESCRIÇÃO
    # ========================================================

    if "descricao" in dados_atualizacao:

        if dados_atualizacao["descricao"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A descrição do produto é inválida."
            )

        descricao = dados_atualizacao["descricao"].strip()

        if len(descricao) < 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A descrição do produto é inválida."
            )

        dados_atualizacao["descricao"] = descricao

    # ========================================================
    # NORMALIZAR CATEGORIA
    # ========================================================

    if "categoria" in dados_atualizacao:

        if dados_atualizacao["categoria"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A categoria do produto é inválida."
            )

        categoria = dados_atualizacao["categoria"].strip()

        if len(categoria) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A categoria do produto é inválida."
            )

        dados_atualizacao["categoria"] = categoria

    # ========================================================
    # NORMALIZAR SUBCATEGORIA
    # ========================================================

    if "subcategoria" in dados_atualizacao:

        subcategoria = dados_atualizacao["subcategoria"]

        if subcategoria is not None:

            subcategoria = subcategoria.strip()

            dados_atualizacao["subcategoria"] = (
                subcategoria if subcategoria else None
            )

    # ========================================================
    # NORMALIZAR MARCA
    # ========================================================

    if "marca" in dados_atualizacao:

        if dados_atualizacao["marca"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A marca do produto é inválida."
            )

        marca = dados_atualizacao["marca"].strip()

        if len(marca) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A marca do produto é inválida."
            )

        dados_atualizacao["marca"] = marca

    # ========================================================
    # TRATAR IMAGEM
    # ========================================================

    if "imagem_url" in dados_atualizacao:

        imagem_url = dados_atualizacao["imagem_url"]

        if imagem_url is not None:

            imagem_url = imagem_url.strip()

            dados_atualizacao["imagem_url"] = (
                imagem_url
                if imagem_url
                else None
            )

    # ========================================================
    # VALIDAR STATUS
    # ========================================================

    if "status" in dados_atualizacao:

        status_produto = dados_atualizacao["status"]

        if status_produto is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="O status do produto é inválido."
            )

        status_produto = status_produto.strip().upper()

        if status_produto not in [
            "ATIVO",
            "INATIVO"
        ]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Status inválido. "
                    "Utilize ATIVO ou INATIVO."
                )
            )

        dados_atualizacao["status"] = status_produto

    # ========================================================
    # ATUALIZAR CAMPOS
    # ========================================================

    for campo, valor in dados_atualizacao.items():

        setattr(
            produto,
            campo,
            valor
        )

    # ========================================================
    # SALVAR NO MYSQL
    # ========================================================

    database.commit()

    database.refresh(produto)

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "mensagem": "Produto atualizado com sucesso.",

        "produto": {

            "id": produto.id,

            "nome": produto.nome,

            "descricao": produto.descricao,

            "preco": str(produto.preco),

            "estoque": produto.estoque,

            "categoria": produto.categoria,

            "subcategoria": produto.subcategoria,

            "marca": produto.marca,

            "imagem_url": produto.imagem_url,

            "status": produto.status,

            "data_criacao": produto.data_criacao,

            "data_atualizacao": produto.data_atualizacao
        }
    }


# ============================================================
# DESATIVAR PRODUTO
# ============================================================

@router.delete(
    "/{produto_id}",
    summary="Desativar produto"
)
def desativar_produto(
    produto_id: int,
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Desativa um produto existente.

    O produto NÃO será apagado fisicamente do banco.

    Seu status será alterado de ATIVO para INATIVO.
    """

    # ========================================================
    # BUSCAR PRODUTO
    # ========================================================

    consulta = select(Produto).where(
        Produto.id == produto_id
    )

    produto = database.execute(
        consulta
    ).scalar_one_or_none()

    # ========================================================
    # VERIFICAR SE O PRODUTO EXISTE
    # ========================================================

    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado."
        )

    # ========================================================
    # VERIFICAR SE JÁ ESTÁ INATIVO
    # ========================================================

    if produto.status == "INATIVO":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O produto já está inativo."
        )

    # ========================================================
    # DESATIVAR PRODUTO
    # ========================================================

    produto.status = "INATIVO"

    # ========================================================
    # SALVAR ALTERAÇÃO
    # ========================================================

    database.commit()

    database.refresh(produto)

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "mensagem": "Produto desativado com sucesso.",

        "produto": {

            "id": produto.id,

            "nome": produto.nome,

            "status": produto.status,

            "data_atualizacao": produto.data_atualizacao
        }
    }


# ============================================================
# CONFIGURAÇÃO DO UPLOAD DE IMAGENS
# ============================================================

SRC_DIR = Path(__file__).resolve().parents[3]

PRODUTOS_IMG_DIR = (
    SRC_DIR
    / "frontend"
    / "img"
    / "produtos"
)

PRODUTOS_IMG_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# TIPOS DE IMAGEM PERMITIDOS
# ============================================================

TIPOS_IMAGEM_PERMITIDOS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# ============================================================
# TAMANHO MÁXIMO
# ============================================================

TAMANHO_MAXIMO_IMAGEM = (
    5 * 1024 * 1024
)


# ============================================================
# UPLOAD DA IMAGEM DO PRODUTO
# ============================================================

@router.post(
    "/{produto_id}/imagem",
    status_code=status.HTTP_200_OK,
    summary="Enviar imagem do produto"
)
async def enviar_imagem_produto(
    produto_id: int,
    imagem: UploadFile = File(...),
    database: Session = Depends(get_database),
    admin_id: int = Depends(exigir_admin_autenticado),
):

    """
    Envia uma imagem para um produto já cadastrado.

    Fluxo:

    1. Recebe o ID do produto.
    2. Procura o produto no MySQL.
    3. Recebe a imagem enviada pelo navegador.
    4. Valida formato.
    5. Valida tamanho.
    6. Gera um nome único.
    7. Salva em frontend/img/produtos.
    8. Atualiza imagem_url no banco.
    9. Retorna a nova URL.
    """

    # ========================================================
    # BUSCAR PRODUTO
    # ========================================================

    consulta = select(Produto).where(
        Produto.id == produto_id
    )

    produto = database.execute(
        consulta
    ).scalar_one_or_none()

    # ========================================================
    # VERIFICAR SE O PRODUTO EXISTE
    # ========================================================

    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado."
        )

    # ========================================================
    # VALIDAR FORMATO
    # ========================================================

    if imagem.content_type not in TIPOS_IMAGEM_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Formato de imagem inválido. "
                "Utilize JPG, PNG ou WEBP."
            )
        )

    extensao = TIPOS_IMAGEM_PERMITIDOS[
        imagem.content_type
    ]

    # ========================================================
    # LER ARQUIVO
    # ========================================================

    conteudo = await imagem.read()

    # ========================================================
    # VERIFICAR ARQUIVO VAZIO
    # ========================================================

    if not conteudo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A imagem enviada está vazia."
        )

    # ========================================================
    # VALIDAR TAMANHO
    # ========================================================

    if len(conteudo) > TAMANHO_MAXIMO_IMAGEM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A imagem é muito grande. "
                "O tamanho máximo permitido é 5 MB."
            )
        )

    # ========================================================
    # GERAR NOME ÚNICO
    # ========================================================

    nome_arquivo = (
        f"produto-{produto.id}-"
        f"{uuid.uuid4().hex}"
        f"{extensao}"
    )

    caminho_arquivo = (
        PRODUTOS_IMG_DIR
        / nome_arquivo
    )

    # ========================================================
    # GUARDAR REFERÊNCIA DA IMAGEM ANTIGA
    # ========================================================

    imagem_antiga = produto.imagem_url

    # ========================================================
    # SALVAR NOVA IMAGEM NO DISCO
    # ========================================================

    try:

        with caminho_arquivo.open("wb") as arquivo:

            arquivo.write(conteudo)

    except OSError:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Não foi possível salvar "
                "a imagem do produto."
            )
        )

    # ========================================================
    # CRIAR URL PÚBLICA
    # ========================================================

    nova_imagem_url = (
        f"/img/produtos/{nome_arquivo}"
    )

    # ========================================================
    # ATUALIZAR PRODUTO
    # ========================================================

    produto.imagem_url = nova_imagem_url

    # ========================================================
    # SALVAR NO MYSQL
    # ========================================================

    try:

        database.commit()

        database.refresh(produto)

    except Exception:

        database.rollback()

        if caminho_arquivo.exists():

            try:
                caminho_arquivo.unlink()
            except OSError:
                pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Não foi possível atualizar "
                "a imagem do produto."
            )
        )

    # ========================================================
    # REMOVER IMAGEM LOCAL ANTIGA
    # ========================================================

    if (
        imagem_antiga
        and imagem_antiga.startswith("/img/produtos/")
        and imagem_antiga != nova_imagem_url
    ):

        nome_imagem_antiga = Path(
            imagem_antiga
        ).name

        caminho_imagem_antiga = (
            PRODUTOS_IMG_DIR
            / nome_imagem_antiga
        )

        if caminho_imagem_antiga.exists():

            try:
                caminho_imagem_antiga.unlink()
            except OSError:
                pass

    # ========================================================
    # RESPOSTA
    # ========================================================

    return {

        "mensagem": "Imagem do produto enviada com sucesso.",

        "produto": {

            "id": produto.id,

            "nome": produto.nome,

            "imagem_url": produto.imagem_url

        }

    }
