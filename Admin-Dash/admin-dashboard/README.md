# Hotel Order Bot - Admin Dashboard

Complete admin dashboard with PostgreSQL database for managing food inventory and table reservations.

## 🎯 Features

### Food Inventory Management
- View all menu items with real-time inventory (PostgreSQL backed)
- Add new menu items with name, price, category, and quantity
- Update quantity available for each item (increase/decrease)
- Delete menu items
- Items with 0 quantity appear faded
- All data persisted in PostgreSQL database

### Table Management
- View all tables with status (available/occupied/reserved)
- Add new tables with number and capacity
- Update table status in real-time
- Delete tables
- All data persisted in PostgreSQL database

### Kitchen Display
- Track orders by status (Pending → Preparing → Ready)

## 🛠 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)

## 🚀 Quick Start

### Option 1: Docker (Production Mode - Recommended)

Run everything with one command:

```bash
./start.sh
```

Or manually:

```bash
docker-compose up --build -d
```

Access at: **http://localhost:3000**

### Option 2: Development Mode

Run backend in Docker, frontend in dev mode:

```bash
./start-dev.sh
```

Or manually:

```bash
# Terminal 1: Start backend and database
docker-compose up -d postgres backend

# Terminal 2: Start frontend dev server
npm install
npm run dev
```

Access at: **http://localhost:5174**

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Production) | 3000 | http://localhost:3000 |
| Frontend (Development) | 5174 | http://localhost:5174 |
| Backend API | 5001 | http://localhost:5001/api |
| PostgreSQL | 5433 | localhost:5433 |

## 🔌 API Endpoints

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Create new menu item
- `PATCH /api/menu-items/:id/quantity` - Update quantity
- `DELETE /api/menu-items/:id` - Delete menu item

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create new table
- `PATCH /api/tables/:id/status` - Update table status
- `DELETE /api/tables/:id` - Delete table

## 🗄 Database

**Connection Details:**
- Host: `localhost` (or `postgres` in Docker network)
- Port: `5433` (external) / `5432` (internal)
- Database: `hotelbot`
- User: `postgres`
- Password: `postgres123`

Schema is automatically initialized on first run from `../backend/init.sql`

## 📝 Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# Rebuild containers
docker-compose up --build

# Access database
docker exec -it admin-postgres psql -U postgres -d hotelbot
```

## 🔧 Configuration

### Backend Environment Variables
Edit `../backend/.env`:
```
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hotelbot
DB_USER=postgres
DB_PASSWORD=postgres123
```

### Frontend Proxy (Development)
Configured in `vite.config.js` to proxy `/api` requests to `http://localhost:5000`

### Nginx Configuration (Production)
See `nginx.conf` for reverse proxy setup

## 📂 Project Structure

```
admin-dashboard/
├── docker-compose.yml      # All services (postgres, backend, frontend)
├── Dockerfile              # Frontend production build
├── nginx.conf              # Nginx reverse proxy config
├── start.sh                # Production startup script
├── start-dev.sh            # Development startup script
├── src/
│   ├── pages/
│   │   ├── AdminPage.jsx   # Food & table management (connected to API)
│   │   └── KitchenPage.jsx # Kitchen display
│   ├── components/
│   └── styles/
└── vite.config.js          # Dev server with API proxy
```

## 🐛 Troubleshooting

**Backend not responding?**
```bash
docker-compose logs backend
```

**Database connection issues?**
```bash
docker-compose logs postgres
docker exec -it admin-postgres pg_isready -U postgres
```

**Frontend can't reach API?**
- Development: Check vite proxy in `vite.config.js`
- Production: Check nginx proxy in `nginx.conf`

**Port already in use?**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in docker-compose.yml
```
