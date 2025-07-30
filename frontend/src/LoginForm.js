// src/LoginForm.js
import React, { useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Save token
        localStorage.setItem("token", data.access_token);

        // Fetch user info
        const meRes = await fetch("http://127.0.0.1:8000/me", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        const userInfo = await meRes.json();
        localStorage.setItem("username", userInfo.username);

        // Success message and redirect
        setMessage("Login successful!");
        window.location.href = "/calendar";
      } else {
        setMessage(data.detail || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto bg-white shadow-lg p-6 rounded">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      {message && <p className="mt-4 text-sm text-center text-gray-700">{message}</p>}
    </form>
  );
}

export default LoginForm;
