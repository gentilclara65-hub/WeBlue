# Weblue

Loja virtual de cosmÃ©ticos criada como projeto de LaboratÃ³rio de InovaÃ§Ã£o III.
O repositÃ³rio reÃºne uma aplicaÃ§Ã£o web com frontend em HTML, CSS e JavaScript,
API em FastAPI e persistÃªncia em MySQL.

> **Estado do projeto:** cadastro, autenticaÃ§Ã£o de clientes e administradores,
> catÃ¡logo, Ã¡rea administrativa, checkout e recuperaÃ§Ã£o de senha estÃ£o
> implementados. O pagamento Ã© simulado; nÃ£o use dados reais de cartÃ£o nem
> considere a aplicaÃ§Ã£o pronta para processar vendas reais.

## Funcionalidades

### Loja e conta do cliente

- CatÃ¡logo pÃºblico de produtos ativos.
- Carrinho persistido no navegador e checkout para clientes autenticados.
- CriaÃ§Ã£o de pedidos, registro de itens e atualizaÃ§Ã£o transacional do estoque.
- HistÃ³rico de pedidos acessÃ­vel somente pela conta autenticada.
- Cadastro com validaÃ§Ã£o de nome, e-mail, CPF, telefone, senha e aceite dos
  termos.
- Login, perfil, atualizaÃ§Ã£o de dados e logout com tokens JWT.
- LimitaÃ§Ã£o de tentativas e revogaÃ§Ã£o de tokens persistidas no MySQL e
  compartilhadas entre instÃ¢ncias.
- RecuperaÃ§Ã£o de senha por link enviado por SMTP. O token expira em 15 minutos,
  Ã© armazenado no banco somente como hash, sÃ³ pode ser usado uma vez e novas
  solicitaÃ§Ãµes invalidam o token anterior.

### AdministraÃ§Ã£o

- Login administrativo separado da autenticaÃ§Ã£o de clientes.
- Cadastro, consulta, atualizaÃ§Ã£o e desativaÃ§Ã£o de produtos.
- Envio de imagem de produto.
- Consulta de pedidos, estoque e relatÃ³rios de vendas e produtos.
- Rotas administrativas protegidas por token de administrador.

## Tecnologias

- **Backend:** Python, FastAPI, Pydantic e SQLAlchemy.
- **Banco de dados:** MySQL com PyMySQL.
- **AutenticaÃ§Ã£o:** JWT e hashes de senha com pwdlib/Argon2.
- **Frontend:** HTML, CSS e JavaScript sem framework.
- **Deploy configurado:** Railway, via [railway.json](./railway.json).
- **Testes:** pytest, FastAPI TestClient e SQLite em memÃ³ria.

## Requisitos

- Python compatÃ­vel com as versÃµes das dependÃªncias em
  [requirements.txt](./requirements.txt).
- MySQL acessÃ­vel localmente ou em um provedor.
- Git para clonar o repositÃ³rio.
- Para envio de recuperaÃ§Ã£o de senha: uma conta/serviÃ§o SMTP com TLS implÃ­cito
  na porta configurada.

## Executar localmente no Windows

### 1. Clonar e preparar o ambiente

No PowerShell:

```powershell
git clone https://github.com/gentilclara65-hub/WeBlue-Completo.git
cd WeBlue
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Se a polÃ­tica do PowerShell impedir a ativaÃ§Ã£o do ambiente virtual, execute os
comandos usando diretamente `.\.venv\Scripts\python.exe`.

### 2. Preparar o MySQL

Crie um usuÃ¡rio e banco MySQL com permissÃµes para criar e modificar tabelas.
O script [001_criar_tabela_clientes.sql](./database/ddl/001_criar_tabela_clientes.sql)
cria o banco `weblue` e a tabela inicial de clientes. Execute-o no MySQL antes
de iniciar a aplicaÃ§Ã£o, por exemplo, pelo MySQL Workbench ou cliente MySQL.

As tabelas sÃ£o gerenciadas pelo Alembic. Aplique as migraÃ§Ãµes apÃ³s configurar o
arquivo `.env`, conforme a etapa 4. A migraÃ§Ã£o inicial cria tabelas ausentes sem
alterar as existentes; a seguinte cria o armazenamento compartilhado de
tentativas de login e tokens revogados. Para mudanÃ§as futuras, crie uma nova
revisÃ£o Alembic e aplique-a antes de iniciar as instÃ¢ncias da aplicaÃ§Ã£o.

### 3. Configurar variÃ¡veis de ambiente

Crie um arquivo `.env` na raiz do repositÃ³rio. Ele Ã© ignorado pelo Git; nÃ£o
inclua credenciais ou segredos no README, em commits ou em chamados.

```dotenv
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=weblue

