// src/Header.jsx
import React from "react";
import { Link } from "react-router-dom";

const Header = ({ userName, page }) => {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
      <h1 className="text-2xl font-bold">Group Scheduler</h1>
      <nav className="space-x-6">
        {page === "home" ? (
          <Link to="/calendar" className="hover:underline font-medium">My Calendar</Link>
        ) : (
          <Link to="/" className="hover:underline font-medium">Home</Link>
        )}
        <a href="#" className="hover:underline font-medium">New Group</a>
        <a href="#" className="hover:underline font-medium">New Event</a>
      </nav>
      <div>
        {userName && <span className="font-medium">Welcome {userName}</span>}
      </div>
    </header>
  );
};

export default Header;
