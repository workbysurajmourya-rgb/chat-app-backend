import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { CustomSocket } from "../types/socket";
import { pool } from "../config/db";

const onlineUsers = new Map<number, string>();

export const initializeSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket: CustomSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      socket.user = decoded;

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: CustomSocket) => {
    onlineUsers.set(socket.user.id, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    socket.on("get_online_users", () => {
      socket.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message } = data;

        const newMessage = await pool.query(
          `
          INSERT INTO messages
          (sender_id, receiver_id, message)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [socket.user.id, receiverId, message]
        );

        const savedMessage = newMessage.rows[0];
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", savedMessage);
        }

        socket.emit("receive_message", savedMessage);
      } catch (error) {
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.user.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};