"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import { HomeIcon, Newspaper } from "lucide-react";

export default function Home() {
    const user = useSelector((state: RootState) => state.user);

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket: Socket = io("http://localhost:3001", {
            transports: ["polling"],
            reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
            console.log(`✅ متصل شد: ${socket.id}`);
            setIsConnected(true);
        });

        socket.on("connect_error", (error) => {
            console.error(`❌ خطا در اتصال: ${error.message}`);
            setIsConnected(false);
        });

        socket.on("disconnect", () => {
            console.log("⚠️ قطع شد");
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <>
            {/* نوار بالا (Breadcrumb) */}
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10 flex justify-between items-center">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/MainPage", icon: <HomeIcon className="w-4 h-4" /> },
                        { label: "فهرست کلاس های من", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />

                {/* نشانگر وضعیت در نوار بالا */}
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                    <span className={`text-xs font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}>
                        {isConnected ? "متصل هستید" : "قطع هستید"}
                    </span>
                </div>
            </div>

            {/* محتوای اصلی */}
            <div className="bg-white m-1 py-0 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2 p-3">
                    {/* اینجا محتوای کلاس‌ها قرار می‌گیرد */}
                    <p className="text-gray-500 text-center mt-10">لیست کلاس‌های شما در اینجا نمایش داده می‌شود...</p>
                </div>
            </div>
        </>
    );
}