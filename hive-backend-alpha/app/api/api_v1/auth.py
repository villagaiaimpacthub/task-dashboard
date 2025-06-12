from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin
from app.schemas.auth import TokenResponse
from app.services import user_service
from app.core.security import create_access_token

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_create: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await user_service.get_user_by_email(db, user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    await user_service.create_user(db, user_create)
    return {"message": "User created successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(user_login: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token)