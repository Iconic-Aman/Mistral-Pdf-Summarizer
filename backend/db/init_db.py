import asyncio
import os
import sys

# Add project root to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.db.session import engine, Base
from backend.models.db_models import User, Job, Summary, Chunk

async def init_models():
    async with engine.begin() as conn:
        print("Creating tables in Neon PostgreSQL...")
        # Optional: Drop all tables if you want a fresh start
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())
