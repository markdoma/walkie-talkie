import React, { useState } from "react";
import { Page } from "../types";
import { LOGO_URL } from "../constants";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isAdmin: boolean;
}

type NavItemType = {
  id: Page;
  label: string;
  icon: React.ReactNode;
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 rounded-lg text-gray-300 hover:bg-sidebar-accent hover:text-white transition-colors duration-200 ${
        isActive ? "bg-primary text-white" : ""
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </a>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isAdmin,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems: NavItemType[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: "timesheets",
      label: "Timesheets",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "reports",
      label: "Reports",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Desktop sidebar
  const desktopSidebar = (
    <aside className="w-64 bg-sidebar text-white flex-shrink-0 p-4 hidden md:block">
      <div className="flex items-center justify-center mb-8">
        <img src={LOGO_URL} alt="Walkie Talkie Café Logo" className="w-32" />
      </div>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.id}
              onClick={() => setCurrentPage(item.id)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );

  // Mobile sidebar
  // Only show hamburger button and drawer on small screens if not admin
  const mobileSidebar = !isAdmin && (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-sidebar text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex md:hidden">
          <aside className="w-64 bg-sidebar text-white p-4 h-full shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
            <div className="flex items-center justify-center mb-8">
              <img
                src={LOGO_URL}
                alt="Walkie Talkie Café Logo"
                className="w-32"
              />
            </div>
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
              </ul>
            </nav>
          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
};

export default Sidebar;
