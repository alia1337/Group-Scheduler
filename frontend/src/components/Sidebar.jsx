import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Sidebar = () => {
  const { groups, visibleGroups, toggleGroupVisibility, refreshGroups, setVisibleGroups } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGroupActionsMenu, setShowGroupActionsMenu] = useState(false);
  const [joinKey, setJoinKey] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [createGroupName, setCreateGroupName] = useState("");
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [createdGroupJoinKey, setCreatedGroupJoinKey] = useState("");
  const [createdGroupName, setCreatedGroupName] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsCreator, setUserIsCreator] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreateGroup = async () => {
    const token = localStorage.getItem("token");
    if (!token || !createGroupName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: createGroupName.trim(),
          member_emails: [] // Backend requires this field even though we're only inputting a name
        }),
      });

      const data = await res.json();
      console.log("Create group API response:", data);
      if (res.ok) {
        setCreatedGroupJoinKey(data.join_key);
        setCreatedGroupName(createGroupName);
        setShowCreateSuccess(true);
        setCreateGroupName("");
        // Refresh groups list
        refreshGroups();
      } else {
        // Handle different error formats
        let errorMessage = "Failed to create group";
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err).join(', ');
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      alert("❌ Error creating group");
    }
  };

  const handleJoinGroup = async () => {
    const token = localStorage.getItem("token");
    if (!token || !joinKey.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ join_key: joinKey.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setJoinMessage(`✅ ${data.message}`);
        setJoinKey("");
        // Refresh groups list
        refreshGroups();
      } else {
        setJoinMessage(`❌ ${data.detail || "Failed to join group"}`);
      }
    } catch (error) {
      setJoinMessage("❌ Error joining group");
    }
  };

  const viewGroupMembers = async (groupId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data.members);
        setUserIsAdmin(data.user_is_admin === 1 || data.user_is_admin === true);
        
        const currentGroup = groups.find(g => g.group_id === groupId);
        setUserIsCreator(currentGroup?.is_creator === 1);
        
        setSelectedGroupId(groupId);
        setShowMembersModal(true);
      } else {
        alert("Failed to fetch group members");
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      alert("Error fetching group members");
    }
  };

  const performAdminAction = async (userId, action) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/admin-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: selectedGroupId,
          user_id: userId,
          action: action,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        viewGroupMembers(selectedGroupId);
        refreshGroups();
      } else {
        alert(data.detail || "Action failed");
      }
    } catch (error) {
      console.error("Error performing admin action:", error);
      alert("Error performing action");
    }
  };

  const updateGroupName = async (groupId, newName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Group name updated successfully!");
        setEditingGroupName(false);
        setNewGroupName("");
        refreshGroups();
      } else {
        alert(data.detail || "Failed to update group name");
      }
    } catch (error) {
      console.error("Error updating group name:", error);
      alert("Error updating group name");
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setShowMembersModal(false);
        refreshGroups();
        alert("Group deleted successfully!");
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Error deleting group");
    }
  };

  return (
    <>
      {/* Navigation Sidebar */}
      <div className="w-60 bg-white shadow-lg rounded-lg p-3 h-fit">
        {/* Personal Calendar Navigation */}
        <Link 
          to="/personal-calendar"
          className={`group relative block mb-2 p-3 rounded-lg cursor-pointer transition-all duration-150 font-medium text-sm ${
            location.pathname === '/personal-calendar'
              ? 'bg-blue-100 text-blue-800 rounded-2xl border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:rounded-2xl'
          }`}
          onMouseEnter={(e) => {
            if (location.pathname !== '/personal-calendar') {
              e.target.style.borderRadius = '16px';
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/personal-calendar') {
              e.target.style.borderRadius = '8px';
            }
          }}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">Personal Calendar</span>
          </div>
          {/* Left indicator */}
          <div className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 bg-blue-500 rounded-r transition-all duration-150 ${
            location.pathname === '/personal-calendar' ? 'h-10' : 'h-0 group-hover:h-5'
          }`} />
        </Link>

        {/* Separator */}
        <div className="h-0.5 bg-gray-200 mx-2 mb-3 rounded" />

        {/* Group Calendar Navigation */}
        <Link 
          to="/calendar"
          className={`group relative block mb-2 p-3 rounded-lg cursor-pointer transition-all duration-150 font-medium text-sm ${
            location.pathname === '/calendar' && !location.search.includes('group=')
              ? 'bg-blue-100 text-blue-800 rounded-2xl border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:rounded-2xl'
          }`}
          onMouseEnter={(e) => {
            if (!(location.pathname === '/calendar' && !location.search.includes('group='))) {
              e.target.style.borderRadius = '16px';
            }
          }}
          onMouseLeave={(e) => {
            if (!(location.pathname === '/calendar' && !location.search.includes('group='))) {
              e.target.style.borderRadius = '8px';
            }
          }}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">Group Calendar</span>
          </div>
          {/* Left indicator */}
          <div className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 bg-blue-500 rounded-r transition-all duration-150 ${
            location.pathname === '/calendar' && !location.search.includes('group=') ? 'h-10' : 'h-0 group-hover:h-5'
          }`} />
        </Link>

        {/* Separator */}
        <div className="h-0.5 bg-gray-200 mx-2 mb-3 rounded" />

        {/* Groups List */}
        <div className="space-y-2">
          {groups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No groups yet</p>
              <Link 
                to="/new-group" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Create your first group →
              </Link>
            </div>
          ) : (
            groups.map((group) => {
              // Check if we're currently viewing this group (using URL params)
              const urlParams = new URLSearchParams(location.search);
              const currentGroupId = urlParams.get('group');
              const isCurrentGroup = currentGroupId === String(group.group_id);
              
              return (
                <div 
                  key={group.group_id} 
                  className="group relative"
                >
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-150 font-medium text-sm relative ${
                      isCurrentGroup 
                        ? 'bg-blue-100 text-blue-800 rounded-2xl border border-blue-200' 
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:rounded-2xl border border-gray-200'
                    }`}
                    onClick={() => navigate(`/calendar?group=${group.group_id}`)}
                    onMouseEnter={(e) => {
                      if (!isCurrentGroup) {
                        e.target.style.borderRadius = '16px';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentGroup) {
                        e.target.style.borderRadius = '8px';
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">
                        {String(group.group_name || 'Unnamed Group').trim()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewGroupMembers(group.group_id);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        title="Group Settings"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.5 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Member Count as notification badge */}
                    {group.members && group.members.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-5 text-center">
                        {group.members.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Left indicator */}
                  <div 
                    className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 bg-blue-500 rounded-r transition-all duration-150 ${
                      isCurrentGroup ? 'h-10' : 'h-0 group-hover:h-5'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Separator */}
        <div className="h-0.5 bg-gray-200 mx-2 my-3 rounded" />

        {/* Add Group Button */}
        <div className="group relative">
          <div
            className="p-3 rounded-lg cursor-pointer transition-all duration-150 font-medium text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 hover:border-solid flex items-center justify-center"
            onClick={() => setShowGroupActionsMenu(true)}
            onMouseEnter={(e) => {
              e.target.style.borderRadius = '16px';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderRadius = '8px';
            }}
          >
            <span className="text-2xl">+</span>
          </div>
          {/* Left indicator */}
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 bg-green-500 rounded-r transition-all duration-150 h-0 group-hover:h-5" />
        </div>
      </div>

      {/* Group Actions Menu */}
      {showGroupActionsMenu && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Group Actions</h3>
              <button
                onClick={() => {
                  setShowGroupActionsMenu(false);
                  setJoinKey("");
                  setJoinMessage("");
                  setCreateGroupName("");
                  setShowCreateSuccess(false);
                  setCreatedGroupJoinKey("");
                  setCreatedGroupName("");
                }}
                className="px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            {/* Create New Group Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create New Group
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter group name"
                  className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  maxLength={50}
                />
                <button
                  onClick={handleCreateGroup}
                  disabled={!createGroupName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create
                </button>
              </div>
            </div>

            {showCreateSuccess && createdGroupJoinKey && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Group "{createdGroupName}" Created Successfully!</h4>
                <p className="text-sm text-green-700 mb-3">Share this join key with friends:</p>
                <div className="bg-white border border-green-300 rounded px-3 py-2 font-mono text-center text-lg font-bold text-green-800 mb-3">
                  {createdGroupJoinKey}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdGroupJoinKey);
                    alert("Join key copied to clipboard!");
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium rounded"
                >
                  Copy Join Key
                </button>
              </div>
            )}

            {/* Separator */}
            <div className="h-0.5 bg-gray-200 mx-2 mb-4 rounded" />
            
            {/* Join Group Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Group Join Key
              </label>
              <input
                type="text"
                placeholder="e.g. ABC123XY"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask a group creator for their join key
              </p>
            </div>

            {joinMessage && (
              <div className="mb-4 p-3 rounded bg-gray-50 text-sm">
                {joinMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGroupActionsMenu(false);
                  setJoinKey("");
                  setJoinMessage("");
                  setCreateGroupName("");
                  setShowCreateSuccess(false);
                  setCreatedGroupJoinKey("");
                  setCreatedGroupName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={!joinKey.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 text-sm font-medium rounded-lg"
              >
                Join Group
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Group Settings Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Group Settings</h3>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setEditingGroupName(false);
                  setNewGroupName("");
                  setUserIsCreator(false);
                }}
                className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>

            {/* Group Name Section */}
            {Boolean(userIsAdmin) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Group Name</h4>
                  {!Boolean(editingGroupName) && (
                    <button
                      onClick={() => {
                        setEditingGroupName(true);
                        const currentGroup = groups.find(g => g.group_id === selectedGroupId);
                        setNewGroupName(currentGroup?.group_name || "");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingGroupName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group name"
                    />
                    <button
                      onClick={() => updateGroupName(selectedGroupId, newGroupName)}
                      disabled={!newGroupName.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 text-sm font-medium rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingGroupName(false);
                        setNewGroupName("");
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm font-medium rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {groups.find(g => g.group_id === selectedGroupId)?.group_name || "Unnamed Group"}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{member.username}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <div className="flex gap-1">
                      {Boolean(member.is_creator === 1) && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Creator
                        </span>
                      )}
                      {Boolean(member.is_admin === 1 && member.is_creator !== 1) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                      {Boolean(member.is_admin !== 1 && member.is_creator !== 1) && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Member
                        </span>
                      )}
                    </div>
                  </div>

                  {Boolean(userIsAdmin && member.is_creator !== 1) && (
                    <div className="flex gap-2">
                      {member.is_admin !== 1 ? (
                        <button
                          onClick={() => performAdminAction(member.id, "promote")}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium rounded"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => performAdminAction(member.id, "demote")}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm font-medium rounded"
                        >
                          Remove Admin
                        </button>
                      )}
                      <button
                        onClick={() => performAdminAction(member.id, "kick")}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded"
                      >
                        Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!Boolean(userIsAdmin) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only group admins can manage members. Contact an admin if you need to make changes.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {Boolean(userIsCreator) && (
                <button
                  onClick={() => deleteGroup(selectedGroupId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded"
                >
                  Delete Group
                </button>
              )}
              <div className={Boolean(userIsCreator) ? "" : "ml-auto"}>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setUserIsCreator(false);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm font-medium rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;