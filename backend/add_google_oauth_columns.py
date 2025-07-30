#!/usr/bin/env python3
"""
Database migration script to add Google OAuth columns to the users table.
Run this script to update your database schema for Google Calendar integration.
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def add_google_oauth_columns():
    try:
        # Connect to database
        db = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        cursor = db.cursor()
        
        # Check if columns already exist
        cursor.execute("DESCRIBE users")
        columns = [row[0] for row in cursor.fetchall()]
        
        columns_to_add = []
        
        if 'google_access_token' not in columns:
            columns_to_add.append("ADD COLUMN google_access_token TEXT")
            
        if 'google_refresh_token' not in columns:
            columns_to_add.append("ADD COLUMN google_refresh_token TEXT")
            
        if 'google_calendar_connected' not in columns:
            columns_to_add.append("ADD COLUMN google_calendar_connected BOOLEAN DEFAULT FALSE")
        
        if columns_to_add:
            alter_query = f"ALTER TABLE users {', '.join(columns_to_add)}"
            print(f"Executing: {alter_query}")
            cursor.execute(alter_query)
            db.commit()
            print("Successfully added Google OAuth columns to users table")
        else:
            print("Google OAuth columns already exist in users table")
            
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("Adding Google OAuth columns to users table...")
    add_google_oauth_columns()