JWT_SECRET_KEY=gere_um_segredo_aleatorio_forte
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# NecessÃ¡rio para enviar links de recuperaÃ§Ã£o de senha
SMTP_HOST=
SMTP_PORT=465
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
FRONTEND_BASE_URL=http://localhost:8000
```

`DB_USER`, `DB_PASSWORD` e `JWT_SECRET_KEY` sÃ£o obrigatÃ³rios para iniciar a
aplicaÃ§Ã£o. Use um segredo JWT aleatÃ³rio e exclusivo para cada ambiente.

As variÃ¡veis SMTP sÃ£o opcionais para iniciar o serviÃ§o, mas necessÃ¡rias para
recuperar senhas. `SMTP_USERNAME` e `SMTP_PASSWORD` devem ser preenchidos em
conjunto. `FRONTEND_BASE_URL` deve ser a origem onde a pÃ¡gina
`/recuperar-senha` estÃ¡ hospedada; em produÃ§Ã£o, use HTTPS. Sem SMTP vÃ¡lido,
solicitaÃ§Ãµes de recuperaÃ§Ã£o retornam `503 Service Unavailable`.

### 4. Aplicar migraÃ§Ãµes

Na raiz do repositÃ³rio, com o `.env` configurado e o MySQL acessÃ­vel:

```powershell
python -m alembic -c src/backend/alembic.ini upgrade head
```

O Railway executa esse comando uma vez no estÃ¡gio de prÃ©-deploy, antes de
iniciar as instÃ¢ncias da API.

### 5. Iniciar a aplicaÃ§Ã£o

Na raiz do repositÃ³rio:

```powershell
python -m uvicorn backend.app.main:app --app-dir src --reload
```

A aplicaÃ§Ã£o atende em `http://localhost:8000`. Ela serve tanto a API quanto o
frontend. PÃ¡ginas e recursos Ãºteis:

- Loja: <http://localhost:8000/>
- DocumentaÃ§Ã£o interativa da API: <http://localhost:8000/docs>
- DocumentaÃ§Ã£o alternativa: <http://localhost:8000/redoc>
- SaÃºde da aplicaÃ§Ã£o: <http://localhost:8000/health>
- SaÃºde do banco: <http://localhost:8000/health/database>

O CORS tambÃ©m contÃ©m origens de desenvolvimento para Live Server e uma origem
Railway definida no cÃ³digo; ajuste a configuraÃ§Ã£o para o domÃ­nio efetivamente
usado antes de publicar o frontend/API separadamente.

## Principais rotas da API

Todas as rotas abaixo sÃ£o prefixadas por `/api`.

| MÃ©todo | Rota | Acesso | DescriÃ§Ã£o |
|---|---|---|---|
| `POST` | `/clientes` | PÃºblico | Cadastrar cliente |
| `POST` | `/auth/login` | PÃºblico | Login do cliente |
| `POST` | `/auth/refresh` | Refresh token | Renovar tokens do cliente |
| `POST` | `/auth/logout` | PÃºblico | Revogar tokens enviados |
| `POST` | `/auth/solicitar-recuperacao` | PÃºblico | Solicitar link de recuperaÃ§Ã£o |
| `POST` | `/auth/redefinir-senha` | PÃºblico | Redefinir senha com token |
| `GET` / `PUT` | `/perfil` | Cliente autenticado | Consultar/atualizar perfil |
| `GET` | `/produtos/catalogo` | PÃºblico | Listar catÃ¡logo ativo |
| `POST` / `GET` | `/produtos` | Administrador | Cadastrar/listar produtos |
| `GET` / `PUT` / `DELETE` | `/produtos/{produto_id}` | Administrador | Consultar/alterar/desativar produto |
| `POST` | `/produtos/{produto_id}/imagem` | Administrador | Enviar imagem de produto |
| `POST` | `/pedidos/checkout` | Cliente autenticado | Finalizar compra |
| `GET` | `/pedidos/me` | Cliente autenticado | Consultar o prÃ³prio histÃ³rico |
| `GET` | `/pedidos` | Administrador | Consultar pedidos |
| `GET` | `/pedidos/estoque` | Administrador | Consultar estoque |
| `GET` | `/pedidos/relatorios/vendas` | Administrador | Resumo de vendas |
| `GET` | `/pedidos/relatorios/produtos` | Administrador | Produtos mais vendidos |
| `POST` | `/admin/auth/login` | PÃºblico | Login administrativo |
| `POST` | `/admin/auth/refresh` | Refresh token admin | Renovar tokens administrativos |
| `POST` | `/admin/auth/logout` | PÃºblico | Revogar tokens administrativos |

