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

    // Переконаємось, що userIds завжди в одному порядку
    const [userId1, userId2] =
      currentUser.id < otherUser.id
        ? [currentUser.id, otherUser.id]
        : [otherUser.id, currentUser.id];

    // Шукаємо існуючий чат
    console.log("чат десь тут");

    let chat = await prisma.privateChat.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: userId1,
          participant2Id: userId2,
        },
      },
      include: {
        participant1: {
          select: {
            id: true,
            name_profile: true,
            avatar: true,
            name: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name_profile: true,
            avatar: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
          include: {
            author: {
              select: {
                id: true,
                name_profile: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Якщо чату немає - створюємо
    if (!chat) {
      console.log("ЧАТА НЕМВА");

      chat = await prisma.privateChat.create({
        data: {
          participant1Id: userId1,
          participant2Id: userId2,
        },
        include: {
          participant1: {
            select: {
              id: true,
              name_profile: true,
              avatar: true,
              name: true,
            },
          },
          participant2: {
            select: {
              id: true,
              name_profile: true,
              avatar: true,
              name: true,
            },
          },
          messages: true,
        },
      });
    }

    return chat;
  },

  // Отримати всі чати користувача
  async getUserChats(googleId: string) {
    const user = await prisma.user.findUnique({
      where: { googleId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const chats = await prisma.privateChat.findMany({
      where: {
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }],
      },
      include: {
        participant1: {
          select: {
            id: true,
            name_profile: true,
            avatar: true,
            name: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name_profile: true,
            avatar: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            author: {
              select: {
                name_profile: true,
              },
            },
          },
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
  async createMessage(chatId: number, authorGoogleId: string, content: string) {
    return await prisma.message.create({
      data: {
        chatId,
        authorGoogleId,
        content,
      },
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
    });
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
