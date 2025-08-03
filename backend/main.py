from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import errors as mysql_errors
import bcrypt
import os
import jwt
import traceback
import time
import random
import string
from dotenv import load_dotenv

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_join_key(length=8):
    """Generate a unique join key for groups"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def get_db_connection(retries=3, delay=1):
    for attempt in range(retries):
        try:
            return mysql.connector.connect(
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME"),
                autocommit=False,
                pool_reset_session=True,
                connection_timeout=10
            )
        except (mysql_errors.OperationalError, mysql_errors.InterfaceError) as e:
            if attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise HTTPException(status_code=503, detail="Database connection failed")

# Models
class RegisterData(BaseModel):
    username: str
    email: str
    password: str

class LoginData(BaseModel):
    username_or_email: str
    password: str

class TokenData(BaseModel):
    access_token: str
    token_type: str

class EventIn(BaseModel):
    title: str
    start: datetime
    end_time: datetime | None = None
    location: str | None = None
    color: str
    user_id: int
    group_id: int | None = None
    friend_emails: list[str] = []

class EventOut(BaseModel):
    id: int
    title: str
    start: datetime
    end_time: datetime | None = None
    location: str | None = None
    color: str
    group_id: int | None = None
    google_event_id: str | None = None

    class Config:
        from_attributes = True

class FriendIn(BaseModel):
    email: str

class GroupCreate(BaseModel):
    name: str
    member_emails: list[str]

class GroupJoin(BaseModel):
    join_key: str

class AdminAction(BaseModel):
    group_id: int
    user_id: int
    action: str  # "promote", "demote", "kick"

class GroupNameUpdate(BaseModel):
    name: str

# Auth utils
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id

@app.get("/test")
def test():
    return {"message": "Backend is up!"}

@app.post("/register")
def register(data: RegisterData):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check for duplicate email
        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check for duplicate username
        cursor.execute("SELECT * FROM users WHERE username = %s", (data.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        cursor.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                       (data.username, data.email, hashed_pw))
        db.commit()
        return {"message": "User registered successfully!"}
    finally:
        cursor.close()
        db.close()

@app.post("/login", response_model=TokenData)
def login(data: LoginData):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if the input is an email or username
        if "@" in data.username_or_email:
            cursor.execute("SELECT * FROM users WHERE email = %s", (data.username_or_email,))
        else:
            cursor.execute("SELECT * FROM users WHERE username = %s", (data.username_or_email,))
        
        user = cursor.fetchone()
        if not user or not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
            raise HTTPException(status_code=401, detail="Incorrect username/email or password")

        token = create_access_token({"user_id": user["id"], "email": user["email"]})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        cursor.close()
        db.close()

@app.get("/me")
def me(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, email, google_calendar_connected FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        if user_data:
            # Convert boolean to Python boolean (MySQL returns 0/1)
            user_data['google_calendar_connected'] = bool(user_data['google_calendar_connected'])
        return user_data
    finally:
        cursor.close()
        db.close()

@app.post("/friends")
def add_friend(data: FriendIn, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        friend = cursor.fetchone()
        if not friend:
            raise HTTPException(status_code=404, detail="No user with that email")

        cursor.execute("SELECT * FROM friends WHERE user_id = %s AND friend_id = %s", (user_id, friend["id"]))
        if cursor.fetchone():
            return {"message": "Already added as friend."}

        cursor.execute("INSERT INTO friends (user_id, friend_id) VALUES (%s, %s)", (user_id, friend["id"]))
        db.commit()
        return {"message": "Friend added."}
    finally:
        cursor.close()
        db.close()

@app.get("/friends")
def list_friends(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.id, u.username, u.email
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = %s
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()

@app.post("/groups")
def create_group(data: GroupCreate, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Generate unique join key
        while True:
            join_key = generate_join_key()
            cursor.execute("SELECT id FROM group_list WHERE join_key = %s", (join_key,))
            if not cursor.fetchone():
                break
        
        cursor.execute("INSERT INTO group_list (name, join_key, creator_id) VALUES (%s, %s, %s)", 
                      (data.name, join_key, user_id))
        db.commit()
        cursor.execute("SELECT LAST_INSERT_ID() AS id")
        group_id = cursor.fetchone()["id"]

        cursor.execute("INSERT INTO group_members (group_id, user_id, is_admin) VALUES (%s, %s, TRUE)", (group_id, user_id))

        for email in data.member_emails:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user:
                cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)", (group_id, user["id"]))

        db.commit()
        return {"message": "Group created successfully", "group_id": group_id, "join_key": join_key}
    finally:
        cursor.close()
        db.close()

@app.get("/groups")
def get_user_groups(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT gl.id AS group_id, gl.name AS group_name, gl.join_key,
                   CASE WHEN gl.creator_id = %s THEN 1 ELSE 0 END AS is_creator,
                   gm.is_admin
            FROM group_members gm
            JOIN group_list gl ON gm.group_id = gl.id
            WHERE gm.user_id = %s
        """, (user_id, user_id))
        
        groups = cursor.fetchall()
        
        # For each group, get the member usernames
        for group in groups:
            cursor.execute("""
                SELECT u.username, gm.is_admin,
                       CASE WHEN gl.creator_id = u.id THEN 1 ELSE 0 END AS is_creator
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                JOIN group_list gl ON gm.group_id = gl.id
                WHERE gm.group_id = %s
                ORDER BY gm.is_admin DESC, u.username
            """, (group['group_id'],))
            group['members'] = cursor.fetchall()
        
        return groups
    finally:
        cursor.close()
        db.close()

