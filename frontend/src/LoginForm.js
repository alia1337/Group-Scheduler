// src/LoginForm.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Save token
        localStorage.setItem("token", data.access_token);

        // Fetch user info
        const meRes = await fetch(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        const userInfo = await meRes.json();
        localStorage.setItem("username", userInfo.username);

        // Success message and redirect
        setMessage("Login successful!");
        navigate("/personal-calendar");
      } else {
        setMessage(data.detail || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
          <span className="text-gray-600">Please login or register to access your calendar</span>
        </nav>
      </header>

      <div className="text-center mt-8 mb-4">
        <h2 className="text-3xl font-bold">Calendar Planning</h2>
        <p className="text-gray-600">Manage your schedule effectively with our online calendar.</p>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-10 px-8">
        <section className="bg-white shadow-md rounded-2xl p-6">
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-semibold mb-4">Login</h2>
      <input
        type="text"
        placeholder="Username or Email"
        value={usernameOrEmail}
        onChange={(e) => setUsernameOrEmail(e.target.value)}
        required
        className="w-full mb-3 px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full mb-3 px-3 py-2 border rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Log in
      </button>
            {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex flex-col text-sm space-y-2 text-center">
              <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
              <Link to="/register" className="text-blue-600 hover:underline">
                New user? Register
              </Link>
            </div>
          </form>
        </section>

        <section className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">March 2024</h2>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="font-medium">{day}</div>
            ))}
            {Array.from({ length: 31 + 4 }).map((_, index) => {
              const day = index - 3;
              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${[13, 19, 26, 28].includes(day) ? "bg-blue-200" : ""}`}
                >
                  {day > 0 && day <= 31 ? day : ""}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginForm;
