from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3008

    # Base de datos - MySQL XAMPP
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_notifications"

settings = Settings()
