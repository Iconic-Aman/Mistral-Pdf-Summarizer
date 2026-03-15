from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from sqlalchemy.future import select
from backend.db.session import AsyncSessionLocal
from backend.models.db_models import User

security = HTTPBearer()

# Replace with your actual Google Client ID from .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Simpler Auth: Use Google ID Token OR a secret API_KEY from .env
    """
    # 1. Simple API_KEY Check (for internal tests/Aman)
    if token.credentials == os.getenv("API_KEY"):
        # We return an object-like structure so user.id etc works in main.py
        class SystemAdmin:
            id = "system-admin"
            email = "admin@botzcoder.com"
            name = "System Admin"
            avatar_url = None
        return SystemAdmin()

    # 2. Google ID Token Verification (for real users)
    try:
        id_info = id_token.verify_oauth2_token(token.credentials, requests.Request(), GOOGLE_CLIENT_ID)
        google_id = id_info['sub']

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.google_id == google_id))
            user = result.scalars().first()
            
            # Create user on first login if they don't exist
            if not user:
                user = User(
                    google_id=google_id,
                    email=id_info['email'],
                    name=id_info.get('name'),
                    avatar_url=id_info.get('picture')
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            return user

    except Exception as e:
        print(f"Auth Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

