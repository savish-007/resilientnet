
let io;

const initializeSocket = (server) => {
    const { Server } = require("socket.io");

    const allowedOrigins = (
        process.env.FRONTEND_URL ||
        "http://localhost:5173,http://localhost:5174"
    )
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: false
        }
    });

    io.on("connection", (socket) => {
        console.log("Client Connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("Client Disconnected:", socket.id);
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};
