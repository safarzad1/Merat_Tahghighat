import React from "react";
import { Monitor, MonitorOff, PhoneOff } from "lucide-react";

interface ControlsProps {
    isScreenSharing: boolean;
    role: string;
    onStartScreenShare: () => void;
    onStopScreenShare: () => void;
}

export default function Controls({
    isScreenSharing,
    role,
    onStartScreenShare,
    onStopScreenShare
}: ControlsProps) {
    return (
        <footer className="h-20 bg-gray-800 flex items-center justify-center gap-6 border-t border-gray-700 shrink-0 z-10">

            {/* دکمه اشتراک صفحه: فقط برای استاد نمایش داده می‌شود */}
            {role === 'teacher' && (
                <button
                    onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-bold ${isScreenSharing
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                >
                    {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                    <span>{isScreenSharing ? "توقف اشتراک صفحه" : "شروع اشتراک صفحه"}</span>
                </button>
            )}

            {/* دکمه خروج */}
            <button className="p-4 rounded-full bg-gray-700 hover:bg-red-600 transition-all text-white">
                <PhoneOff size={24} />
            </button>
        </footer>
    );
}