Rotas protegidas recebem o access token no cabeÃ§alho:

```text
Authorization: Bearer <access_token>
```

O endpoint de cadastro administrativo nÃ£o Ã© pÃºblico. Cadastre administradores
por um processo controlado no banco; nunca disponibilize uma rota aberta para
criaÃ§Ã£o de contas administrativas.

## Checkout, estoque e pagamento

O checkout consolida quantidades repetidas do mesmo produto, bloqueia as linhas
de produto durante a transaÃ§Ã£o e baixa o estoque com uma condiÃ§Ã£o que impede
saldo negativo. O pedido, seus itens e a atualizaÃ§Ã£o de estoque sÃ£o confirmados
juntos; falhas causam rollback. Os identificadores de pedido e itens sÃ£o
gerados pelo banco.

O fluxo atual usa `simular_pagamento`: nÃ£o hÃ¡ gateway de pagamento integrado.
NÃ£o envie nÃºmeros de cartÃ£o reais Ã  aplicaÃ§Ã£o. Antes de qualquer uso comercial,
integre um provedor de pagamentos, trate confirmaÃ§Ãµes/webhooks e revise os
requisitos legais e de seguranÃ§a aplicÃ¡veis.

## Testes

Execute a suÃ­te a partir da raiz:

```powershell
python -m pytest -q
```

Os testes usam SQLite em memÃ³ria e cobrem autenticaÃ§Ã£o, recuperaÃ§Ã£o de senha,
autorizaÃ§Ã£o, checkout, cÃ¡lculo de estoque e rollback. Eles nÃ£o substituem testes
de concorrÃªncia no MySQL nem o teste de entrega por um provedor SMTP real.

## Deploy no Railway

O arquivo [railway.json](./railway.json) configura o comando de inicializaÃ§Ã£o,
`/health` como health check e o builder Railpack. Configure no Railway as
variÃ¡veis do banco e JWT listadas acima e, se for usar recuperaÃ§Ã£o de senha,
tambÃ©m as variÃ¡veis SMTP com a URL HTTPS pÃºblica. O banco MySQL deve estar
provisionado e acessÃ­vel pelo serviÃ§o.

As migraÃ§Ãµes sÃ£o aplicadas uma vez no estÃ¡gio `preDeployCommand` do
[railway.json](./railway.json), evitando que cada rÃ©plica tente migrar o banco.
O projeto ainda nÃ£o inclui gateway de pagamento; faÃ§a essa integraÃ§Ã£o e
validaÃ§Ã£o antes de considerar o deploy adequado para transaÃ§Ãµes reais.

## Estrutura do repositÃ³rio

```text
database/
  ddl/                 Script inicial do banco
  seeds/               InstruÃ§Ãµes/dados iniciais
docs/
  api/                 DocumentaÃ§Ã£o da API
  evidencias/          EvidÃªncias dos requisitos
  requisitos/          EspecificaÃ§Ãµes funcionais
  testes/              Planos e resultados de testes
src/
  backend/
    app/
      models/          Modelos SQLAlchemy
      routers/         Rotas FastAPI
      schemas/         ValidaÃ§Ã£o de entrada e saÃ­da
      services/        SeguranÃ§a e serviÃ§os de aplicaÃ§Ã£o
    tests/             Testes automatizados
  frontend/
    css/               Estilos
    img/               Imagens
    js/                LÃ³gica do navegador
    *.html             PÃ¡ginas da loja e administraÃ§Ã£o
```

## DocumentaÃ§Ã£o relacionada

- [EspecificaÃ§Ã£o de recuperaÃ§Ã£o de senha (RF-003)](./docs/requisitos/RF-003-recuperacao-senha.md)
- [Testes de recuperaÃ§Ã£o de senha (RF-003)](./docs/testes/RF-003-testes.md)
- [DocumentaÃ§Ã£o do backend de vendas](./src/README.md)
- [Script inicial do banco](./database/ddl/001_criar_tabela_clientes.sql)

## RepositÃ³rio

[gentilclara65-hub/WeBlue-Completo](https://github.com/gentilclara65-hub/WeBlue-Completo)


