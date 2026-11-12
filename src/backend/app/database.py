
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


# Usa o Neon quando DATABASE_URL estiver configurada.
# Caso contrário, mantém a conexão MySQL local.
if settings.database_url:
    database_url = settings.database_url

    # Ajusta o endereço para usar o driver psycopg.
    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql+psycopg://",
            1
        )
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1
        )
else:
    database_url = (
        "mysql+pymysql://"
        f"{quote_plus(settings.db_user)}:"
        f"{quote_plus(settings.db_password)}@"
        f"{settings.db_host}:{settings.db_port}/"
        f"{quote_plus(settings.db_name)}"
        "?charset=utf8mb4"
    )


engine = create_engine(
    database_url,
    pool_pre_ping=True
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_database():
    database = SessionLocal()

    try:
        yield database
    finally:
        database.close()
