# Group Scheduler - Complete Setup Guide

This guide will help you get the Group Scheduler application running on your machine using Docker.

## Prerequisites

1. **Docker Desktop** installed on your machine
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Git** (to clone the repository)

## Quick Start (Using Docker) - Recommended

### 1. Clone the Repository
```bash
git clone <repository-url>
cd group-scheduler
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Google OAuth credentials
# (Optional: Works without Google Calendar integration)
```

### 3. Start Everything with Docker Compose
```bash
# This single command starts everything!
docker-compose up

# Or run in background
docker-compose up -d
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MySQL Database: localhost:3307

### 4. First Time Setup
When you first access the application:
1. Go to http://localhost:3000
2. Click "Register" to create a new account
3. Start using the calendar!

## What Docker Sets Up For You

✅ **MySQL Database** - Automatically initialized with all tables
✅ **Python Backend** - FastAPI server with all dependencies
✅ **React Frontend** - Development server with hot reload
✅ **Network Configuration** - All services can communicate
✅ **Volume Persistence** - Your data is saved between restarts

## Useful Docker Commands

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend

# Reset everything (including database)
docker-compose down -v
docker-compose up
```

## Manual Setup (Without Docker)

If you prefer to run without Docker, you'll need:

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt

# Set up MySQL database manually
# Import backend/init.sql into your MySQL server

# Run the backend
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Google Calendar Integration (Optional)

To enable Google Calendar sync:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## Database Access with DataGrip

If you prefer using DataGrip instead of MySQL Workbench:

1. Start the Docker containers: `docker-compose up -d`
2. Open DataGrip and create a new MySQL connection:
   - Host: `localhost`
   - Port: `3307`
   - User: `scheduler_user`
   - Password: `scheduler_pass123`
   - Database: `scheduler_db`

See `DATAGRIP_SETUP.md` for detailed instructions.

## Troubleshooting

### Docker Issues
- **"Cannot connect to Docker daemon"**: Make sure Docker Desktop is running
- **Port conflicts**: Change ports in docker-compose.yml if needed
- **Permission errors**: Run Docker commands with `sudo` on Linux

### Application Issues
- **Database connection errors**: Wait a few seconds for MySQL to fully start
- **"events.filter is not a function"**: Clear browser cache and localStorage
- **Google Calendar not working**: Check OAuth credentials in .env

### Reset Everything
```bash
# Stop and remove all containers, volumes, and networks
docker-compose down -v

# Remove all data and start fresh
rm -rf mysql_data
docker-compose up
```

## Project Structure
```
group-scheduler/
├── docker-compose.yml     # Orchestrates all services
├── .env.example          # Template for environment variables
├── backend/
│   ├── Dockerfile        # Backend container configuration
│   ├── main.py          # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── init.sql         # Database schema
└── frontend/
    ├── Dockerfile        # Frontend container configuration
    ├── package.json      # Node dependencies
    └── src/             # React application code
```

## Security Notes

- The default passwords in docker-compose.yml are for development only
- Generate a secure SECRET_KEY for production
- Never commit .env files with real credentials
- Use HTTPS in production environments

## Support

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Ensure all prerequisites are installed
3. Try the reset commands above
4. Check the PROJECT_CHALLENGES_AND_SOLUTIONS.md for common issues

---

**Happy Scheduling! 📅**