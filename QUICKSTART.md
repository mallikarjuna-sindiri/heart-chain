# 🚀 Heart-Chain Quick Start Guide

## Fastest Way to Get Started (Using Docker)

### 1. Prerequisites
- Docker and Docker Compose installed
- Git

### 2. Clone and Configure

```bash
# Clone repository
git clone <your-repo-url>
cd CN

# Setup Backend Environment
cd backend
cp .env.example .env
# Edit .env and configure:
# - SECRET_KEY (generate a secure random string)
# - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (get from razorpay.com)
# - SMTP credentials (for email notifications)

# Setup Frontend Environment
cd ../frontend
cp .env.example .env
# Edit .env and set:
# - VITE_RAZORPAY_KEY_ID (same as backend)

cd ..
```

### 3. Start Everything with Docker

```bash
docker-compose up -d
```

That's it! 🎉

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

---

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Ensure MongoDB is running locally
# Or use MongoDB Atlas connection string

# Start backend
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env

# Start frontend
npm run dev
```

---

## First Steps After Installation

### 1. Create Admin Account

Register as admin through the API or create directly in MongoDB:

```bash
# Using the API (after starting backend)
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@heartchain.org",
    "password": "Admin@123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### 2. Register as Donor

Visit http://localhost:5173/register and:
- Choose "Donor" role
- Fill in details
- Complete registration

### 3. Register as Orphanage

Visit http://localhost:5173/register and:
- Choose "Orphanage" role
- Fill in details
- After login, complete orphanage profile
- Wait for admin verification

### 4. Test Complete Flow

1. **As Admin**: Verify the orphanage
2. **As Orphanage**: Create a campaign
3. **As Admin**: Approve the campaign
4. **As Donor**: Browse campaigns and donate
5. **As Orphanage**: Submit utilization report
6. **As Admin**: Verify the report

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `docker-compose ps`
- Check connection string in backend `.env`

### Frontend Can't Connect to Backend
- Verify backend is running on port 8000
- Check `VITE_API_URL` in frontend `.env`
- Check CORS settings in backend

### Razorpay Integration Issues
- Verify API keys are correct
- In test mode, use test key IDs
- Check webhook configuration

### Email Notifications Not Working
- Verify SMTP credentials in backend `.env`
- For Gmail, use App Password, not regular password
- Check spam folder

---

## Development Tips

### Backend Hot Reload
Changes to Python files auto-reload with `--reload` flag

### Frontend Hot Reload
Vite automatically reloads on file changes

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# MongoDB shell
docker exec -it heartchain-mongodb mongosh
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

---

## Common Development Commands

### Backend

```bash
# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .

# Lint
flake8
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## Environment-Specific Setup

### Development
- Use `.env` with local MongoDB
- Enable debug mode
- Use Razorpay test keys

### Production
- Use MongoDB Atlas or managed MongoDB
- Disable debug mode
- Use production Razorpay keys
- Set secure SECRET_KEY
- Enable HTTPS
- Configure proper CORS origins

---

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- View API docs at http://localhost:8000/docs
- Check backend logs: `docker-compose logs backend`
- Check frontend logs: `docker-compose logs frontend`

---

**Happy Coding! 💖**
