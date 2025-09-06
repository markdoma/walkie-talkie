import React, { useState, useEffect } from 'react';
import { TimeEntry, TimeEntryType } from '../../types';
import CameraModal from './CameraModal';

interface ClockProps {
    addTimeLogEntry: (entry: Omit<TimeEntry, 'id' | 'employeeId'>) => void;
    setTotalHours: (hours: string) => void;
    // Fix: Add totalHours to props for display
    totalHours: string;
    initialLog: TimeEntry[];
}

// Fix: Destructure totalHours from props
const Clock: React.FC<ClockProps> = ({ addTimeLogEntry, setTotalHours, initialLog, totalHours }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const lastEntry = initialLog.length > 0 ? initialLog[initialLog.length - 1] : null;
        
        if (lastEntry) {
            if (lastEntry.type === TimeEntryType.ClockIn || lastEntry.type === TimeEntryType.BreakEnd) {
                setIsClockedIn(true);
                setIsOnBreak(false);
            } else if (lastEntry.type === TimeEntryType.BreakStart) {
                setIsClockedIn(true);
                setIsOnBreak(true);
            } else { // ClockOut
                setIsClockedIn(false);
                setIsOnBreak(false);
            }
        }
        
        const clockInEntry = initialLog.find(e => e.type === TimeEntryType.ClockIn);
        if (clockInEntry) {
            setStartTime(clockInEntry.timestamp);
        }

    }, [initialLog]);


    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        const calculateTotalHours = () => {
            let totalWorkedMs = 0;
            let currentClockInTime: Date | null = null;

            for (const entry of initialLog) {
                if (entry.type === TimeEntryType.ClockIn) {
                    currentClockInTime = entry.timestamp;
                } else if (entry.type === TimeEntryType.ClockOut && currentClockInTime) {
                    totalWorkedMs += entry.timestamp.getTime() - currentClockInTime.getTime();
                    currentClockInTime = null;
                } else if (entry.type === TimeEntryType.BreakStart && currentClockInTime) {
                    totalWorkedMs += entry.timestamp.getTime() - currentClockInTime.getTime();
                    currentClockInTime = null;
                } else if (entry.type === TimeEntryType.BreakEnd && !currentClockInTime) {
                    currentClockInTime = entry.timestamp;
                }
            }
            
            if (isClockedIn && !isOnBreak && currentClockInTime) {
                 totalWorkedMs += new Date().getTime() - currentClockInTime.getTime();
            }

            setTotalHours(formatDuration(totalWorkedMs));
            return totalWorkedMs;
        }

        calculateTotalHours(); // Initial calculation

        if (isClockedIn && !isOnBreak) {
            interval = setInterval(calculateTotalHours, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isClockedIn, isOnBreak, initialLog, setTotalHours]);

    const formatDuration = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const handleClockIn = () => {
        setIsCameraOpen(true);
    };

    const handleConfirmClockIn = (selfieUrl: string) => {
        const now = new Date();
        setIsClockedIn(true);
        setStartTime(now);
        addTimeLogEntry({ type: TimeEntryType.ClockIn, timestamp: now, selfieUrl });
        setIsCameraOpen(false);
    };

    const handleClockOut = () => {
        setIsClockedIn(false);
        addTimeLogEntry({ type: TimeEntryType.ClockOut, timestamp: new Date() });
    };

    const handleBreak = () => {
        const newBreakState = !isOnBreak;
        setIsOnBreak(newBreakState);
        const type = newBreakState ? TimeEntryType.BreakStart : TimeEntryType.BreakEnd;
        addTimeLogEntry({ type: type, timestamp: new Date() });
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-text-main">{currentTime.toLocaleTimeString()}</h2>
                        <p className="text-text-secondary">{currentTime.toDateString()}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-center">
                        <p className="text-text-secondary">Time Worked Today</p>
                        {/* Fix: Use the totalHours prop for display */}
                        <p className="text-4xl font-bold text-primary">{totalHours}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    {!isClockedIn ? (
                        <button onClick={handleClockIn} className="w-full py-3 px-6 text-lg font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200">
                            Clock In
                        </button>
                    ) : (
                        <>
                            <button onClick={handleClockOut} className="w-full py-3 px-6 text-lg font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200">
                                Clock Out
                            </button>
                            <button onClick={handleBreak} className={`w-full py-3 px-6 text-lg font-semibold text-white rounded-lg transition-colors duration-200 ${isOnBreak ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                                {isOnBreak ? 'End Break' : 'Start Break'}
                            </button>
                        </>
                    )}
                </div>
            </div>
            {isCameraOpen && (
                <CameraModal
                    onConfirm={handleConfirmClockIn}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}
        </>
    );
};

export default Clock;
