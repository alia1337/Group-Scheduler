// src/RegisterForm.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Registration successful! Please login.");
        // Redirect to login after successful registration
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.detail || "Registration failed");
      }
    } catch (error) {
      setMessage("Error registering user");
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
          <form onSubmit={handleRegister}>
            <h2 className="text-xl font-semibold mb-4">Register</h2>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mb-2 p-2 border border-gray-300 rounded"
              required
            />
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 p-2 border border-gray-300 rounded"
              required
            />
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-2 p-2 border border-gray-300 rounded"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Register
            </button>
            {message && <p className="mt-2 text-sm">{message}</p>}
            <div className="mt-4 text-sm text-center">
              <Link to="/login" className="text-blue-600 hover:underline">
                Already have an account? Login
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

export default RegisterForm;