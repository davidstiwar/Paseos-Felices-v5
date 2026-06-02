from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3009

    # Base de datos - MySQL XAMPP
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_user_profile"

settings = Settings()
