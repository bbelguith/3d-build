# Docker Setup for 3D Build Project

This directory contains Docker configuration files for running the entire 3D Build application stack.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Copy environment file:**
   ```bash
   cp docker/docker-env.example docker/.env
   ```

2. **Edit environment variables:**
   Edit `docker/.env` and update the values as needed (database credentials, API keys, etc.)

3. **Build and start all services:**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d --build
   ```

4. **View logs:**
   ```bash
   docker-compose -f docker/docker-compose.yml logs -f
   ```

5. **Stop all services:**
   ```bash
   docker-compose -f docker/docker-compose.yml down
   ```

## Services

- **Frontend**: React/Vite app served with Nginx (port 80)
- **Backend**: Express.js API server (port 5000)
- **MySQL**: Database server (port 3306)

## Environment Variables

See `docker/.env.example` for all available environment variables.

Key variables:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database credentials
- `BACKEND_PORT`: Backend API port (default: 5000)
- `FRONTEND_PORT`: Frontend web server port (default: 80)
- `CORS_ORIGIN`: CORS allowed origin (should match your frontend URL, e.g., `http://localhost:88` if using port 88)
- `JWT_SECRET`: Secret key for JWT tokens (if using authentication)

**Important**: The `CORS_ORIGIN` must match exactly how you access the frontend in your browser. For example:
- If `FRONTEND_PORT=88`, set `CORS_ORIGIN=http://localhost:88`
- If `FRONTEND_PORT=80`, set `CORS_ORIGIN=http://localhost` or `http://localhost:80`

## Database Migrations & Seeds

The backend service automatically runs migrations and seeders on startup. If you need to run them manually:

```bash
# Run migrations
docker-compose -f docker/docker-compose.yml exec backend node backend/run-migrations.js

# Run seeders
docker-compose -f docker/docker-compose.yml exec backend node backend/run-seeders.js
```

## Development Mode

For development, you may want to modify the docker-compose.yml to:
- Mount source code as volumes for hot-reload
- Use nodemon for backend auto-restart
- Run Vite dev server instead of production build

## Important Notes

### API URL Configuration

The frontend code currently uses hardcoded `http://localhost:5000/api` URLs. For Docker deployment, you have two options:

1. **Use Nginx proxy (Recommended)**: The nginx configuration proxies `/api` requests to the backend. Update frontend code to use relative URLs like `/api/videos` instead of `http://localhost:5000/api/videos`.

2. **Use environment variables**: Update the frontend to use environment variables for the API URL (e.g., `VITE_API_URL` for Vite).

### CORS Configuration

The backend now uses `CORS_ORIGIN` environment variable (already updated in `backend/server.js`). 

**Make sure `CORS_ORIGIN` in your `docker/.env` matches your frontend URL:**
- If using port 88: `CORS_ORIGIN=http://localhost:88`
- If using port 80: `CORS_ORIGIN=http://localhost` or `http://localhost:80`
- For local development: Uses default `http://localhost:5173`

## Troubleshooting

1. **Database connection issues:**
   - Ensure MySQL container is healthy: `docker-compose -f docker/docker-compose.yml ps`
   - Check backend logs: `docker-compose -f docker/docker-compose.yml logs backend`

2. **Port conflicts:**
   - Change ports in `docker/.env` if 80, 5000, or 3306 are already in use

3. **Permission issues:**
   - On Linux, you may need to adjust file permissions for mounted volumes

4. **API/CORS errors:**
   - Check that backend CORS allows requests from frontend origin
   - Verify nginx proxy configuration if using relative API URLs
   - Check browser console for specific error messages

## Accessing Services

- Frontend: http://localhost:FRONTEND_PORT (e.g., http://localhost:88 if FRONTEND_PORT=88)
- Backend API: http://localhost:BACKEND_PORT (default: http://localhost:5000)
- MySQL: localhost:DB_PORT (default: localhost:3306)

**Example for port 88:**
- Frontend: http://localhost:88
- Set `FRONTEND_PORT=88` and `CORS_ORIGIN=http://localhost:88` in your `.env` file

