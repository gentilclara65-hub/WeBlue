
from getpass import getpass

from app.database import Base, engine, SessionLocal
from app.models.administrador import Administrador
from app.services.admin_security import criar_hash_senha_admin

# Cria a tabela, caso ainda não exista
Base.metadata.create_all(
    bind=engine,
    tables=[Administrador.__table__]
)

db = SessionLocal()

try:
    print("\n=== CADASTRO DO ADMINISTRADOR WEBLUE ===")

    nome = input("Nome: ").strip()
    email = input("E-mail: ").strip().lower()

    if not nome or not email:
        print("Nome e e-mail são obrigatórios.")
        raise SystemExit

    existente = db.query(Administrador).filter(
        Administrador.email == email
    ).first()

    if existente:
        print("Já existe um administrador com esse e-mail.")
        raise SystemExit

    senha = getpass("Crie sua senha: ")
    confirmacao = getpass("Confirme sua senha: ")

    if len(senha) < 8:
        print("A senha precisa ter pelo menos 8 caracteres.")
        raise SystemExit

    if senha != confirmacao:
        print("As senhas não são iguais.")
        raise SystemExit

    administrador = Administrador(
        nome=nome,
        email=email,
        senha_hash=criar_hash_senha_admin(senha),
        ativo=True
    )

    db.add(administrador)
    db.commit()

    print("\nAdministrador cadastrado com sucesso!")
    print("Agora você pode entrar na área administrativa.")

except SystemExit:
    pass

except Exception as erro:
    db.rollback()
    print("Erro ao cadastrar:", erro)

finally:
    db.close()
