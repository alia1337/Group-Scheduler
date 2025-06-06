import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const NewGroupPage = () => {
  const [groupName, setGroupName] = useState("");
  const [emails, setEmails] = useState([""]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleEmailChange = (index, value) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    setMessage("");
    setError("");

    const cleanedEmails = emails.filter((e) => e.trim() !== "");

    if (!token) {
      setError("Not authenticated.");
      return;
    }

    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    if (cleanedEmails.length === 0) {
      setError("Please add at least one friend email.");
      return;
    }

    const payload = {
      name: groupName.trim(),
      member_emails: cleanedEmails,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Group created successfully!");
        setTimeout(() => navigate("/calendar"), 1500);
      } else {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm mb-6">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
          <Link to="/" className="hover:underline font-medium">Home</Link>
          <Link to="/calendar" className="hover:underline font-medium">My Calendar</Link>
          <Link to="/new-group" className="hover:underline font-medium">New Group</Link>
          {username && <span className="text-gray-600">Welcome {username}</span>}
        </nav>
      </header>

      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          className="w-full border px-3 py-2 mb-4 rounded"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {emails.map((email, index) => (
          <input
            key={index}
            type="email"
            placeholder={`Friend Email #${index + 1}`}
            className="w-full border px-3 py-2 mb-2 rounded"
            value={email}
            onChange={(e) => handleEmailChange(index, e.target.value)}
          />
        ))}

        <button onClick={handleAddEmail} className="mb-4 text-blue-600 hover:underline">
          + Add another friend
        </button>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Group
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-green-700 text-center">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default NewGroupPage;
