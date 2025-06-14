from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import os
import shutil
from pathlib import Path

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.file import TaskFile
from app.models.task import Task

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_files(
    task_id: UUID = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload files for a task"""
    
    # Verify task exists and user has permission
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user is owner or assignee
    if task.owner_id != current_user.id and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this task")
    
    uploaded_files = []
    
    for file in files:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{task_id}_{current_user.id}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create database record
        db_file = TaskFile(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=file_path.stat().st_size,
            content_type=file.content_type,
            task_id=task_id,
            uploaded_by=current_user.id
        )
        
        db.add(db_file)
        await db.commit()
        await db.refresh(db_file)
        
        uploaded_files.append({
            "id": str(db_file.id),
            "name": db_file.original_filename,
            "size": db_file.file_size,
            "uploaded_at": db_file.created_at.isoformat()
        })
    
    return {
        "status": "success",
        "files": uploaded_files
    }


@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a file"""
    
    # Get file record
    result = await db.execute(select(TaskFile).where(TaskFile.id == file_id))
    file_record = result.scalar_one_or_none()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user has permission to access this file's task
    task_result = await db.execute(select(Task).where(Task.id == file_record.task_id))
    task = task_result.scalar_one_or_none()
    
    if not task or (task.owner_id != current_user.id and task.assignee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    
    # Check if file exists on disk
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.original_filename,
        media_type=file_record.content_type
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a file"""
    
    # Get file record
    result = await db.execute(select(TaskFile).where(TaskFile.id == file_id))
    file_record = result.scalar_one_or_none()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user has permission to delete this file
    task_result = await db.execute(select(Task).where(Task.id == file_record.task_id))
    task = task_result.scalar_one_or_none()
    
    if not task or (task.owner_id != current_user.id and task.assignee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    # Delete file from disk
    try:
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)
    except Exception as e:
        print(f"Warning: Could not delete file from disk: {e}")
    
    # Delete from database
    await db.delete(file_record)
    await db.commit()
    
    return {"message": "File deleted successfully"}