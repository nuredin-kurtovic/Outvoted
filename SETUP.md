# Setup Guide

## Quick Start

### 1. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE outvoted;"

# Run schema
mysql -u root -p outvoted < backend/database/schema.sql

# Seed data
mysql -u root -p outvoted < backend/database/seed.sql
```

### 2. Backend Configuration

Create `backend/.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=outvoted
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_long_random_string
```

### 3. Install Dependencies

From the root directory:
```bash
npm run install-all
```

Or manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run the Application

**Option 1: Run both together (from root)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `backend/.env`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Module Not Found Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Testing the API

```bash
# Health check
curl http://localhost:3000/api/health

# Register (get token)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Use token in subsequent requests
curl http://localhost:3000/api/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
