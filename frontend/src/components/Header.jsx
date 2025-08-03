import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Header = ({ 
  title = "Group Scheduler",
  showSettings = true,
  onCreateEvent = null,
  children 
}) => {
  const { username, logout } = useAuth();

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <nav className="flex items-center space-x-6">
        {/* Main navigation */}
        <Link 
          to="/calendar" 
          className="hover:underline font-medium"
        >
          Group Calendar
        </Link>
        
        {/* Create Event Button (if provided) */}
        {onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg"
          >
            + Create Event
          </button>
        )}
        
        {/* Custom children (for additional buttons/controls) */}
        {children}
        
        {/* Settings Button */}
        {showSettings && (
          <button 
            onClick={() => {
              alert("Settings page coming soon!");
            }}
            className="hover:bg-gray-100 p-2 rounded-full transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        
        {/* User Info */}
        {username && (
          <span className="text-gray-600">Welcome {username}</span>
        )}
        
        {/* Logout Button */}
        <button 
          onClick={logout} 
          className="ml-4 text-red-600 hover:underline"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default Header;