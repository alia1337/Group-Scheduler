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
    email: str
    password: str

class TokenData(BaseModel):
    access_token: str
    token_type: str

class EventIn(BaseModel):
    title: str
    start: datetime
    color: str
    user_id: int
    friend_emails: list[str] = []

class EventOut(BaseModel):
    id: int
    title: str
    start: datetime
    color: str
    group_id: int | None = None

    class Config:
        from_attributes = True

class FriendIn(BaseModel):
    email: str

class GroupCreate(BaseModel):
    name: str
    member_emails: list[str]

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
        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

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
        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        if not user or not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
            raise HTTPException(status_code=401, detail="Incorrect email or password")

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
        cursor.execute("INSERT INTO group_list (name, creator_id) VALUES (%s, %s)", (data.name, user_id))
        db.commit()
        cursor.execute("SELECT LAST_INSERT_ID() AS id")
        group_id = cursor.fetchone()["id"]

        cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)", (group_id, user_id))

        for email in data.member_emails:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user:
                cursor.execute("INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)", (group_id, user["id"]))

        db.commit()
        return {"message": "Group created successfully", "group_id": group_id}
    finally:
        cursor.close()
        db.close()

@app.get("/groups")
def get_user_groups(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT gl.id AS group_id, gl.name AS group_name
            FROM group_members gm
            JOIN group_list gl ON gm.group_id = gl.id
            WHERE gm.user_id = %s
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        db.close()

@app.get("/events", response_model=list[EventOut])
def get_events(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        today = datetime.utcnow()
        end = datetime(today.year, 12, 31)
        cursor.execute("SELECT * FROM events WHERE user_id = %s AND start BETWEEN %s AND %s",
                       (user_id, today, end))
        return cursor.fetchall()
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
            cursor.execute("INSERT INTO events (title, start, color, user_id) VALUES (%s, %s, %s, %s)",
                           (event.title, event.start, event.color, uid))
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
            state=str(user_id)
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
        return RedirectResponse(url="http://localhost:3000/calendar?connected=true")
        
    except Exception as e:
        print(f"Google OAuth callback error: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url="http://localhost:3000/calendar?error=auth_failed")

@app.get("/auth/google/events")
def get_google_calendar_events(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT google_access_token, google_refresh_token FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not user.get('google_access_token'):
            raise HTTPException(status_code=404, detail="Google Calendar not connected")
        
        from google.oauth2.credentials import Credentials
        
        credentials = Credentials(
            token=user['google_access_token'],
            refresh_token=user['google_refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET
        )
        
        service = build('calendar', 'v3', credentials=credentials)
        
        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=50,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            formatted_events.append({
                'id': event.get('id'),
                'title': event.get('summary', 'No Title'),
                'start': start,
                'source': 'google'
            })
        
        return formatted_events
        
    except Exception as e:
        print(f"Error fetching Google Calendar events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Google Calendar events")
    finally:
        cursor.close()
        db.close()

@app.post("/auth/google/disconnect")
def disconnect_google_calendar(user_id: int = Depends(get_current_user)):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            UPDATE users SET 
            google_access_token = NULL,
            google_refresh_token = NULL,
            google_calendar_connected = FALSE
            WHERE id = %s
        """, (user_id,))
        db.commit()
        print(f"Disconnected Google Calendar for user {user_id}")
        return {"message": "Google Calendar disconnected successfully"}
    finally:
        cursor.close()
        db.close()