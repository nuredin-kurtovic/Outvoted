# Outvoted - Political Campaign Strategy Game

A turn-based multiplayer political strategy game set in Bosnia and Herzegovina. Players campaign across regions, manage budgets, and compete for national support over 12 turns.

## Features

- **Turn-based gameplay**: 12-turn political campaign simulation
- **Regional strategy**: Campaign across 6 regions with different demographics
- **Resource management**: Budget, charisma points, and fatigue system
- **Multiple action types**: Campaign actions, fundraising, skills, and ultimate abilities
- **Data-driven mechanics**: All game values stored in database
- **Multiplayer ready**: Database structure supports multiple players per game
- **RESTful API**: Backend ready for mobile app integration

## Tech Stack

### Backend
- Node.js with Express
- MySQL database
- JWT authentication
- bcryptjs for password hashing

### Frontend
- Vue.js 3 with Composition API
- Tailwind CSS for styling
- Pinia for state management
- Vue Router for navigation
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE outvoted;
```

2. Run the schema:
```bash
mysql -u root -p outvoted < backend/database/schema.sql
```

3. Seed the database:
```bash
mysql -u root -p outvoted < backend/database/seed.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=outvoted
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Running Both

From the root directory:
```bash
npm run install-all  # Install all dependencies
npm run dev          # Run both backend and frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Games
- `GET /api/games` - Get all games for current user
- `POST /api/games` - Create new game
- `GET /api/games/:gameId` - Get game state
- `GET /api/games/:gameId/actions` - Get available actions
- `POST /api/games/:gameId/turn` - Take a turn (execute action)
- `GET /api/games/regions/all` - Get all regions

## Game Mechanics

### Turn Structure
1. **Passive Demographic Shift**: Automatic support changes based on alignment
2. **Player Action**: Choose one action to execute
3. **Fatigue Application**: Repeated actions become less effective
4. **End of Turn**: Charisma points added, skills decay

### Support Calculation
- Initial support: 60% ethnic alignment + 40% ideological alignment
- Home region bonus: +3%
- Clamped between 5% and 95%
- National support: Population-weighted average

### Budget System
- Starting budget based on ethnic population share
- Can be increased through fundraising actions
- Spending can scale campaign effects (up to 2×)

### Fatigue System
- First 2 uses: No penalty
- From 3rd use onward: Exponential decay (minimum 30% effectiveness)

### Charisma System
- +10 charisma per turn
- Required for ultimate abilities
- Encourages strategic timing

## Database Schema

- `users` - User accounts
- `games` - Game instances
- `game_players` - Players in games
- `regions` - Bosnia and Herzegovina regions
- `regional_support` - Support percentages per region per player
- `actions` - Available game actions
- `action_history` - Turn history and fatigue tracking
- `active_skills` - Currently active skill effects
- `used_actions` - One-time use action tracking

## Future Enhancements

- Multiplayer game support (currently single-player ready)
- AI opponents
- Real-time game updates
- Mobile app using the same API
- Advanced analytics and statistics
- Tournament mode
- Custom game rules

## License

MIT
