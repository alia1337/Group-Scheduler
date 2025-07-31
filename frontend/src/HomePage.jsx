import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function HomePage() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  const [loginUsernameOrEmail, setLoginUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [showRegisterTab, setShowRegisterTab] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("username");
    if (storedName) setUsername(storedName);

    if (token) {
      fetch("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.username) {
            setUsername(data.username);
            localStorage.setItem("username", data.username);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleRegister = async () => {
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
      }),
    });

    const result = await response.json();
    setRegisterMessage(result.message || result.detail || "Registration complete.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsernameOrEmail || !loginPassword) {
      setLoginMessage("Please enter username/email and password.");
      return;
    }

    setLoginMessage("Logging in...");
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: loginUsernameOrEmail,
          password: loginPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginMessage(result.detail || "Login failed.");
        return;
      }

      localStorage.setItem("token", result.access_token);

      const meRes = await fetch("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${result.access_token}` },
      });
      const userData = await meRes.json();
      if (userData.username) {
        setUsername(userData.username);
        localStorage.setItem("username", userData.username);
      }

      setLoginMessage("Login successful!");
      navigate("/calendar");
    } catch (error) {
      console.error("Login error:", error);
      setLoginMessage("Error logging in.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
          <Link to="/calendar" className="hover:underline font-medium">My Calendar</Link>
          <Link to="/new-group" className="hover:underline font-medium">New Group</Link>
          <Link to="#" className="hover:underline font-medium">New Event</Link>
          {username && <span className="text-gray-600">Welcome {username}</span>}
          {username && (
            <button onClick={handleLogout} className="text-red-600 hover:underline font-medium ml-2">
              Logout
            </button>
          )}
        </nav>
      </header>

      <div className="text-center mt-8 mb-4">
        <h2 className="text-3xl font-bold">Calendar Planning</h2>
        <p className="text-gray-600">Manage your schedule effectively with our online calendar.</p>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-10 px-8">
        <section className="bg-white shadow-md rounded-2xl p-6">
          {!showRegisterTab ? (
            <form onSubmit={handleLogin}>
              <h2 className="text-xl font-semibold mb-4">Login</h2>
              <label className="block text-sm mb-1">Email or Username</label>
              <input
                type="text"
                placeholder="Email or Username"
                value={loginUsernameOrEmail}
                onChange={(e) => setLoginUsernameOrEmail(e.target.value)}
                className="w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Log in
              </button>
              {loginMessage && <p className="mt-2 text-sm text-red-600">{loginMessage}</p>}
              <div className="mt-4 flex flex-col text-sm space-y-2 text-center">
                <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
                <button onClick={() => setShowRegisterTab(true)} className="text-blue-600 hover:underline">
                  New user? Register
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Register</h2>
              <label className="block text-sm mb-1">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full mb-2 p-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleRegister}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Register
              </button>
              {registerMessage && <p className="mt-2 text-sm">{registerMessage}</p>}
              <div className="mt-4 text-sm text-center">
                <button onClick={() => setShowRegisterTab(false)} className="text-blue-600 hover:underline">
                  Already have an account? Login
                </button>
              </div>
            </div>
          )}
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

export default HomePage;
