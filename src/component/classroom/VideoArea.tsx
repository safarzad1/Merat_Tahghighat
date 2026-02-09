import React, { useRef, useEffect } from "react";
import { Monitor } from "lucide-react";

interface VideoAreaProps {
    localStream: MediaStream | null;
    isScreenSharing: boolean;
}

export default function VideoArea({ localStream, isScreenSharing }: VideoAreaProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-gray-900 relative">
            {isScreenSharing ? (
                <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded text-sm font-bold">
                        در حال اشتراک صفحه
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                    <Monitor size={48} className="opacity-50" />
                    <p>فضای اشتراک صفحه (فعلاً خالی)</p>
                </div>
            )}
        </div>
    );
}