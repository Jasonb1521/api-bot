# Quick Start Guide - Admin Dashboard

## 🚀 Fastest Way to Get Started

### Development Mode (Recommended for Testing)

```bash
cd admin-dashboard
./start-dev.sh
```

This will:
1. Start PostgreSQL database (port 5433)
2. Start Backend API (port 5001)
3. Start Frontend dev server (port 5174)

Open: **http://localhost:5174**

---

### Production Mode (Docker Everything)

```bash
cd admin-dashboard
./start.sh
```

This will:
1. Start PostgreSQL database
2. Start Backend API
3. Build and start Frontend with Nginx

Open: **http://localhost:3000**

---

## ✅ Verify Everything Works

1. **Check Backend API:**
   ```bash
   curl http://localhost:5001/api/menu-items
   ```

2. **Check Database:**
   ```bash
   docker exec -it admin-postgres psql -U postgres -d hotelbot -c "SELECT * FROM menu_items;"
   ```

3. **Open Admin Dashboard:**
   - Development: http://localhost:5174
   - Production: http://localhost:3000

---

## 🛑 Stop Services

```bash
cd admin-dashboard
docker compose down
```

To also remove database data:
```bash
docker compose down -v
```

---

## 📱 What You Can Do

### Food Inventory Page
- View all menu items with quantities
- Add new items (name, price, category, quantity)
- Increase/decrease quantities with +/- buttons
- Delete items
- Items with 0 quantity show as faded

### Table Management Page
- View all tables with status
- Add new tables (number, capacity)
- Change status: Available / Occupied / Reserved
- Delete tables

### Kitchen Display Page
- Track orders by status

---

## 🐛 Troubleshooting

**Port already in use?**
- Backend (5001): Change in `docker-compose.yml`
- PostgreSQL (5433): Change in `docker-compose.yml`
- Frontend (5174/3000): Change in `vite.config.js` or `docker-compose.yml`

**Database not initializing?**
```bash
docker compose down -v
docker compose up -d postgres backend
```

**API not responding?**
```bash
docker compose logs backend
```

---

## 📝 Default Login

No authentication is set up yet. Access directly:
- **Kitchen**: http://localhost:5174/kitchen
- **Admin**: http://localhost:5174/admin
