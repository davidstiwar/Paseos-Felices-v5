from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3014
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_services_catalog"

settings = Settings()
