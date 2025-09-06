import React, { useState } from "react";
import { TimeEntry, TimeEntryType } from "../../types";

const getIconForType = (type: TimeEntryType) => {
  switch (type) {
    case TimeEntryType.ClockIn:
      return (
        <div className="bg-green-100 text-green-600 p-2 rounded-full">
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
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </div>
      );
    case TimeEntryType.ClockOut:
      return (
        <div className="bg-red-100 text-red-600 p-2 rounded-full">
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>
      );
    case TimeEntryType.BreakStart:
      return (
        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
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
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
    case TimeEntryType.BreakEnd:
      return (
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
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
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const TimeLog: React.FC<{ entries: TimeEntry[] }> = ({ entries }) => {
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-text-main mb-4">
        Today's Activity
      </h3>
      <ul className="space-y-4">
        {[...entries].reverse().map((entry) => (
          <li key={entry.id} className="flex items-center">
            {getIconForType(entry.type)}
            <div className="ml-4 flex-grow flex items-center">
              <p className="font-semibold text-text-main">{entry.type}</p>
              {entry.type === TimeEntryType.ClockIn && entry.selfieUrl && (
                <img
                  src={entry.selfieUrl}
                  alt="Clock-in selfie"
                  className="w-8 h-8 rounded-full ml-3 object-cover cursor-pointer"
                  onClick={() => setModalUrl(entry.selfieUrl)}
                />
              )}
            </div>
            <p className="text-text-secondary font-medium">
              {entry.timestamp.toLocaleTimeString()}
            </p>
          </li>
        ))}
      </ul>
      {modalUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setModalUrl(null)}
        >
          <div
            className="bg-white rounded-lg p-4 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalUrl(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img
              src={modalUrl}
              alt="Selfie full view"
              className="max-w-xs max-h-[70vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeLog;
