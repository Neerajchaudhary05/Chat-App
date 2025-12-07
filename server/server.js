import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';


//Create an express app and an HTTP server

const app = express();
const server = http.createServer(app);

//initialize socket.io server
export const io = new Server(server, {
    cors: { origin: '*' }
})

// socket auth middleware: validate token from `auth` (preferred) or query
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token || null;
        if (!token) return next(new Error('Authentication error: token missing'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded.userId;
        if (!userId) return next(new Error('Authentication error: invalid token payload'));

        socket.userId = userId;
        return next();
    } catch (err) {
        console.log('Socket auth error', err.message);
        return next(new Error('Authentication error'));
    }
});

//store online users
export const userSocketMap = {}; //{userId:socketId}

//socket.io connection handler

io.on("connection", (socket) => {
    const socketId = socket.id;
    const userId = socket.userId || socket.handshake.query.userId || null;

    console.log(`Socket connected: ${socketId} (userId: ${userId})`);

    if (userId) {
        userSocketMap[userId] = socketId;
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socketId} (userId: ${userId}) - reason: ${reason}`);

        // If userId was provided, remove it. Otherwise find by socket id.
        if (userId && userSocketMap[userId] === socketId) {
            delete userSocketMap[userId];
        } else {
            const disconnectedUserId = Object.keys(userSocketMap).find(u => userSocketMap[u] === socketId);
            if (disconnectedUserId) {
                delete userSocketMap[disconnectedUserId];
            }
        }

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
})


//Middleware
app.use(express.json({ limit: '4mb' }));
app.use(cors());


//Routes
app.use("/api/status", (req, res) => {
    res.send("Server is running");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)


//connect to database
await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});