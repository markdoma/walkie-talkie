import React, { useState, useEffect } from "react";
import { TeamMember } from "../../types";
import EmployeeFormModal from "./modals/EmployeeFormModal";
import ConfirmationModal from "./modals/ConfirmationModal";
import InitialsAvatar from "../InitialsAvatar";
import { getLatestEmployeeShift, addEmployeeShiftChange } from "../../shiftApi";

interface ShiftManagementProps {
  members: TeamMember[];
  onAdd: (employeeData: Pick<TeamMember, "name">) => void;
  onUpdate: (employee: TeamMember) => void;
  onDelete: (employeeId: string) => void;
}

const ShiftManagement: React.FC<ShiftManagementProps> = ({
  members,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [shifts, setShifts] = useState<{ [key: string]: string }>({});
  const [pendingShift, setPendingShift] = useState<{
    id: string;
    shift: string;
  } | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Modal and selected employee state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(
    null
  );

  // Fetch latest shifts for all members on mount or when members change
  useEffect(() => {
    const fetchShifts = async () => {
      const shiftMap: { [key: string]: string } = {};
      await Promise.all(
        members.map(async (member) => {
          shiftMap[member.id] = await getLatestEmployeeShift(member.id);
        })
      );
      setShifts(shiftMap);
    };
    fetchShifts();
  }, [members]);

  // When admin selects a new shift, show confirmation modal
  const handleShiftChange = (employeeId: string, shift: string) => {
    setPendingShift({ id: employeeId, shift });
    setIsShiftModalOpen(true);
  };

  // On confirm, write to Firestore and update UI
  const handleConfirmShiftChange = async () => {
    if (pendingShift) {
      await addEmployeeShiftChange(pendingShift.id, pendingShift.shift);
      setShifts((prev) => ({ ...prev, [pendingShift.id]: pendingShift.shift }));
    }
    setIsShiftModalOpen(false);
    setPendingShift(null);
  };

  const handleCancelShiftChange = () => {
    setIsShiftModalOpen(false);
    setPendingShift(null);
  };

  // --- Modal Handlers ---
  const openAddModal = () => {
    setSelectedEmployee(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (employee: TeamMember) => {
    setSelectedEmployee(employee);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (employee: TeamMember) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (
    employeeData: Pick<TeamMember, "name"> | TeamMember
  ) => {
    if ("id" in employeeData) {
      onUpdate(employeeData as TeamMember);
    } else {
      onAdd(employeeData);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedEmployee) {
      onDelete(selectedEmployee.id);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md h-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-text-main">
              Work Shift Management
            </h3>
          </div>
          <div className="flex-1 text-right">
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-200"
            >
              Add Employee
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">
                  Employee
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider">
                  Shift Schedule
                </th>
                <th className="p-3 text-sm font-semibold text-gray-600 tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member: TeamMember) => (
                <tr key={member.id}>
                  <td className="p-3">
                    <div className="flex items-center">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <InitialsAvatar name={member.name} size={10} />
                      )}
                      <div className="ml-3">
                        <p className="font-semibold text-text-main">
                          {member.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={shifts[member.id] || "9:00 AM"}
                      onChange={(e) =>
                        handleShiftChange(member.id, e.target.value)
                      }
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      aria-label={`Shift for ${member.name}`}
                    >
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 text-gray-500 hover:text-primary-light rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={`Edit ${member.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path
                            fillRule="evenodd"
                            d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(member)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={`Delete ${member.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        employee={selectedEmployee}
      />

      {selectedEmployee && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Employee"
          message={`Are you sure you want to change ${selectedEmployee.name}? `}
        />
      )}
      {/* Shift Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={isShiftModalOpen}
        onClose={handleCancelShiftChange}
        onConfirm={handleConfirmShiftChange}
        title="Change Shift"
        message={`Are you sure you want to change the shift to ${
          pendingShift?.shift || ""
        }?`}
      />
    </>
  );
};

export default ShiftManagement;
