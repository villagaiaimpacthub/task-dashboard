# HIVE Deployment Guide

Complete deployment instructions for the HIVE task coordination platform.

## 🚀 Quick Start (Development)

### Prerequisites
- Python 3.11+
- Poetry
- Docker & Docker Compose
- Modern web browser

### 1. Start Backend Services

```bash
# Navigate to backend
cd hive-backend-alpha

# Install dependencies
poetry install

# Start database services
docker-compose up -d

# Initialize database
poetry run python scripts/init_db.py

# Start Celery worker (Terminal 1)
poetry run celery -A app.workers.celery_app worker --loglevel=info

# Start FastAPI server (Terminal 2)
poetry run uvicorn app.main:app --reload
```

### 2. Start Frontend

```bash
# Navigate to frontend (Terminal 3)
cd hive-frontend

# Start development server
python server.py
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📋 System Requirements

### Development
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for dependencies

### Production
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: 2 cores minimum, 4+ cores recommended
- **Storage**: 20GB free space
- **Network**: Stable internet connection

## 🔧 Configuration

### Environment Variables

Backend (`.env`):
```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/hive_prod

# Security
SECRET_KEY=your-production-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Environment
ENVIRONMENT=production
DEBUG=false
```

### Database Setup

#### Development (Docker)
```bash
docker-compose up -d
```

#### Production (External PostgreSQL)
```bash
# Update DATABASE_URL in .env
# Run migrations
poetry run alembic upgrade head
```

## 🌐 Production Deployment

### Option 1: Docker Deployment

1. **Create Docker files** (backend):
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev

COPY . .
EXPOSE 8000
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Docker Compose** (full stack):
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hive_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    
  backend:
    build: ./hive-backend-alpha
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@postgres:5432/hive_prod
      - REDIS_URL=redis://redis:6379/0

  worker:
    build: ./hive-backend-alpha
    command: poetry run celery -A app.workers.celery_app worker --loglevel=info
    depends_on:
      - postgres
      - redis

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./hive-frontend:/usr/share/nginx/html
```

### Option 2: Traditional Server Deployment

#### Backend (Ubuntu/Debian)
```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip postgresql redis-server nginx

# Setup Python environment
pip install poetry
poetry install --no-dev

# Configure services
sudo systemctl enable postgresql redis-server nginx
sudo systemctl start postgresql redis-server nginx

# Setup database
sudo -u postgres createdb hive_prod
poetry run alembic upgrade head

# Setup systemd services (see below)
```

#### Frontend (Static Files)
```bash
# Copy frontend files to web server
sudo cp -r hive-frontend/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/hive
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket
    location /api/v1/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Systemd Services

#### Backend Service (`/etc/systemd/system/hive-backend.service`)
```ini
[Unit]
Description=HIVE Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=hive
WorkingDirectory=/opt/hive/hive-backend-alpha
Environment=PATH=/opt/hive/.local/bin
ExecStart=/opt/hive/.local/bin/poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Celery Worker (`/etc/systemd/system/hive-worker.service`)
```ini
[Unit]
Description=HIVE Celery Worker
After=network.target redis.service

[Service]
Type=simple
User=hive
WorkingDirectory=/opt/hive/hive-backend-alpha
Environment=PATH=/opt/hive/.local/bin
ExecStart=/opt/hive/.local/bin/poetry run celery -A app.workers.celery_app worker --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] **Strong secrets**: Generate secure SECRET_KEY and JWT_SECRET_KEY
- [ ] **HTTPS**: Configure SSL certificates (Let's Encrypt recommended)
- [ ] **Database security**: Use strong passwords, restrict access
- [ ] **Firewall**: Only expose necessary ports (80, 443)
- [ ] **Updates**: Keep all dependencies updated
- [ ] **Backups**: Regular database backups
- [ ] **Monitoring**: Setup logging and monitoring
- [ ] **CORS**: Configure specific origins (not *)

### SSL Setup (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
poetry run python -c "from app.database import engine; print('DB OK')"

# Redis connection
redis-cli ping
```

### Log Management
```bash
# Backend logs
journalctl -u hive-backend -f

# Worker logs
journalctl -u hive-worker -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup Strategy
```bash
# Database backup
pg_dump hive_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backups
echo "0 2 * * * pg_dump hive_prod > /backups/hive_$(date +\%Y\%m\%d).sql" | crontab -
```

## 🚀 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_online ON users(is_online);
```

### Application Optimization
- **Connection pooling**: Configure SQLAlchemy pool settings
- **Caching**: Add Redis caching for frequent queries
- **Load balancing**: Use multiple backend instances behind load balancer
- **CDN**: Serve static frontend files via CDN

### Monitoring Tools
- **Application**: Prometheus + Grafana
- **Database**: pg_stat_statements
- **System**: htop, iotop, netstat
- **Logs**: ELK stack or similar

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### WebSocket Connection Failed
```bash
# Check backend logs
journalctl -u hive-backend -f

# Test WebSocket endpoint
# Use browser dev tools Network tab
```

#### Tasks Not Loading
```bash
# Check API endpoint
curl http://localhost:8000/api/v1/tasks/ -H "Authorization: Bearer TOKEN"

# Check database
psql -d hive_prod -c "SELECT COUNT(*) FROM tasks;"
```

#### High Memory Usage
```bash
# Check processes
ps aux | grep -E "(python|postgres|redis)"

# Check database connections
psql -d hive_prod -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

## 📱 Scaling Considerations

### Horizontal Scaling
- **Load balancer**: nginx, HAProxy, or cloud load balancer
- **Multiple backend instances**: Scale API servers independently
- **Database replicas**: Read replicas for query scaling
- **Redis cluster**: For high-availability caching

### Vertical Scaling
- **Increase server resources**: More CPU, RAM, storage
- **Database tuning**: Optimize PostgreSQL configuration
- **Connection limits**: Adjust pool sizes and limits

## 🎯 Next Steps

### Phase 1: Production Deployment
1. Setup production servers
2. Configure monitoring
3. Implement backup strategy
4. SSL certificates
5. Performance testing

### Phase 2: Enhanced Features
1. Advanced task filtering
2. File attachments
3. Email notifications
4. Mobile app
5. Advanced analytics

### Phase 3: Scale & Optimize
1. Microservices architecture
2. Advanced caching
3. CDN integration
4. Global deployment
5. Enterprise features

This deployment guide provides everything needed to take HIVE from development to production!