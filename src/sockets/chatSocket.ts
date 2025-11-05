// src/sockets/chatSocket.ts
import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma";
import path from "path";
import fs from "fs";

interface ConnectedUser {
  socketId: string;
  googleId: string;
  name_profile: string;
}

const connectedUsers = new Map<string, ConnectedUser>();

export const chatSocketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // ✅ Користувач приєднується до чату
    socket.on(
      "join_chat",
      async (data: {
        chatId: number;
        googleId: string;
        name_profile: string;
      }) => {
        try {
          const { chatId, googleId, name_profile } = data;

          // Зберігаємо інформацію про користувача
          connectedUsers.set(socket.id, {
            socketId: socket.id,
            googleId,
            name_profile,
          });

          // Приєднуємо до room чату
          socket.join(`chat_${chatId}`);

          console.log(` ${name_profile} joined chat ${chatId}`);

          // Повідомляємо інших, що користувач приєднався
          io.to(`chat_${chatId}`).emit("user_joined", {
            name_profile,
            message: `${name_profile} joined the chat`,
          });
        } catch (error) {
          console.error("Error joining chat:", error);
          socket.emit("error", { message: "Failed to join chat" });
        }
      }
    );

    // ✅ Отримання повідомлення
    socket.on(
      "send_message",
      async (data: {
        chatId: number;
        content: string;
        googleId: string;
        file?: {
          fileUrl: string;
          fileName: string;
          fileType: string;
          fileSize: number;
        };
      }) => {
        try {
          const { chatId, content, googleId, file } = data;
          console.log("інфа з сайта", data);
          console.log("file", file);

          if (!content.trim()) {
            socket.emit("error", { message: "Message cannot be empty" });
            return;
          }
          if (file) {
            const message = await prisma.message.create({
              data: {
                chatId,
                senderId: googleId,
                content: content || "",
                fileUrl: file?.fileUrl || null,
                fileName: file?.fileName || null,
                fileType: file?.fileType || null,
                fileSize: file?.fileSize || null,
              },
            });
            io.to(`chat_${chatId}`).emit("receive_message", {
              id: message.id,
              content: message.content,
              senderId: googleId,
              fileUrl: message.fileUrl,
              fileName: message.fileName,
              fileType: message.fileType,
              // author: message.author,
              // authorGoogleId: message.authorGoogleId,
              // createdAt: message.createdAt,
              // isRead: message.isRead,
            });
          } else {
            const message = await prisma.message.create({
              data: {
                chatId,
                senderId: googleId,
                content,
              },
            });
            io.to(`chat_${chatId}`).emit("receive_message", {
              id: message.id,
              content: message.content,
              senderId: googleId,
              // author: message.author,
              // authorGoogleId: message.authorGoogleId,
              // createdAt: message.createdAt,
              // isRead: message.isRead,
            });
          }
          // Зберігаємо повідомлення в БД

          console.log(`📨 Message saved to chat ${chatId}`);

          // ✅ Відправляємо всім в чаті
        } catch (error) {
          console.error("Error saving message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ✅ Користувач друкує
    socket.on(
      "typing",
      (data: { chatId: number; name_profile: string; isTyping: boolean }) => {
        const { chatId, name_profile, isTyping } = data;

        io.to(`chat_${chatId}`).emit("user_typing", {
          name_profile,
          isTyping,
        });
      }
    );

    // ✅ Позначити повідомлення як прочитане
    socket.on(
      "mark_as_read",
      async (data: { messageId: number; chatId: number }) => {
        try {
          const { messageId, chatId } = data;

          await prisma.message.update({
            where: { id: messageId },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });

          // Повідомляємо всім в чаті
          io.to(`chat_${chatId}`).emit("message_read", { messageId });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      }
    );

    // ✅ Користувач залишає чат
    socket.on(
      "leave_chat",
      (data: { chatId: number; name_profile: string }) => {
        const { chatId, name_profile } = data;

        socket.leave(`chat_${chatId}`);
        connectedUsers.delete(socket.id);

        io.to(`chat_${chatId}`).emit("user_left", {
          name_profile,
          message: `${name_profile} left the chat`,
        });

        console.log(`👋 ${name_profile} left chat ${chatId}`);
      }
    );
    // додає контакт
    socket.on("add_contacts", async (data) => {
      console.log(data);

      // Тут ти робиш якусь обробку даних або додаєш контакт в базу
      // Наприклад, збереження контакту в базу (prisma)

      // Після цього надсилаєш broadcast всім клієнтам, окрім того, хто надіслав запит
      io.emit("contacts_new_add", {
        message: "New contact added",
        contact: data, // Відправляємо дані контакту
      });
    });
    // ✅ Відключення
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`❌ ${user.name_profile} disconnected`);
        connectedUsers.delete(socket.id);
      } else {
        console.log(`❌ User disconnected: ${socket.id}`);
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};
