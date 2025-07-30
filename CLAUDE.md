# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack group scheduling application with separate frontend and backend components:

- **Frontend**: React app (Create React App) with Tailwind CSS, React Router, and React Big Calendar
- **Backend**: FastAPI Python server with MySQL database integration
- **Authentication**: JWT tokens with Google OAuth integration
- **Database**: MySQL with tables for users, events, friends, groups, and group memberships

## Development Commands

### Initial Setup
1. **Backend Setup** (from /backend directory):
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Frontend Setup** (from /frontend directory):
   ```bash
   npm install
   ```

### Frontend (from /frontend directory)
- `npm start` - Run development server on http://localhost:3000
- `npm test` - Run tests in interactive watch mode  
- `npm run build` - Build for production

### Backend (from /backend directory)
- Requires Python virtual environment activation: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (macOS/Linux)
- `python main.py` or `uvicorn main:app --reload` - Run FastAPI server (typically on http://localhost:8000)
- `pytest test_main.py` - Run backend tests

### Root Level Commands
- Root package.json includes React Testing Library dependencies for the entire project

## Key Architecture Details

### Backend API Structure
- FastAPI with CORS middleware configured for localhost:3000
- JWT authentication with OAuth2PasswordBearer
- MySQL connection with cursor-based queries
- Models defined with Pydantic BaseModel classes
- Key endpoints: /register, /login, /me, /events, /friends, /groups

### Frontend Component Architecture  
- React Router for navigation between pages
- Main pages: HomePage, LoginForm, RegisterForm, MyCalendarPage, NewGroupPage
- Calendar integration with React Big Calendar and date-fns
- Tailwind CSS for styling with custom CSS files for calendar themes

### Database Schema
Key tables include:
- users (id, username, email, password)
- events (id, title, start, color, user_id, group_id)
- friends (user_id, friend_id)
- group_list (id, name, creator_id)
- group_members (group_id, user_id)

### Environment Configuration
- Backend uses .env file for database credentials, JWT secrets, and Google OAuth settings
- Required environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SECRET_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

## Testing
- Frontend: Jest/React Testing Library tests (existing test files: App.test.js, MyCalendarPage.test.jsx)
- Backend: pytest with FastAPI TestClient (test_main.py)
- Test authentication flow includes user registration and login token generation