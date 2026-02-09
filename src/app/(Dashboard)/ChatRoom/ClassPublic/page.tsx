"use client";

import { useEffect, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Header from "@/component/classroom/Header";
import ChatSidebar from "@/component/classroom/ChatSidebar";
import VideoArea from "@/component/classroom/VideoArea";
import UserList from "@/component/classroom/UserList";
import Controls from "@/component/classroom/Controls";

export default function ClassroomPage() {
    const user = useSelector((state: RootState) => state.user);
    const [socket, setSocket] = useState<Socket | null>(null);
    const roomId = "test-room";
    const userId = user?.UserId?.toString() || "guest";
    const role = user?.Mahal?.toString() === "101" ? "teacher" : "student";

    // ✅ اصلاح شد: گرفتن نام کامل از user.FullName
    const fullName = user?.FullName?.toString();


    console.log("fullName = " + fullName); // اینجا نام درسته

    const { localStream, peers, usersList, isScreenSharing, startScreenShare, stopScreenShare } = useWebRTC({
        socket,
        roomId,
        userId,
        role,
        fullName, // ارسال نام کامل به هوک
    });

    useEffect(() => {
        const newSocket = io("http://localhost:3001", { transports: ["polling"] });
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <div className="h-[80vh] flex flex-col bg-gray-900 text-white overflow-hidden rounded-xl shadow-2xl border border-gray-700 mx-4 mt-4">
            <Header roomId={roomId} user={user} role={role} />
            <div className="flex-1 flex overflow-hidden">
                <ChatSidebar socket={socket} roomId={roomId} currentUser={user?.FullName || "کاربر"} />
                <VideoArea localStream={localStream} isScreenSharing={isScreenSharing} />
                <UserList currentUser={user} role={role} users={usersList} />
            </div>
            <Controls
                isScreenSharing={isScreenSharing}
                role={role}
                onStartScreenShare={startScreenShare}
                onStopScreenShare={stopScreenShare}
            />
        </div>
    );
}