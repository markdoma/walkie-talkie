import React, { useState, useEffect } from "react";
import { TeamMember } from "../../../types";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Pick<TeamMember, "name"> | TeamMember) => void;
  employee: TeamMember | null;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employee,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const isEditMode = employee !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(employee.name);
        setAvatar(employee.avatar || null);
      } else {
        setName("");
        setAvatar(null);
      }
      setError(""); // Clear errors when modal opens
    }
  }, [isOpen, employee, isEditMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (isEditMode) {
      onSubmit({ ...employee, name, avatar });
    } else {
      onSubmit({ name, avatar });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-main">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                className="block text-text-secondary mb-2"
                htmlFor="employeeName"
              >
                Full Name
              </label>
              <input
                id="employeeName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-text-secondary mb-2">Avatar</label>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover mb-2"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-gray-400">
                  No photo
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatarUpload"
                />
                <label
                  htmlFor="avatarUpload"
                  className="px-2 py-1 bg-green-100 text-green-700 rounded cursor-pointer"
                >
                  Upload Photo
                </label>
                {avatar && (
                  <button
                    type="button"
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    onClick={() => setAvatar(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gray-200 text-text-secondary font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              {isEditMode ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
