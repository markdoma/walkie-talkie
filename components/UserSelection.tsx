import React, { useState } from "react";
import { LOGO_URL } from "../constants";
import { TeamMember, TeamMemberStatus } from "../types";
import InitialsAvatar from "./InitialsAvatar";

const ADMIN_USER: TeamMember = {
  id: "0",
  name: "Admin",
  status: TeamMemberStatus.Out,
};

interface UserSelectionProps {
  onLogin: (user: TeamMember) => void;
  teamMembers: TeamMember[];
  isLoading: boolean;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  onLogin,
  teamMembers,
  isLoading,
}) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const allUsers = [...teamMembers, ADMIN_USER];

  const handleUserSelect = (user: TeamMember) => {
    if (user.id === ADMIN_USER.id) {
      setShowAdminModal(true);
    } else {
      onLogin(user);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      onLogin(ADMIN_USER);
      closeModal();
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const closeModal = () => {
    setShowAdminModal(false);
    setError("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <img
          src={LOGO_URL}
          alt="Walkie Talkie Café Logo"
          className="w-48 mx-auto"
        />
        <p className="text-lg text-text-secondary mt-4">
          Please select your profile to continue
        </p>
      </div>
      {isLoading ? (
        <p className="text-text-main text-lg">Loading profiles...</p>
      ) : (
        <div className="flex flex-wrap gap-8 justify-center items-center max-w-5xl mx-auto">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200 group w-56"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover mb-4"
                />
              ) : (
                <InitialsAvatar
                  name={user.name}
                  size={24}
                  textSize="text-3xl"
                  className="mb-4 border-4 border-gray-100 group-hover:border-primary-light transition-colors"
                />
              )}
              <p className="font-bold text-text-main text-center">
                {user.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAdminModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-center mb-4 text-text-main">
              Admin Login
            </h2>
            <form onSubmit={handleAdminLogin}>
              <label
                className="block text-text-secondary mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-2 px-4 bg-gray-200 text-text-secondary rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelection;
