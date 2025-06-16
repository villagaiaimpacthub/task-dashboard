from pydantic_settings import BaseSettings
from typing import List, Union, Optional
import json


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Security
    secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    
    # CORS
    cors_origins: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:8080"]
    
    # File upload
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB
    
    # Supabase
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    # Redis/Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # Environment
    environment: str = "development"
    debug: bool = False

    @property
    def jwt_secret_key(self) -> str:
        """JWT secret key derived from secret_key"""
        return self.secret_key

    def model_post_init(self, __context) -> None:
        """Post-initialization processing"""
        # Parse CORS origins if it's a string
        if isinstance(self.cors_origins, str):
            try:
                self.cors_origins = json.loads(self.cors_origins)
            except json.JSONDecodeError:
                self.cors_origins = [self.cors_origins]

    class Config:
        env_file = ".env"


settings = Settings()