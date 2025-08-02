import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const NewGroupPage = () => {
  const [groupName, setGroupName] = useState("");
  const [emails, setEmails] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [joinKey, setJoinKey] = useState("");
  const [showJoinKey, setShowJoinKey] = useState(false);
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

    // Emails are now optional - groups can be created without members

    const payload = {
      name: groupName.trim(),
      member_emails: cleanedEmails,
    };

    try {
      console.log("Creating group with payload:", payload);
      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Response:", res.status, data);
      
      if (res.ok) {
        setMessage("✅ Group created successfully!");
        if (data.join_key) {
          setJoinKey(data.join_key);
          setShowJoinKey(true);
        }
        // Don't navigate immediately - let user see the join key
      } else {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }
    } catch (err) {
      console.error("Error creating group:", err);
      setError("Something went wrong: " + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          className="w-full border px-3 py-2 mb-4 rounded"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Add friends to your group (optional):</p>
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder={`Friend Email #${index + 1}`}
                className="flex-1 border px-3 py-2 rounded"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
              />
              <button
                onClick={() => {
                  const updated = emails.filter((_, i) => i !== index);
                  setEmails(updated);
                }}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={handleAddEmail} className="text-blue-600 hover:underline">
            + Add a friend
          </button>
        </div>

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
        
        {showJoinKey && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Group Join Key</h3>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-2 rounded border text-lg font-mono">{joinKey}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(joinKey);
                  alert("Join key copied to clipboard!");
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this key with friends so they can join your group
            </p>
            <button
              onClick={() => navigate("/calendar")}
              className="mt-3 text-blue-600 hover:underline"
            >
              Go to Calendar →
            </button>
          </div>
        )}
    </div>
  );
};

export default NewGroupPage;
