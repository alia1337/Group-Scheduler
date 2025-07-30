# 🚀 Quick Start - Get Running in 5 Minutes!

## Step 1: Install Docker Desktop
Download and install Docker Desktop for your OS:
- **Windows**: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- **Mac**: https://desktop.docker.com/mac/main/amd64/Docker.dmg

## Step 2: Clone the Repository
Open Terminal/PowerShell and run:
```bash
git clone <your-repository-url>
cd group-scheduler
```

## Step 3: Start Everything
Just run this ONE command:
```bash
docker-compose up
```

## Step 4: Access the Application
Wait about 30 seconds for everything to start, then open:
- **Application**: http://localhost:3000
- **API**: http://localhost:8000

That's it! You're done! 🎉

---

## First Time Using?
1. Click "Register" to create an account
2. Use any email (e.g., test@example.com)
3. Start scheduling!

## Want Google Calendar?
1. Copy `.env.example` to `.env`
2. Add Google credentials (optional - app works without it)
3. Restart: `docker-compose restart`

## Common Commands
```bash
# Run in background
docker-compose up -d

# Stop everything
docker-compose down

# View logs if something seems wrong
docker-compose logs -f
```