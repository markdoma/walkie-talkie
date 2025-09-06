import React from "react";
import { TeamMember } from "../types";
import { LOGO_URL } from "../constants";

interface HeaderProps {
  currentUser: TeamMember;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const isAdmin = currentUser.id === "0";
  return (
    <header className="bg-gradient-to-r from-blue-100 to-white p-4 flex justify-between items-center flex-shrink-0 relative h-20">
      {!isAdmin && (
        <img
          src={LOGO_URL}
          alt="Walkie Talkie Café Logo"
          className="w-16 h-auto"
        />
      )}
      <button
        onClick={onLogout}
        className="flex items-center space-x-3 px-6 py-3 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-200"
        aria-label="Switch user"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        <span>Switch User</span>
      </button>
    </header>
  );
};

export default Header;
