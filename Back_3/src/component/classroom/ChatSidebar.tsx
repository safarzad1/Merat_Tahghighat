import React, { useEffect, useRef, useState } from "react"; // useState اضافه شد
import { Send, Image, Paperclip, MessageSquare } from "lucide-react";
import { Socket } from "socket.io-client";

interface Message {
    id: string;
    text: string;
    sender: string;
    isMe: boolean;
}

interface ChatSidebarProps {
    socket: Socket | null;
    roomId: string;
    currentUser: string;
}

export default function ChatSidebar({ socket, roomId, currentUser }: ChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;
        socket.on("chat-message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => { socket.off("chat-message"); };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !socket) return;
        const msgData: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: currentUser,
            isMe: true,
        };
        socket.emit("chat-message", { ...msgData, roomId });
        setMessages((prev) => [...prev, msgData]);
        setInputMessage("");
    };

    return (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-700  flex items-center gap-2">
                <MessageSquare size={18} /> گفتگوی کلاس
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">پیامی وجود ندارد</p>}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                        <span className="text-xs text-gray-400 mb-1">{msg.sender}</span>
                        <div className={`max-w-[90%] p-2 rounded-lg text-sm ${msg.isMe ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                    <button className="p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"><Paperclip size={18} /></button>
                    <button className="p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"><Image size={18} /></button>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white px-2"
                    />
                    <button onClick={handleSendMessage} className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white transition"><Send size={18} /></button>
                </div>
            </div>
        </div>
    );
}