import { Server, Socket } from "socket.io";

export const contactSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Contact add: ${socket.id}`);

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

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};
