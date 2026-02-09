import { createServer } from "http";
import { Server } from "socket.io";

interface JoinRoomPayload {
    roomId: string;
    userId: string;
    role: 'teacher' | 'student';
    FullName?: string;
}

interface SignalPayload {
    senderId: string;
    targetSocketId: string;
    signal: any;
}

interface SharePayload {
    roomId: string;
    userId: string;
}

interface RoomUser {
    userId: string;
    socketId: string;
    role: 'teacher' | 'student';
    FullName?: string;
}

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms: Record<string, RoomUser[]> = {};

io.on("connection", (socket: any) => {
    console.log(`کاربر متصل شد: ${socket.id}`);

    socket.on("join-room", ({ roomId, userId, role, FullName }: JoinRoomPayload) => {
        console.log(`کاربر ${userId} (${FullName}) به اتاق پیوست`);

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // ذخیره کاربر جدید
        rooms[roomId].push({
            userId,
            socketId: socket.id,
            role,
            FullName: FullName || ""
        });

        socket.join(roomId);

        // اطلاع به بقیه
        socket.to(roomId).emit("user-connected", {
            userId,
            role,
            FullName: FullName || ""
        });

        // ارسال لیست کاربران موجود به کاربر جدید
        const otherUsers = rooms[roomId].filter(u => u.socketId !== socket.id);

        // تمیز کردن نام‌های خالی (اگر کاربری قبلا بدون نام وارد شده بود)
        const cleanUsers = otherUsers.map((u) => ({
            userId: u.userId,
            role: u.role,
            FullName: u.FullName && u.FullName.trim() !== "" ? u.FullName : u.userId
        }));

        console.log("ارسال لیست کاربران:", cleanUsers);
        socket.emit("all-users", cleanUsers);
    });

    socket.on("signal", (payload: SignalPayload) => {
        io.to(payload.targetSocketId).emit("signal", {
            senderId: payload.senderId,
            signal: payload.signal,
        });
    });

    socket.on("start-screen-share", ({ roomId, userId }: SharePayload) => {
        socket.to(roomId).emit("user-started-sharing", { userId });
    });

    socket.on("stop-screen-share", ({ roomId, userId }: SharePayload) => {
        socket.to(roomId).emit("user-stopped-sharing", { userId });
    });

    socket.on("disconnecting", () => {
        const roomsJoined = socket.rooms;
        for (const room of roomsJoined) {
            if (room !== socket.id) {
                socket.to(room).emit("user-disconnected", socket.id);
                if (rooms[room]) {
                    rooms[room] = rooms[room].filter(u => u.socketId !== socket.id);
                }
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`کاربر قطع شد: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`سرور سیگنالینگ روی پورت ${PORT} در حال اجراست`);
});