from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import mysql.connector
import bcrypt
import os
import jwt
import traceback
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

db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)
cursor = db.cursor(dictionary=True)

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
        orm_mode = True

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
    cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    cursor.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                   (data.username, data.email, hashed_pw))
    db.commit()
    return {"message": "User registered successfully!"}

@app.post("/login", response_model=TokenData)
def login(data: LoginData):
    cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
    user = cursor.fetchone()
    if not user or not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def me(user_id: int = Depends(get_current_user)):
    cursor.execute("SELECT id, username, email FROM users WHERE id = %s", (user_id,))
    return cursor.fetchone()

@app.post("/friends")
def add_friend(data: FriendIn, user_id: int = Depends(get_current_user)):
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

@app.get("/friends")
def list_friends(user_id: int = Depends(get_current_user)):
    cursor.execute("""
        SELECT u.id, u.username, u.email
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = %s
    """, (user_id,))
    return cursor.fetchall()

@app.post("/groups")
def create_group(data: GroupCreate, user_id: int = Depends(get_current_user)):
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

@app.get("/events", response_model=list[EventOut])
def get_events(user_id: int = Depends(get_current_user)):
    today = datetime.utcnow()
    end = datetime(today.year, 12, 31)
    cursor.execute("SELECT * FROM events WHERE user_id = %s AND start BETWEEN %s AND %s",
                   (user_id, today, end))
    return cursor.fetchall()

@app.post("/events", response_model=EventOut)
def create_event(event: EventIn):
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

@app.get("/auth/google/login")
def google_login(user_id: int = Depends(get_current_user)):
    temp_token = create_access_token({"user_id": user_id}, timedelta(minutes=10))

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar.readonly", "openid", "email"],
        redirect_uri=GOOGLE_REDIRECT_URI,
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="select_account",
        state=temp_token
    )
    return {"auth_url": auth_url}

@app.get("/auth/google/callback")
def google_callback(request: Request):
    try:
        code = request.query_params.get("code")
        token = request.query_params.get("state")
        user_id = decode_token(token).get("user_id")

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=["https://www.googleapis.com/auth/calendar.readonly", "openid", "email"],
            redirect_uri=GOOGLE_REDIRECT_URI,
        )
        flow.fetch_token(code=code)

        id_info = id_token.verify_oauth2_token(
            flow.credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
        print("✅ Google user email:", id_info.get("email"))

        service = build("calendar", "v3", credentials=flow.credentials)

        now = datetime.utcnow().isoformat() + "Z"
        end = datetime(datetime.utcnow().year, 12, 31).isoformat() + "Z"

        events_result = service.events().list(
            calendarId="primary",
            timeMin=now,
            timeMax=end,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        insert_cursor = db.cursor(dictionary=True)
        for event in events_result.get("items", []):
            title = event.get("summary", "Untitled")
            start_raw = event["start"].get("dateTime") or event["start"].get("date")
            if not start_raw:
                continue

            try:
                start = datetime.fromisoformat(start_raw.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception as parse_err:
                print("❌ Date parsing failed:", parse_err)
                continue

            insert_cursor.execute(
                "SELECT * FROM events WHERE user_id = %s AND title = %s AND start = %s AND source = 'google'",
                (user_id, title, start)
            )
            if insert_cursor.fetchone():
                continue

            insert_cursor.execute(
                "INSERT INTO events (title, start, color, user_id, source) VALUES (%s, %s, %s, %s, %s)",
                (title, start, "#34a853", user_id, "google")
            )

        db.commit()
        insert_cursor.close()
        return RedirectResponse(url="http://localhost:3000/calendar")

    except jwt.PyJWTError as jwt_err:
        print("❌ Invalid JWT token:", jwt_err)
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    except Exception as e:
        print("❌ Google sync error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Google sync failed")