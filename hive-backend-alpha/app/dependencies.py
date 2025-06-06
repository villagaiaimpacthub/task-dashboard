from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import verify_access_token
from app.services import user_service

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        user_id = verify_access_token(credentials.credentials)
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = await user_service.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user