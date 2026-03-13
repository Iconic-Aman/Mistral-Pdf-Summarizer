import asyncio
import os
import sys

# Add backend to path so we can import from db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.db.session import engine

async def test_connection():
    try:
        print("Testing connection to Neon PostgreSQL...")
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Failed to connect: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
