from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3022

    # Base de datos - MySQL XAMPP
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_pets"

settings = Settings()
