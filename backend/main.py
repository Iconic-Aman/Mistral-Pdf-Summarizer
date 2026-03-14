from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from dotenv import load_dotenv

# Add project root to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from backend.middleware.auth import get_current_user
from backend.models.db_models import User
from backend.routers import upload

app = FastAPI(
    title="Mistral PDF Summarizer API",
    description="Backend for botzcoder.com",
    version="1.0.0",
)

# Include Routers
app.include_router(upload.router)






# Configure CORS
# In production, we will replace "*" with ["https://www.botzcoder.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Mistral PDF Summarizer API is Online",
        "status": "healthy",
        "documentation": "/docs"
    }

@app.get("/api/v1/me")
async def get_my_profile(user: User = Depends(get_current_user)):
    """
    Example protected route that returns the authenticated user's info.
    """
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar_url
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

