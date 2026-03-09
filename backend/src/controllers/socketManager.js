import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED");

        socket.on("join-call", (path) => {
            if (!connections[path]) connections[path] = [];

            const existingUsers = [...connections[path]];

            connections[path].push(socket.id);

            // notify existing users
            existingUsers.forEach((id) => {
                io.to(id).emit("user-joined", socket.id);
            });

            // send existing users to joiner
            io.to(socket.id).emit("existing-users", existingUsers);
        });
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                },
                ["", false]
            );

            if (found) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    sender,
                    data,
                    "socket-id-sender": socket.id,
                });

                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            for (const [roomKey, sockets] of Object.entries(connections)) {
                if (sockets.includes(socket.id)) {
                    sockets.forEach((id) => {
                        io.to(id).emit("user-left", socket.id);
                    });

                    connections[roomKey] = sockets.filter((id) => id !== socket.id);

                    if (connections[roomKey].length === 0) {
                        delete connections[roomKey];
                    }
                }
            }
        });
    });

    return io;
};
