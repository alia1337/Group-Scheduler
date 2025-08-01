# Docker Setup Guide

## Prerequisites
- Docker Desktop installed and running
- Git installed

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/alia1337/Group-Scheduler.git
   cd Group-Scheduler
   ```

2. **Create backend/.env file**
   Copy the example environment file and update with your values:
   ```bash
   cp .env.example backend/.env
   ```
   
   Edit `backend/.env` and add your Google OAuth credentials:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `SECRET_KEY`: A secure random string for JWT tokens
   
   The database credentials in the .env file will be overridden by Docker's environment settings.

3. **Run Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Environment Variables

The backend/.env file should contain:
```
# These are overridden by Docker but needed for local development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scheduler_db

# Required - Generate a secure random string
SECRET_KEY=your-secret-key-here-change-this

# Required for Google Calendar integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

## Troubleshooting

- If you see Google OAuth errors, ensure your Google OAuth credentials are correctly set in backend/.env
- The MySQL database runs on port 3307 (not 3306) to avoid conflicts with local MySQL installations
- Use `docker-compose logs [service]` to view logs (e.g., `docker-compose logs backend`)