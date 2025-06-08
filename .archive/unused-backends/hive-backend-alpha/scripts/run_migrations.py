#!/usr/bin/env python3
"""Run database migrations using Alembic."""

import subprocess
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def run_migrations():
    """Run alembic migrations."""
    try:
        print("Running alembic upgrade head...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"], 
            check=True, 
            capture_output=True, 
            text=True
        )
        print("Migration output:", result.stdout)
        print("Migrations completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        print("Error output:", e.stderr)
        return False


def generate_migration(message: str):
    """Generate a new migration."""
    try:
        print(f"Generating migration: {message}")
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            check=True,
            capture_output=True,
            text=True
        )
        print("Migration generation output:", result.stdout)
        print("Migration generated successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Migration generation failed: {e}")
        print("Error output:", e.stderr)
        return False


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "generate":
        message = sys.argv[2] if len(sys.argv) > 2 else "auto_generated_migration"
        success = generate_migration(message)
    else:
        success = run_migrations()
    
    sys.exit(0 if success else 1)