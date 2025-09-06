import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md flex items-center">
      <div
        className={`p-3 rounded-full bg-opacity-10 ${color.replace(
          "text-",
          "bg-"
        )} ${color}`}
      >
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm md:text-xs lg:text-xs font-medium text-text-secondary">
          {title}
        </p>
        <p className="text-2xl md:text-xl lg:text-lg font-bold text-text-main">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
