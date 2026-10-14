
import { io } from "socket.io-client";
import { API_SERVER_URL } from "../config/apiConfig";

const socket = io(API_SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ["polling", "websocket"]
});

// Connection established
socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);
    console.log(
        "Socket.IO current transport:",
        socket.io.engine.transport.name
    );

    // Detect WebSocket upgrade after the initial connection
    socket.io.engine.once("upgrade", (transport) => {
        console.log(
            "Socket.IO transport upgraded to:",
            transport.name
        );
    });
});

// Connection lost
socket.on("disconnect", (reason) => {
    console.warn("Socket.IO disconnected:", reason);
});

// Connection failure
socket.on("connect_error", (error) => {
    console.error(
        "Socket.IO connection error:",
        error.message
    );
});

// Reconnection attempts
socket.io.on("reconnect_attempt", (attempt) => {
    console.log("Socket.IO reconnect attempt:", attempt);
});

// Reconnection successful
socket.io.on("reconnect", (attempt) => {
    console.log(
        "Socket.IO reconnected after attempts:",
        attempt
    );
});

export default socket;
