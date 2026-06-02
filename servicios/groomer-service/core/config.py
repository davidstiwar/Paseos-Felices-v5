from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3025

    # Base de datos - MySQL XAMPP
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_groomer"
    
    # URL del services-catalog-service
    SERVICES_CATALOG_URL: str = "http://127.0.0.1:3014"

settings = Settings()
