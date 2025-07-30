# 🐳 Group Scheduler - Dockerized Setup

**Get the entire application running with just ONE command!**

## 🚀 Quickest Start Ever

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd group-scheduler

# 2. Start everything
docker-compose up

# That's it! Visit http://localhost:3000 🎉
```

## 📦 What's Included?

This Docker setup gives you:
- ✅ **MySQL Database** (Port 3307) - Pre-configured with all tables
- ✅ **FastAPI Backend** (Port 8000) - Python API server
- ✅ **React Frontend** (Port 3000) - Modern UI with hot reload
- ✅ **Automatic Database Initialization** - No manual SQL imports!
- ✅ **Volume Persistence** - Your data survives container restarts
- ✅ **Network Configuration** - Everything talks to each other

## 🛠️ For Google Calendar Integration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Add your Google OAuth credentials to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. Restart the containers:
   ```bash
   docker-compose restart
   ```

## 🔧 Useful Commands

```bash
# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Reset database (careful!)
docker-compose down -v
```

## 🎯 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🆘 Troubleshooting

**"Port already in use"**
- MySQL: Change `3307:3306` to `3308:3306` in docker-compose.yml
- Backend: Change `8000:8000` to `8001:8000`
- Frontend: Change `3000:3000` to `3001:3000`

**"Cannot connect to database"**
- Wait 30 seconds for MySQL to fully initialize
- Check logs: `docker-compose logs mysql`

**Need a clean start?**
```bash
docker-compose down -v
rm -rf mysql_data
docker-compose up
```

---

**No more "works on my machine" - it works on EVERY machine! 🎊**