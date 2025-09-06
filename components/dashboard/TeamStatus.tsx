import React from "react";
import { TeamMember, TeamMemberStatus } from "../../types";
import InitialsAvatar from "../InitialsAvatar";

const StatusBadge: React.FC<{ status: TeamMemberStatus }> = ({ status }) => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
  switch (status) {
    case TeamMemberStatus.In:
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>In</span>
      );
    case TeamMemberStatus.Out:
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>Out</span>
      );
    case TeamMemberStatus.OnBreak:
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          On Break
        </span>
      );
    default:
      return null;
  }
};

const TeamStatus: React.FC<{ members: TeamMember[] }> = ({ members }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-full">
      <h3 className="text-xl font-bold text-text-main mb-4">Who's In</h3>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between">
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
                <p className="font-semibold text-text-main">{member.name}</p>
              </div>
            </div>
            <StatusBadge status={member.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamStatus;
