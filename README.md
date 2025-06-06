# HIVE Task Dashboard

A modern task coordination platform with real-time collaboration features, built with FastAPI backend and vanilla JavaScript frontend.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/villagaiaimpacthub/task-dashboard.git
cd task-dashboard
```

2. Set up the backend:
```bash
cd hive-backend-alpha
poetry install
cp .env.example .env
```

3. Initialize the database:
```bash
poetry run alembic upgrade head
```

4. Start the backend:
```bash
poetry run uvicorn app.main:app --reload
```

5. Start the frontend (in a new terminal):
```bash
cd hive-frontend
python3 server.py
```

6. Access the application at http://localhost:3000

## 📚 Documentation

- [START_HERE.md](./START_HERE.md) - Comprehensive overview and usage guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment instructions

## 🔥 Features

- 🔐 JWT Authentication
- 📋 Task Management with workflow states
- ⚡ Real-time updates via WebSocket
- 👥 Team coordination and online status
- 📊 Dashboard analytics
- 🎨 Responsive design

## 🛠 Tech Stack

**Backend:**
- FastAPI
- PostgreSQL/SQLite
- SQLAlchemy (Async)
- Alembic
- Celery + Redis
- WebSocket

**Frontend:**
- Vanilla JavaScript (zero dependencies)
- CSS Grid/Flexbox
- WebSocket API
- REST API integration

## 📁 Project Structure

```
task-dashboard/
├── hive-backend-alpha/     # Backend API
├── hive-frontend/          # Frontend application
├── project-docs/           # Original specifications
├── START_HERE.md          # Getting started guide
└── DEPLOYMENT_GUIDE.md    # Deployment instructions
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.