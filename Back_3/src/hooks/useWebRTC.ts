"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

type Role = "teacher" | "student";

interface UseWebRTCProps {
    socket: Socket | null;
    roomId: string;
    userId: string;
    role: Role;
    fullName?: string;
}

type PeerEntry = {
    pc: RTCPeerConnection;
    userId: string;
    socketId: string;
};

type UserInfo = {
    userId: string;
    role: Role;
    FullName?: string;
};

export const useWebRTC = ({ socket, roomId, userId, role, fullName }: UseWebRTCProps) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Record<string, MediaStream>>({});
    const [usersList, setUsersList] = useState<UserInfo[]>([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const peersRef = useRef<Record<string, PeerEntry>>({});
    const userToSocketRef = useRef<Record<string, string>>({});
    const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);

    const servers: RTCConfiguration = {
        iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }],
    };

    const createPeerConnection = useCallback(
        async (targetUserId: string, targetSocketId: string, isInitiator: boolean) => {
            if (!socket) return;
            if (peersRef.current[targetUserId]) return;

            const pc = new RTCPeerConnection(servers);
            userToSocketRef.current[targetUserId] = targetSocketId;

            pc.onicecandidate = (event) => {
                if (!event.candidate) return;
                socket.emit("signal", {
                    roomId,
                    targetSocketId,
                    senderUserId: userId,
                    senderSocketId: socket.id,
                    signal: { type: "candidate", candidate: event.candidate },
                });
            };

            pc.ontrack = (event) => {
                const remoteStream = event.streams?.[0];
                if (!remoteStream) return;
                setPeers((prev) => ({ ...prev, [targetUserId]: remoteStream }));
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
                    const entry = peersRef.current[targetUserId];
                    if (entry) {
                        entry.pc.close();
                        delete peersRef.current[targetUserId];
                        setPeers((prev) => {
                            const next = { ...prev };
                            delete next[targetUserId];
                            return next;
                        });
                    }
                }
            };

            peersRef.current[targetUserId] = { pc, userId: targetUserId, socketId: targetSocketId };

            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("signal", {
                        roomId,
                        targetSocketId,
                        senderUserId: userId,
                        senderSocketId: socket.id,
                        signal: offer,
                    });
                } catch (e) {
                    console.error("Error creating offer:", e);
                }
            }
        },
        [socket, roomId, userId]
    );


    useEffect(() => {
        if (!socket) return;

        console.log("🚀 آماده ارسال به سرور:", { roomId, userId, role, FullName: fullName });

        socket.emit("join-room", { roomId, userId, role, FullName: fullName });


        // ارسال FullName به سرور هنگام پیوستن
        socket.emit("join-room", { roomId, userId, role, FullName: fullName });

        const onAllUsers = async (users: any[]) => {
            console.log("داده‌های دریافت شده در all-users:", users);

            const otherUsers = users.filter((u) => u.userId !== userId);

            const formattedUsers = otherUsers.map((u) => ({
                userId: u.userId,
                role: u.role,
                // ✅ اصلاحیه نهایی: اگر FullName undefined بود، بنویس "بدون نام"
                FullName: u.FullName || "بدون نام"
            }));

            setUsersList(formattedUsers);

            for (const u of otherUsers) {
                if (u.socketId) {
                    await createPeerConnection(u.userId, u.socketId, true);
                }
            }
        };

        const onUserConnected = async (u: any) => {
            if (u.userId === userId) return;

            setUsersList((prev) => [...prev, {
                userId: u.userId,
                role: u.role,
                FullName: u.FullName // ✅ اصلاح شده: استفاده مستقیم از دریافتی
            }]);

            await createPeerConnection(u.userId, u.socketId, true);
        };

        const onSignal = async (payload: any) => {
            const { senderUserId, senderSocketId, signal } = payload;
            if (senderUserId === userId) return;

            if (!peersRef.current[senderUserId]) {
                await createPeerConnection(senderUserId, senderSocketId, false);
            }

            const entry = peersRef.current[senderUserId];
            if (!entry) return;

            const pc = entry.pc;

            if (signal?.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("signal", {
                    roomId,
                    targetSocketId: senderSocketId,
                    senderUserId: userId,
                    senderSocketId: socket.id,
                    signal: answer,
                });
            } else if (signal?.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal?.type === "candidate") {
                try {
                    if (signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (e) {
                    console.warn("addIceCandidate failed:", e);
                }
            }
        };

        const onUserDisconnected = (payload: { userId: string }) => {
            setUsersList((prev) => prev.filter((u) => u.userId !== payload.userId));
            const entry = peersRef.current[payload.userId];
            if (entry) {
                entry.pc.close();
                delete peersRef.current[payload.userId];
                setPeers((prev) => {
                    const next = { ...prev };
                    delete next[payload.userId];
                    return next;
                });
            }
        };

        socket.on("all-users", onAllUsers);
        socket.on("user-connected", onUserConnected);
        socket.on("signal", onSignal);
        socket.on("user-disconnected", onUserDisconnected);

        return () => {
            socket.off("all-users", onAllUsers);
            socket.off("user-connected", onUserConnected);
            socket.off("signal", onSignal);
            socket.off("user-disconnected", onUserDisconnected);
            Object.values(peersRef.current).forEach(({ pc }) => pc.close());
            peersRef.current = {};
        };
    }, [socket, roomId, userId, role, fullName, createPeerConnection]);

    // Screen Share functions
    const startScreenShare = async () => {
        try {
            if (!socket) return;
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            if (!screenTrack) return;

            currentVideoTrackRef.current = screenTrack;
            setLocalStream(screenStream);
            setIsScreenSharing(true);

            Object.values(peersRef.current).forEach(({ pc }) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    pc.addTrack(screenTrack, screenStream);
                } else {
                    pc.addTrack(screenTrack, screenStream);
                }
            });

            socket.emit("start-screen-share", { roomId, userId });

            screenTrack.onended = () => {
                stopScreenShare();
            };

        } catch (err) {
            console.error("Error sharing screen:", err);
            alert("خطا در اشتراک‌گذاری صفحه: " + (err as Error).message);
        }
    };

    const stopScreenShare = async () => {
        try {
            if (localStream) {
                localStream.getTracks().forEach(t => t.stop());
            }

            Object.values(peersRef.current).forEach(({ pc }) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    pc.removeTrack(sender);
                }
            });

            setLocalStream(null);
            currentVideoTrackRef.current = null;
            setIsScreenSharing(false);

            socket?.emit("stop-screen-share", { roomId, userId });
        } catch (err) {
            console.error("Error stopping screen share:", err);
        }
    };

    return {
        localStream,
        peers,
        usersList,
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
    };
};