from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load from root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

DATABASE_URL = os.getenv("DATABASE_URL")

# Neon requires sslmode=require but asyncpg handles it differently
# We strip query params for the async URL and handle them in the engine
if DATABASE_URL:
    # Strip any existing query params for asyncpg to avoid "unexpected keyword argument" errors
    base_url = DATABASE_URL.split("?")[0]
    ASYNC_DATABASE_URL = base_url.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# For Neon, we need SSL. asyncpg uses ssl=True by default in many asyncpg clients,
# but in SQLAlchemy we can pass connect_args.
# We also limit pool size to prevent [WinError 10055] on Windows
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,
    connect_args={"ssl": True},
    pool_size=5,
    max_overflow=0,
    pool_recycle=3600,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
