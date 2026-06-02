from common.database import get_database_setup
from core.config import settings

engine, SessionLocal, Base, get_db = get_database_setup(settings.DATABASE_URL)
