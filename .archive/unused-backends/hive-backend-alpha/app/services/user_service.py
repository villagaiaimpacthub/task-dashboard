from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


async def create_user(db: AsyncSession, user_create: UserCreate) -> User:
    user = User(email=user_create.email)
    user.set_password(user_create.password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user(db: AsyncSession, user: User, user_update: UserUpdate) -> User:
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user or not user.verify_password(password):
        return None
    return user


async def set_user_online_status(db: AsyncSession, user_id: UUID, is_online: bool) -> Optional[User]:
    """Set user online status."""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    user.is_online = is_online
    await db.commit()
    await db.refresh(user)
    return user


async def get_online_users(db: AsyncSession, limit: int = 100) -> List[User]:
    """Get list of online users."""
    result = await db.execute(
        select(User)
        .where(User.is_online == True)
        .where(User.is_active == True)
        .limit(limit)
        .order_by(User.updated_at.desc())
    )
    return result.scalars().all()