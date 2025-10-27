import { prisma } from "../config/prisma";

export const chatService = {
  // Отримати чат за name_profile користувача
  async getChatByProfileName(
    currentUserId: string,
    otherUserProfileName: string
  ) {
    // Отримуємо поточного користувача
    const currentUser = await prisma.user.findUnique({
      where: { googleId: currentUserId },
      select: { id: true, name_profile: true },
    });
    console.log(currentUser);

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Отримуємо іншого користувача за name_profile
    const otherUser = await prisma.user.findUnique({
      where: { name_profile: otherUserProfileName },
      select: { id: true, name_profile: true, googleId: true },
    });

    if (!otherUser) {
      throw new Error("Contact not found");
    }

    // Шукаємо існуючий чат
    console.log("чат десь тут");
    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [currentUserId, otherUser.googleId] },
          },
        },
      },
      include: {
        participants: true,
        messages: true,
      },
    });

    if (existingChat && existingChat.participants.length === 2) {
      return existingChat; // Чат вже існує
    }
    // let chat = await prisma.privateChat.findUnique({
    //   where: {
    //     participant1Id_participant2Id: {
    //       participant1Id: userId1,
    //       participant2Id: userId2,
    //     },
    //   },
    //   include: {
    //     participant1: {
    //       select: {
    //         id: true,
    //         name_profile: true,
    //         avatar: true,
    //         name: true,
    //       },
    //     },
    //     participant2: {
    //       select: {
    //         id: true,
    //         name_profile: true,
    //         avatar: true,
    //         name: true,
    //       },
    //     },
    //     messages: {
    //       orderBy: { createdAt: "asc" },
    //       take: 50,
    //       include: {
    //         author: {
    //           select: {
    //             id: true,
    //             name_profile: true,
    //             avatar: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });
    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUser.googleId }],
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return chat;
  },

  // Отримати всі чати користувача
  async getUserChats(googleId: string) {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: googleId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                googleId: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Останнє повідомлення
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return chats;
  },

  // Отримати повідомлення чату
  async getChatMessages(chatId: number, limit = 50, offset = 0) {
    return await prisma.message.findMany({
      where: { chatId },
      include: {
        author: {
          select: {
            id: true,
            name_profile: true,
            avatar: true,
            googleId: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    });
  },

  // Створити повідомлення
  async sendMessage(chatId: string, senderId: string, content: string) {
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
    });

    // Оновлюємо час останньої активності чату
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  },

  // Позначити повідомлення як прочитане
  async markMessageAsRead(messageId: number) {
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  // Видалити чат
  async deleteChat(chatId: number) {
    await prisma.message.deleteMany({ where: { chatId } });
    return await prisma.privateChat.delete({ where: { id: chatId } });
  },
};
