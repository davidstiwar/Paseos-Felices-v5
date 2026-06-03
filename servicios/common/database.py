from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

# Base declarativa para usar en todos los modelos
Base = declarative_base()

def get_database_setup(database_url: str):
    """
    Crea y retorna la configuración de base de datos para un servicio.
    Esta función centraliza la lógica de configuración de SQLAlchemy.
    """
    print(f"Setting up database with URL: {database_url}")
    # Reemplazar mysql:// con mysql+pymysql:// para Railway
    if database_url.startswith("mysql://"):
        database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
    # Optimizado para desarrollo con múltiples microservicios
    # QueuePool mantiene conexiones reutilizables para mejorar rendimiento
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        echo=False,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def get_db():
        db = SessionLocal()
        try:
            print("Database session created")
            yield db
        except Exception as e:
            # Evitar caracteres no soportados por la consola (cp1252) en Windows PowerShell
            print(f"ERROR: Database session error: {e}")
            raise
        finally:
            db.close()
    
    return engine, SessionLocal, Base, get_db
