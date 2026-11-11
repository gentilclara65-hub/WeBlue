# RF-004 — Vitrine de Produtos da Página Inicial

## 1. Identificação do Requisito

- **ID:** RF-004
- **Título:** Exibição de produtos na página inicial
- **Sistema:** WeBlue
- **Módulo:** Home / Vitrine de Produtos
- **Tipo:** Requisito funcional

## 2. Descrição do Requisito

A página inicial da plataforma WeBlue deverá apresentar uma vitrine de produtos para que os visitantes possam visualizar os itens disponíveis na loja.

Os produtos serão carregados automaticamente por meio da API pública do sistema, exibindo informações como nome, descrição, preço, categoria, marca, imagem e disponibilidade em estoque.

A vitrine deverá apresentar somente produtos com status ATIVO, permitindo que o visitante conheça os produtos e tenha acesso à opção de adicioná-los ao carrinho quando houver estoque disponível.

## 3. Atores

- **Visitante:** acessa a página inicial e visualiza os produtos.
- **Cliente:** pode visualizar os produtos e utilizar as funcionalidades de compra disponíveis.

## 4. Funcionalidades

- Carregar os produtos por meio da API.
- Exibir somente produtos ativos.
- Apresentar imagens dos produtos.
- Mostrar nome, descrição, marca e categoria.
- Exibir preços no formato de moeda brasileira (R$).
- Informar a quantidade disponível em estoque.
- Apresentar a opção de adicionar ao carrinho.
- Desabilitar o botão de compra quando o produto estiver indisponível.
- Exibir mensagens quando não houver produtos ou ocorrer falha no carregamento.

## 5. Integração com a API

A Home utiliza a seguinte rota pública:

**GET /api/produtos/catalogo**

A API retorna os produtos ativos cadastrados no sistema, incluindo os seguintes dados:

- ID;
- Nome;
- Descrição;
- Preço;
- Estoque;
- Categoria;
- Marca;
- Imagem;
- Status.

## 6. Regras de Negócio

1. Somente produtos com status ATIVO devem aparecer na vitrine.
2. Os preços devem ser apresentados em reais.
3. Produtos sem estoque devem ser identificados como indisponíveis.
4. O botão de adicionar ao carrinho deve ficar desabilitado quando não houver estoque.
5. Caso ocorra um erro ao carregar os produtos, o sistema deverá apresentar uma mensagem ao visitante.

## 7. Tecnologias Utilizadas

- HTML5;
- CSS3;
- JavaScript;
- API desenvolvida em Python;
- FastAPI;
- Banco de dados utilizado pelo projeto.

## 8. Testes e Verificações

Foram realizadas as seguintes verificações:

- Acesso à página inicial pelo navegador.
- Conferência da rota pública do catálogo.
- Verificação do carregamento dos produtos ativos.
- Verificação da estrutura de criação dos cards.
- Conferência da formatação dos preços.
- Verificação da exibição das informações de estoque.
- Conferência da implementação do botão de adicionar ao carrinho.

**Resultado:** a página inicial foi aberta no navegador e os produtos foram exibidos corretamente durante o teste realizado.

## 9. Resultado Esperado

A página inicial da WeBlue deverá oferecer uma vitrine organizada e funcional, permitindo que os visitantes conheçam os produtos disponíveis e tenham uma experiência de navegação simples e intuitiva.

## 10. Considerações Finais

O desenvolvimento da vitrine de produtos integra o frontend da página inicial à API pública do catálogo da WeBlue. A funcionalidade permite apresentar dinamicamente os produtos cadastrados e suas respectivas informações.