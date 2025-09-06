import React, { useState, useEffect } from "react";
import { LoadingProvider, useLoading } from "./components/LoadingContext";
import Spinner from "./components/Spinner";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Timesheets from "./components/Timesheets";
import Reports from "./components/Reports";
import UserSelection from "./components/UserSelection";
import { Page, TeamMember, TeamMemberStatus } from "./types";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "./constants";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { loading, setLoading } = useLoading();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoading(true);
      try {
        const members = await getEmployees();
        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleLogin = (user: TeamMember) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddEmployee = async (
    employeeData: Pick<TeamMember, "name" | "avatar">
  ) => {
    setLoading(true);
    try {
      const newId = await addEmployee(employeeData);
      // Fetch the new employee from Firestore to get the avatar URL
      const members = await getEmployees();
      const newEmployee = members.find((m) => m.id === newId);
      if (newEmployee) {
        setTeamMembers((prev) => [...prev, newEmployee]);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (updatedEmployee: TeamMember) => {
    setLoading(true);
    try {
      await updateEmployee(updatedEmployee);
      // Fetch the updated employee from Firestore to get the avatar URL
      const members = await getEmployees();
      const updated = members.find((m) => m.id === updatedEmployee.id);
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === updatedEmployee.id && updated ? updated : m))
      );
    } catch (error) {
      console.error("Error updating employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    setLoading(true);
    try {
      await deleteEmployee(employeeId);
      setTeamMembers((prev) => prev.filter((m) => m.id !== employeeId));
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const isAdmin = currentUser.id === "0";
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            isAdmin={isAdmin}
            currentUser={currentUser}
            teamMembers={teamMembers}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case "timesheets":
        return (
          <Timesheets
            isAdmin={isAdmin}
            currentUser={currentUser}
            teamMembers={teamMembers}
          />
        );
      case "reports":
        return (
          <Reports
            isAdmin={isAdmin}
            currentUser={currentUser}
            teamMembers={teamMembers}
          />
        );
      default:
        return (
          <Dashboard
            isAdmin={isAdmin}
            currentUser={currentUser}
            teamMembers={teamMembers}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
    }
  };

  if (!currentUser) {
    return (
      <UserSelection
        onLogin={handleLogin}
        teamMembers={teamMembers}
        isLoading={loading}
      />
    );
  }

  const isAdmin = currentUser.id === "0";

  return (
    <div className="flex h-screen bg-background text-text-main">
      {isAdmin && (
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isAdmin={isAdmin}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const AppWithLoadingProvider: React.FC = () => (
  <LoadingProvider>
    <AppContent />
  </LoadingProvider>
);

function AppContent() {
  const { loading } = useLoading();
  return (
    <>
      {loading && <Spinner />}
      <App />
    </>
  );
}

export default AppWithLoadingProvider;
