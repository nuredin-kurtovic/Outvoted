# Quick Start Guide - Step by Step

## ✅ Step 1: Set Up MySQL Database

Open your terminal and run these commands (you'll be prompted for your MySQL password):

```bash
# Navigate to project directory
cd /Users/nuredinkurtovic/Desktop/Outvoted

# 1. Create the database
mysql -u root -p -e "CREATE DATABASE outvoted;"

# 2. Create all tables (schema)
mysql -u root -p outvoted < backend/database/schema.sql

# 3. Add initial data (regions, actions, etc.)
mysql -u root -p outvoted < backend/database/seed.sql
```

**Note:** Replace `root` with your MySQL username if different. You'll be prompted for your MySQL password each time.

---

## ✅ Step 2: Configure Backend Environment

Create the `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` and update these values:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root                    # Your MySQL username
DB_PASSWORD=your_password      # Your MySQL password
DB_NAME=outvoted
JWT_SECRET=change_this_to_a_long_random_string_for_production
```

**Important:** 
- Replace `your_password` with your actual MySQL password
- Change `JWT_SECRET` to a long random string (for security)

---

## ✅ Step 3: Install Dependencies

From the project root directory:

```bash
cd /Users/nuredinkurtovic/Desktop/Outvoted

# Install all dependencies (root, backend, and frontend)
npm run install-all
```

This will install:
- Root dependencies (concurrently for running both servers)
- Backend dependencies (Express, MySQL, JWT, etc.)
- Frontend dependencies (Vue, Tailwind, etc.)

---

## ✅ Step 4: Start the Application

### Option A: Run Both Servers Together (Recommended)

From the project root:

```bash
npm run dev
```

This starts both:
- Backend server on `http://localhost:3000`
- Frontend server on `http://localhost:5173`

### Option B: Run Separately (Two Terminal Windows)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## ✅ Step 5: Access the Application

1. **Open your browser** and go to: `http://localhost:5173`

2. **Register a new account:**
   - Click "Register"
   - Fill in username, email, and password
   - You'll be automatically logged in

3. **Create your first game:**
   - Click "New Game"
   - Choose your candidate name, ethnicity, ideology, and home region
   - Click "Create Game"

4. **Start playing!**
   - Select a region
   - Choose an action (Campaign, Fundraising, Skill, or Ultimate)
   - Watch your support grow!

---

## 🔍 Verify Everything Works

### Test Backend API:
```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok","message":"Outvoted API is running"}`

### Test Database Connection:
If the backend starts without errors, the database connection is working!

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `backend/.env`
- Make sure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### "Port 3000 already in use"
- Change `PORT` in `backend/.env` to something else (e.g., 3001)
- Update frontend proxy in `frontend/vite.config.js` if needed

### "Module not found"
- Delete `node_modules` folders and reinstall:
  ```bash
  rm -rf node_modules backend/node_modules frontend/node_modules
  npm run install-all
  ```

### "Cannot find .env file"
- Make sure you created `backend/.env` (not `.env.example`)
- Check you're in the right directory

---

## 📱 For Mobile App Development

Once the backend is running, you can use these API endpoints:

- **Base URL:** `http://localhost:3000/api`
- **Authentication:** All game endpoints require JWT token in `Authorization: Bearer <token>` header
- **Endpoints:** See `README.md` for full API documentation

---

## 🎮 Game Flow

1. **Register/Login** → Get JWT token
2. **Create Game** → Choose candidate attributes
3. **View Game State** → See regions, budget, support
4. **Select Region** → Click on a region card
5. **Choose Action** → Campaign, Fundraising, Skill, or Ultimate
6. **End Turn** → Automatic (happens after action)
7. **Repeat** → Until turn 12 or game ends

---

## 📚 Next Steps After Setup

- Test all action types
- Try different ethnicities/ideologies
- Experiment with spending amounts
- Check how fatigue affects repeated actions
- Watch passive demographic shifts each turn