@app.post("/groups/join")
def join_group(data: GroupJoin, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Find group by join key
        cursor.execute("SELECT id, name FROM group_list WHERE join_key = %s", (data.join_key.upper(),))
        group = cursor.fetchone()
        
        if not group:
            raise HTTPException(status_code=404, detail="Invalid join key")
        
        # Check if already a member
        cursor.execute("SELECT id FROM group_members WHERE group_id = %s AND user_id = %s", 
                      (group["id"], user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already a member of this group")
        
        # Add user to group
        cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)", 
                      (group["id"], user_id))
        
        db.commit()
        
        return {"message": f"Successfully joined group '{group['name']}'", "group_id": group["id"]}
    finally:
        cursor.close()
        db.close()

# Removed sync functions - groups now show live personal events instead of copies

@app.get("/groups/{group_id}/events")
def get_group_events(group_id: int, user_id: int = Depends(get_current_user)):
    """Get all personal events from all group members (unified view)"""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if user is a member of the group
        cursor.execute("""
            SELECT 1 FROM group_members 
            WHERE group_id = %s AND user_id = %s
        """, (group_id, user_id))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Get all personal events from all group members
        # This includes personal events (group_id IS NULL) and Google Calendar events
        cursor.execute("""
            SELECT e.*, u.username as creator_username
            FROM events e
            JOIN users u ON e.user_id = u.id
            JOIN group_members gm ON e.user_id = gm.user_id
            WHERE gm.group_id = %s 
            AND (e.group_id IS NULL OR e.google_event_id IS NOT NULL)
            ORDER BY e.start ASC
        """, (group_id,))
        
        events = cursor.fetchall()
        return events
    finally:
        cursor.close()
        db.close()

@app.get("/groups/search/{join_key}")
def search_group(join_key: str, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT gl.id, gl.name, gl.join_key,
                   COUNT(gm.user_id) as member_count,
                   CASE WHEN EXISTS(SELECT 1 FROM group_members WHERE group_id = gl.id AND user_id = %s) 
                        THEN 1 ELSE 0 END AS is_member
            FROM group_list gl
            LEFT JOIN group_members gm ON gl.id = gm.group_id
            WHERE gl.join_key = %s
            GROUP BY gl.id
        """, (user_id, join_key.upper()))
        
        group = cursor.fetchone()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        return group
    finally:
        cursor.close()
        db.close()

@app.get("/groups/{group_id}/members")
def get_group_members(group_id: int, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if user is a member of the group
        cursor.execute("""
            SELECT gm.is_admin FROM group_members gm 
            WHERE gm.group_id = %s AND gm.user_id = %s
        """, (group_id, user_id))
        
        member_status = cursor.fetchone()
        if not member_status:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Get all group members
        cursor.execute("""
            SELECT u.id, u.username, u.email, gm.is_admin,
                   gl.creator_id = u.id AS is_creator
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            JOIN group_list gl ON gm.group_id = gl.id
            WHERE gm.group_id = %s
            ORDER BY gm.is_admin DESC, u.username
        """, (group_id,))
        
        members = cursor.fetchall()
        return {
            "group_id": group_id,
            "members": members,
            "user_is_admin": member_status["is_admin"]
        }
    finally:
        cursor.close()
        db.close()

@app.post("/groups/admin-action")
def perform_admin_action(data: AdminAction, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if the requesting user is an admin of the group
        cursor.execute("""
            SELECT gm.is_admin, gl.creator_id
            FROM group_members gm
            JOIN group_list gl ON gm.group_id = gl.id
            WHERE gm.group_id = %s AND gm.user_id = %s
        """, (data.group_id, user_id))
        
        admin_status = cursor.fetchone()
        if not admin_status:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        if not admin_status["is_admin"]:
            raise HTTPException(status_code=403, detail="You do not have admin privileges")
        
        # Don't allow actions on the group creator unless you are the creator
        cursor.execute("SELECT creator_id FROM group_list WHERE id = %s", (data.group_id,))
        group_info = cursor.fetchone()
        
        if data.user_id == group_info["creator_id"] and user_id != group_info["creator_id"]:
            raise HTTPException(status_code=403, detail="Cannot perform actions on the group creator")
        
        if data.action == "promote":
            cursor.execute("""
                UPDATE group_members SET is_admin = TRUE 
                WHERE group_id = %s AND user_id = %s
            """, (data.group_id, data.user_id))
            message = "User promoted to admin"
            
        elif data.action == "demote":
            # Don't allow demoting the creator
            if data.user_id == group_info["creator_id"]:
                raise HTTPException(status_code=403, detail="Cannot demote the group creator")
            
            cursor.execute("""
                UPDATE group_members SET is_admin = FALSE 
                WHERE group_id = %s AND user_id = %s
            """, (data.group_id, data.user_id))
            message = "User demoted from admin"
            
        elif data.action == "kick":
            # Don't allow kicking the creator
            if data.user_id == group_info["creator_id"]:
                raise HTTPException(status_code=403, detail="Cannot kick the group creator")
            
            cursor.execute("""
                DELETE FROM group_members 
                WHERE group_id = %s AND user_id = %s
            """, (data.group_id, data.user_id))
            message = "User kicked from group"
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        db.commit()
        return {"message": message}
        
    finally:
        cursor.close()
        db.close()

@app.put("/groups/{group_id}/name")
def update_group_name(group_id: int, data: GroupNameUpdate, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if user is an admin of the group
        cursor.execute("""
            SELECT gm.is_admin FROM group_members gm
            WHERE gm.group_id = %s AND gm.user_id = %s
        """, (group_id, user_id))
        
        admin_status = cursor.fetchone()
        if not admin_status:
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        if not admin_status["is_admin"]:
            raise HTTPException(status_code=403, detail="You do not have admin privileges")
        
        # Update the group name
        cursor.execute("""
            UPDATE group_list SET name = %s WHERE id = %s
        """, (data.name.strip(), group_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Group not found")
        
        db.commit()
        return {"message": "Group name updated successfully"}
        
    finally:
        cursor.close()
        db.close()

@app.delete("/groups/{group_id}")
def delete_group(group_id: int, user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if user is the creator of the group (not just admin)
        cursor.execute("""
            SELECT creator_id FROM group_list WHERE id = %s
        """, (group_id,))
        
        group = cursor.fetchone()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if group["creator_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only the group creator can delete the group")
        
        # Delete related events for this group
        cursor.execute("DELETE FROM events WHERE group_id = %s", (group_id,))
        
        # Delete group members
        cursor.execute("DELETE FROM group_members WHERE group_id = %s", (group_id,))
        
        # Delete the group itself
        cursor.execute("DELETE FROM group_list WHERE id = %s", (group_id,))
        
        db.commit()
        return {"message": "Group deleted successfully"}
        
    finally:
        cursor.close()
        db.close()

@app.get("/events", response_model=list[EventOut])
def get_events(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Get all events for the user - let frontend handle date filtering to avoid timezone issues
        cursor.execute("SELECT * FROM events WHERE user_id = %s", (user_id,))
        events = cursor.fetchall()
        print(f"Backend: Found {len(events)} events for user {user_id}")
        return events
    finally:
        cursor.close()
        db.close()

@app.post("/events", response_model=EventOut)
def create_event(event: EventIn):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        user_ids = [event.user_id]

        for email in event.friend_emails:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            friend = cursor.fetchone()
            if friend:
                user_ids.append(friend["id"])

        for uid in set(user_ids):
            cursor.execute("""
                INSERT INTO events (title, start, end_time, location, color, user_id, group_id) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (event.title, event.start, event.end_time, event.location, event.color, uid, event.group_id))
        db.commit()

        cursor.execute("SELECT * FROM events WHERE user_id = %s ORDER BY id DESC LIMIT 1", (event.user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        db.close()

@app.get("/auth/google/login")
def google_login(user_id: int = Depends(get_current_user)):
    print(f"Google OAuth login request for user_id: {user_id}")
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
        print("ERROR: Google OAuth not configured")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        },
        scopes=[
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events'
        ]
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    
    try:
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=str(user_id),
            prompt='select_account'
        )
        print(f"Generated auth URL for user {user_id}: {authorization_url[:100]}...")
        return {"auth_url": authorization_url}
    except Exception as e:
        print(f"ERROR generating auth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate auth URL: {str(e)}")

@app.get("/auth/google/callback")
def google_callback(code: str, state: str):
    print(f"Google OAuth callback received - code: {code[:20] if code else 'None'}..., state: {state}")
    try:
        user_id = int(state)
        print(f"Processing callback for user_id: {user_id}")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=[
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events'
            ]
        )
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("""
                UPDATE users SET 
                google_access_token = %s,
                google_refresh_token = %s,
                google_calendar_connected = TRUE
                WHERE id = %s
            """, (credentials.token, credentials.refresh_token, user_id))
            db.commit()
        finally:
            cursor.close()
            db.close()
        
        print(f"Successfully stored Google OAuth tokens for user {user_id}")
        
        # Trigger Google Calendar sync after successful connection
        try:
            sync_google_calendar_events(user_id)
            print(f"Initial Google Calendar sync completed for user {user_id}")
        except Exception as sync_error:
            print(f"Error during initial sync for user {user_id}: {sync_error}")
            # Don't fail the OAuth flow if sync fails
        
        return RedirectResponse(url="http://localhost:3000/calendar?connected=true")
        
    except Exception as e:
        print(f"Google OAuth callback error: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url="http://localhost:3000/calendar?error=auth_failed")

def sync_google_calendar_events(user_id: int):
    """Sync Google Calendar events to the database"""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT google_access_token, google_refresh_token FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not user.get('google_access_token'):
            print(f"No Google Calendar access token for user {user_id}")
            return
        
        from google.oauth2.credentials import Credentials
        
        credentials = Credentials(
            token=user['google_access_token'],
            refresh_token=user['google_refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Fetch events from start of current year to end of next year
        current_year = datetime.now().year
        start_of_year = datetime(current_year, 1, 1).isoformat() + 'Z'
        end_of_next_year = datetime(current_year + 1, 12, 31, 23, 59, 59).isoformat() + 'Z'
        
        print(f"Syncing Google Calendar events for user {user_id} from {start_of_year} to {end_of_next_year}")
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_of_year,
            timeMax=end_of_next_year,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        synced_count = 0
        skipped_count = 0
        
        for event in events:
            google_event_id = event.get('id')
            start = event['start'].get('dateTime', event['start'].get('date'))
            end_time = event['end'].get('dateTime', event['end'].get('date')) if 'end' in event else None
            event_title = event.get('summary', 'No Title')
            location = event.get('location', '')
            
            # Check if event already exists for this user
            cursor.execute("SELECT id FROM events WHERE google_event_id = %s AND user_id = %s", (google_event_id, user_id))
            existing_event = cursor.fetchone()
            
            if existing_event:
                print(f"Skipping existing Google event: {event_title}")
                skipped_count += 1
                continue
            
            # Parse datetime strings to datetime objects
            try:
                # Handle both datetime and date formats
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                else:
                    start_dt = datetime.strptime(start, '%Y-%m-%d')
                
                end_dt = None
                if end_time:
                    if 'T' in end_time:
                        end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                    else:
                        end_dt = datetime.strptime(end_time, '%Y-%m-%d')
                
                # Insert new Google event into database
                cursor.execute("""
                    INSERT INTO events (title, start, end_time, location, color, user_id, google_event_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (event_title, start_dt, end_dt, location, '#4285f4', user_id, google_event_id))
                
                synced_count += 1
                print(f"Synced Google event: {event_title} on {start}")
                
            except Exception as parse_error:
                print(f"Error parsing event {event_title}: {parse_error}")
                continue
        
        db.commit()
        print(f"Google Calendar sync completed for user {user_id}: {synced_count} new events, {skipped_count} skipped")
        
    except Exception as e:
        print(f"Error syncing Google Calendar events for user {user_id}: {e}")
        db.rollback()
    finally:
        cursor.close()
        db.close()

@app.post("/auth/google/sync")
def sync_google_calendar(user_id: int = Depends(get_current_user)):
    """Manually trigger Google Calendar sync"""
    try:
        sync_google_calendar_events(user_id)
        return {"message": "Google Calendar sync completed successfully"}
    except Exception as e:
        print(f"Error in manual sync: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync Google Calendar")

@app.get("/auth/google/events")
def get_google_calendar_events(user_id: int = Depends(get_current_user)):
    """Legacy endpoint - now returns events from database instead of Google API"""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Get Google Calendar events from database
        cursor.execute("""
            SELECT id, title, start, end_time, location, color, google_event_id
            FROM events 
            WHERE user_id = %s AND google_event_id IS NOT NULL
        """, (user_id,))
        
        events = cursor.fetchall()
        
        formatted_events = []
        for event in events:
            formatted_events.append({
                'id': event['google_event_id'],  # Use Google event ID for compatibility
                'title': event['title'],
                'start': event['start'].isoformat() if event['start'] else None,
                'end_time': event['end_time'].isoformat() if event['end_time'] else None,
                'location': event['location'],
                'color': event['color'],
                'source': 'google'
            })
        
        print(f"Returning {len(formatted_events)} Google Calendar events from database for user {user_id}")
        return formatted_events
        
    except Exception as e:
        print(f"Error fetching Google Calendar events from database: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Google Calendar events")
    finally:
        cursor.close()
        db.close()

@app.post("/auth/google/disconnect")
def disconnect_google_calendar(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Remove Google Calendar events from database
        cursor.execute("DELETE FROM events WHERE user_id = %s AND google_event_id IS NOT NULL", (user_id,))
        deleted_events = cursor.rowcount
        
        # Disconnect Google Calendar
        cursor.execute("""
            UPDATE users SET 
            google_access_token = NULL,
            google_refresh_token = NULL,
            google_calendar_connected = FALSE
            WHERE id = %s
        """, (user_id,))
        db.commit()
        
        print(f"Disconnected Google Calendar for user {user_id}, removed {deleted_events} Google events")
        return {"message": f"Google Calendar disconnected successfully. Removed {deleted_events} Google events."}
    finally:
        cursor.close()
        db.close()

class AvailabilityRequest(BaseModel):
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    days_of_week: list[int]  # 0=Sunday, 1=Monday, etc.
    weeks_ahead: int = 4
    min_continuous_hours: int | None = None  # Optional: minimum continuous hours required

@app.post("/groups/{group_id}/availability")
def calculate_group_availability(
    group_id: int, 
    request: AvailabilityRequest,
    user_id: int = Depends(get_current_user)
):
    """Calculate when group members are available for a given time range"""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        # Check if user is a member of the group
        cursor.execute("""
            SELECT 1 FROM group_members 
            WHERE group_id = %s AND user_id = %s
        """, (group_id, user_id))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="You are not a member of this group")
        
        # Get all group members
        cursor.execute("""
            SELECT u.id, u.username 
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = %s
        """, (group_id,))
        
        group_members = cursor.fetchall()
        total_members = len(group_members)
        
        if total_members == 0:
            return {}
        
        # Generate dates for the next few weeks
        from datetime import datetime, timedelta
        import calendar
        
        availability = {}
        today = datetime.now().date()
        
        for week_offset in range(request.weeks_ahead):
            # Check each day in the week
            for days_ahead in range(7 * week_offset, 7 * (week_offset + 1)):
                check_date = today + timedelta(days=days_ahead)
                day_of_week = check_date.weekday()  # 0=Monday, 6=Sunday
                
                # Convert to our format (0=Sunday, 1=Monday, etc.)
                day_of_week_sunday_first = (day_of_week + 1) % 7
                
                # Skip if not in selected days
                if day_of_week_sunday_first not in request.days_of_week:
                    continue
                
                date_str = check_date.strftime('%Y-%m-%d')
                
                if request.min_continuous_hours:
                    # For continuous time blocks, we need more complex logic
                    available_count = calculate_continuous_availability(
                        cursor, group_members, date_str, 
                        request.start_time, request.end_time, 
                        request.min_continuous_hours
                    )
                else:
                    # Count available members for this date/time (any time in range)
                    available_count = 0
                    
                    for member in group_members:
                        # Check if member has any conflicting events
                        cursor.execute("""
                            SELECT COUNT(*) as conflict_count
                            FROM events 
                            WHERE user_id = %s 
                            AND DATE(start) = %s
                            AND (
                                (TIME(start) < %s AND TIME(COALESCE(end_time, start)) > %s) OR
                                (TIME(start) >= %s AND TIME(start) < %s) OR
                                (TIME(COALESCE(end_time, start)) > %s AND TIME(COALESCE(end_time, start)) <= %s)
                            )
                        """, (
                            member['id'], 
                            date_str,
                            request.end_time, request.start_time,  # event ends after start or starts before end
                            request.start_time, request.end_time,  # event starts within range
                            request.start_time, request.end_time   # event ends within range
                        ))
                        
                        conflict_count = cursor.fetchone()['conflict_count']
                        
                        if conflict_count == 0:
                            available_count += 1
                
                availability[date_str] = available_count
        
        return availability
        
    finally:
        cursor.close()
        db.close()

def calculate_continuous_availability(cursor, group_members, date_str, start_time, end_time, min_hours):
    """Calculate availability for continuous time blocks"""
    from datetime import datetime, timedelta
    
    # Convert times to datetime objects for easier manipulation
    start_dt = datetime.strptime(start_time, '%H:%M').time()
    end_dt = datetime.strptime(end_time, '%H:%M').time()
    
    # Create time slots (15-minute intervals)
    slots = []
    current = datetime.combine(datetime.today(), start_dt)
    end_datetime = datetime.combine(datetime.today(), end_dt)
    
    while current < end_datetime:
        slots.append(current.time())
        current += timedelta(minutes=15)
    
    # For each member, find their availability across all slots
    member_availability = {}
    
    for member in group_members:
        # Get all events for this member on this date
        cursor.execute("""
            SELECT TIME(start) as start_time, TIME(COALESCE(end_time, start)) as end_time
            FROM events 
            WHERE user_id = %s AND DATE(start) = %s
            ORDER BY start
        """, (member['id'], date_str))
        
        events = cursor.fetchall()
        member_free_slots = []
        
        # Check each slot for availability
        for slot in slots:
            is_free = True
            for event in events:
                event_start = event['start_time']
                event_end = event['end_time']
                
                # Check if slot conflicts with event
                slot_end = (datetime.combine(datetime.today(), slot) + timedelta(minutes=15)).time()
                
                if (slot < event_end and slot_end > event_start):
                    is_free = False
                    break
            
            member_free_slots.append(is_free)
        
        member_availability[member['id']] = member_free_slots
    
    # Find continuous blocks that meet the minimum hours requirement
    required_slots = min_hours * 4  # 15-minute slots
    max_available = 0
    
    # Check each possible continuous block
    for start_idx in range(len(slots) - required_slots + 1):
        available_count = 0
        
        for member_id in member_availability:
            # Check if this member is free for the entire block
            is_free_for_block = all(
                member_availability[member_id][i] 
                for i in range(start_idx, start_idx + required_slots)
            )
            
            if is_free_for_block:
                available_count += 1
        
        max_available = max(max_available, available_count)
    
    return max_available