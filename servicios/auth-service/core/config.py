import os
from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    PORT: int = 8000

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:@127.0.0.1:3306/paseos_auth"
    )

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:3000/auth/google/callback"
    )

    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24
    FRONTEND_URL: str = "http://localhost:3000"

settings = Settings()
