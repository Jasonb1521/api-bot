# Hotel Order Bot - Backend API

Backend API server for the Hotel Order Bot admin dashboard.

## Tech Stack

- Node.js + Express
- PostgreSQL
- Docker

## API Endpoints

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `GET /api/menu-items/:id` - Get single menu item
- `POST /api/menu-items` - Create new menu item
- `PUT /api/menu-items/:id` - Update menu item
- `PATCH /api/menu-items/:id/quantity` - Update item quantity
- `DELETE /api/menu-items/:id` - Delete menu item

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get single table
- `POST /api/tables` - Create new table
- `PUT /api/tables/:id` - Update table
- `PATCH /api/tables/:id/status` - Update table status
- `DELETE /api/tables/:id` - Delete table

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotelbot
DB_USER=postgres
DB_PASSWORD=postgres123
```

3. Run the server:
```bash
npm run dev
```

## Docker Deployment

The backend is automatically deployed via docker-compose. See the root `docker-compose.yml` file.
