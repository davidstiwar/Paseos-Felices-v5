from common.security.jwt import create_get_current_user
from .config import settings

get_current_user = create_get_current_user(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM
)
