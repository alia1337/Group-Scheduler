import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm mb-6">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
          <Link to="/calendar" className="hover:underline font-medium">
            Group Calendar
          </Link>
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
          {username && <span className="text-gray-600">Welcome {username}</span>}
          <button onClick={handleLogout} className="ml-4 text-red-600 hover:underline">
            Logout
          </button>
        </nav>
      </header>

      <div className="flex gap-4 max-w-7xl mx-auto">
        <Sidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;