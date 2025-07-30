# DataGrip Setup Guide for Group Scheduler

DataGrip is a professional database IDE that works perfectly with our Dockerized MySQL database.

## 🚀 Quick Setup

### 1. Start the Docker Containers
```bash
docker-compose up -d
```

### 2. Connect DataGrip to MySQL

Open DataGrip and create a new MySQL connection with these settings:

| Setting | Value |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `3307` |
| **Database** | `scheduler_db` |
| **User** | `scheduler_user` |
| **Password** | `scheduler_pass123` |

### 3. Step-by-Step in DataGrip

1. Click the **`+`** button → **Data Source** → **MySQL**

2. Fill in the connection details:
   ```
   Name: Group Scheduler Docker
   Host: localhost
   Port: 3307
   User: scheduler_user
   Password: scheduler_pass123
   Database: scheduler_db
   ```

3. Click **Test Connection** - you should see "Successful"

4. Click **OK** to save

## 🔍 Exploring the Database

Once connected, you'll see all the tables:
- `users` - User accounts
- `events` - Calendar events
- `friends` - Friend relationships
- `group_list` - Groups
- `group_members` - Group memberships

## 💡 Useful DataGrip Features

### View All Data
```sql
-- See all users
SELECT * FROM users;

-- See all events
SELECT * FROM events;

-- See events with user details
SELECT e.*, u.username 
FROM events e 
JOIN users u ON e.user_id = u.id;
```

### Create Test Data
```sql
-- Add a test user
INSERT INTO users (username, email, password) 
VALUES ('testuser', 'test@example.com', '$2b$12$YourHashedPasswordHere');

-- Add a test event
INSERT INTO events (title, start, color, user_id) 
VALUES ('Test Meeting', '2025-08-01 10:00:00', '#1a73e8', 1);
```

### Monitor Database
```sql
-- Check table sizes
SELECT 
    table_name AS 'Table',
    table_rows AS 'Row Count'
FROM information_schema.tables
WHERE table_schema = 'scheduler_db';
```

## 🛠️ Advanced Configuration

### Using Root Access
If you need full admin access:

| Setting | Value |
|---------|-------|
| **User** | `root` |
| **Password** | `rootpassword123` |

### Remote Database Access
To allow DataGrip on another computer to connect:

1. Edit `docker-compose.yml`:
   ```yaml
   mysql:
     ports:
       - "0.0.0.0:3307:3306"  # Allow external connections
   ```

2. Use your computer's IP address as the host in DataGrip

## 🔧 Troubleshooting

### "Connection Refused"
- Ensure Docker containers are running: `docker-compose ps`
- Check if port 3307 is free: `netstat -an | grep 3307`

### "Access Denied"
- Verify credentials match docker-compose.yml
- Try connecting with root user first

### Can't See Tables
- The database might still be initializing
- Wait 30 seconds and refresh
- Check Docker logs: `docker-compose logs mysql`

## 📊 Useful Queries for Development

### Check User's Events
```sql
SELECT * FROM events 
WHERE user_id = ? 
ORDER BY start DESC;
```

### Find Events in Date Range
```sql
SELECT * FROM events 
WHERE start BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY start;
```

### User's Groups
```sql
SELECT g.*, COUNT(gm2.user_id) as member_count
FROM group_list g
JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN group_members gm2 ON g.id = gm2.group_id
WHERE gm.user_id = ?
GROUP BY g.id;
```

## 🎯 DataGrip Tips

1. **Save Queries**: Use DataGrip's scratch files for common queries
2. **Export Data**: Right-click any result → Export Data
3. **Visual Query Builder**: Use Ctrl+F8 for visual query building
4. **Database Diagrams**: Right-click schema → Diagrams → Show Visualization

---

**Note**: These credentials are for development only. Use secure passwords in production!