from sqlalchemy import Column, String, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from .base import BaseModel

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    impact_score = Column(Integer, default=0, nullable=False)
    skills = Column(JSON, default=list)  # List of user's skills
    role = Column(String, nullable=True)  # e.g., "Ecosystem Designer", "Data Analyst"
    status = Column(String, default="available")  # available, busy
    
    # Relationships
    owned_projects = relationship("Project", foreign_keys="Project.owner_id", back_populates="owner")
    assigned_projects = relationship("Project", foreign_keys="Project.assignee_id", back_populates="assignee")
    
    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)