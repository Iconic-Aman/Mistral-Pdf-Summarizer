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
    Middleware to verify Google ID Token and return the user from DB.
    """
    try:
        # 1. Verify the token with Google
        # In development, you might want to skip this if you don't have a real token
        id_info = id_token.verify_oauth2_token(
            token.credentials, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # 2. Extract user info
        google_id = id_info['sub']
        email = id_info['email']
        name = id_info.get('name')
        avatar_url = id_info.get('picture')

        # 3. Find or Create User in Neon DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.google_id == google_id))
            user = result.scalars().first()

            if not user:
                user = User(
                    google_id=google_id,
                    email=email,
                    name=name,
                    avatar_url=avatar_url
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            return user

    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID Token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auth error: {str(e)}",
        )
