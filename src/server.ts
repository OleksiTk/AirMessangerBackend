import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// import userRouter from "./user.js";
import path from "path";
import { fileURLToPath } from "url";
// import prisma from "./db.js";
import { Server } from "socket.io";
import { createServer } from "http";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import { chatSocketHandler } from "./sockets/chatSocket.js";
import { contactSocket } from "./sockets/contactSocket.js";
import chatRoutes from "./routes/chat.routes.js";
// import userRoutes from './routes/users.routes';
// import postRoutes from './routes/posts.routes';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ ВАЖЛИВО: Middleware ДО створення серверів
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
// app.use("/create", userRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
// app.use('/api/posts', postRoutes);

const httpServer = createServer(app);

// ✅ Підключаємо Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ✅ Socket.IO обробник
chatSocketHandler(io);
contactSocket(io);
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  process.exit(0);
});

// ✅ Створюємо HTTP сервер з Express app
// const httpServer = createServer(app);

// // ✅ Підключаємо Socket.IO до HTTP сервера
// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"],
// });

// // Socket.IO обробники
// io.on("connection", (socket) => {
//   console.log(`✅ User connected: ${socket.id}`);

//   // Відправка повідомлення
//   socket.on("send_message", async (data) => {
//     try {
//       console.log("📩 Received message:", data);

//       const message = await prisma.chat.create({
//         data: {
//           content: data.content,
//           username: data.username,
//           socketId: socket.id,
//           id_user: data.id_user || 1, // Додайте якщо потрібно
//         },
//       });

//       console.log("💾 Message saved:", message);

//       // ✅ ВАЖЛИВО: Відправляємо всім клієнтам у правильному форматі
//       const formattedMessage = {
//         id_chat: message.id_chat,
//         id: message.id_chat, // Дублюємо для сумісності
//         content: message.content,
//         text: message.content, // Дублюємо для сумісності
//         username: message.username,
//         from: message.username, // Дублюємо для сумісності
//         createdAt: message.createdAt,
//         time: new Date(message.createdAt).toLocaleTimeString("uk-UA", {
//           hour: "2-digit",
//           minute: "2-digit",
//         }),
//         isRead: true,
//       };

//       // Broadcast до ВСІХ клієнтів (включно з відправником)
//       io.emit("receive_message", formattedMessage);
//       console.log("📤 Message broadcasted to all clients");
//     } catch (error) {
//       console.error("❌ Error saving message:", error);
//       socket.emit("error", { message: "Failed to send message" });
//     }
//   });

//   // Користувач друкує
//   socket.on("typing", (data) => {
//     socket.broadcast.emit("user_typing", {
//       username: data.username,
//       isTyping: data.isTyping,
//     });
//   });

//   // Відключення
//   socket.on("disconnect", () => {
//     console.log(`❌ User disconnected: ${socket.id}`);
//     io.emit("user_disconnected", { socketId: socket.id });
//   });
// });

// // ✅ КРИТИЧНО: Запускаємо httpServer замість app
// const PORT = process.env.PORT || 3000;

// httpServer.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📡 Socket.IO ready`);
// });

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   console.log("\n🛑 Shutting down gracefully...");
//   await prisma.$disconnect();
//   process.exit(0);
// });
