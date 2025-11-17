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
          // Перевірка, що є рівно 2 учасники
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
                last_name: true,
                avatar: true,
                name_profile: true,
              },
            }, // Додайте це, щоб отримати дані користувача
          },
        },
        messages: {
          include: {
            files: true,
            emojis: true,
          },
        },
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
  async getGroupsChats(name_groups: string, googleId: string) {
    const currentUser = await prisma.user.findUnique({
      where: { googleId },
      select: { id: true, name_profile: true },
    });
    console.log(currentUser);

    if (!currentUser) {
      throw new Error("User not found");
    }
    // отримуємо чат

    const takeChats = await prisma.chatParticipant.findFirst({
      where: {
        userId: googleId,
        chat: {
          name: name_groups,
          isGroup: true,
        },
      },
      include: {
        chat: {
          include: {
            messages: {
              include: {
                files: true,
                emojis: true,
              },
            },
            participants: {
              include: {
                user: { select: { name: true, last_name: true, avatar: true } }, // Додайте це, щоб отримати дані користувача
              },
            },
          },
        },
      },
    });

    return takeChats;
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
  async creatGroups(avatar: string, name_groups: string, googleId: string) {
    try {
      // Перевірка, чи існує користувач
      const userExists = await prisma.user.findUnique({
        where: { googleId: googleId },
      });

      if (!userExists) {
        throw new Error(`User with googleId ${googleId} not found`);
      }

      // Створюємо чат і учасника в одній транзакції
      const result = await prisma.$transaction(async (tx: any) => {
        // Створюємо груповий чат
        const createGroups = await tx.chat.create({
          data: {
            createrGroups: googleId,
            avatar,
            name: name_groups,
            isGroup: true,
          },
        });

        // Додаємо користувача як учасника
        const addMainPeopleToChats = await tx.chatParticipant.create({
          data: {
            userId: googleId,
            chatId: createGroups.id,
          },
        });

        return { chat: createGroups, participant: addMainPeopleToChats };
      });

      console.log("Чат створено успішно:", result);
      return {
        success: true,
        chatId: result.chat.id,
        message: "Group created successfully",
      };
    } catch (error) {
      console.error("Помилка при створенні групи:", error);
      throw error;
    }
  },
  async addToGroupsContacts(name_profile: string, googleId: string) {
    try {
      // Перевірка, чи існує користувач
      const userExists = await prisma.user.findUnique({
        where: { googleId: googleId },
      });

      if (!userExists) {
        throw new Error(`User with googleId ${googleId} not found`);
      }

      const result = await prisma.chatParticipant.findFirst({
        where: {
          userId: googleId,
          chat: {
            isGroup: true, // Тільки групові чати
          },
        },
        orderBy: {
          joinedAt: "desc", // Останній чат зверху
        },
        include: {
          chat: true, // Включаємо дані чату
        },
      });

      console.log("his name profile", name_profile);

      const findUserFromName = await prisma.user.findUnique({
        where: { name_profile },
      });
      console.log(findUserFromName.googleId);
      console.log(result.chatId);

      const addToParticipiant = await prisma.chatParticipant.create({
        data: {
          chatId: result.chatId,
          userId: findUserFromName.googleId,
        },
      });
      console.log("Чат створено успішно:", result, addToParticipiant);
      return {
        success: true,
        chatId: result.chat.id,
        message: "Group created successfully",
      };
    } catch (error) {
      console.error("Помилка при створенні групи:", error);
      throw error;
    }
  },
  async getGroups(googleId: string) {
    try {
      // Перевірка, чи існує користувач
      const userExists = await prisma.user.findUnique({
        where: { googleId: googleId },
      });

      if (!userExists) {
        throw new Error(`User with googleId ${googleId} not found`);
      }

      const result = await prisma.chatParticipant.findMany({
        where: {
          userId: googleId,
          chat: {
            isGroup: true, // Тільки групові чати
          },
        },
        include: {
          chat: true, // Включаємо дані чату
        },
      });
      if (!result) {
        return {
          message: "Dont have groups",
        };
      }
      return {
        success: true,
        result,
        message: "Group get",
      };
    } catch (error) {
      console.error("Помилка при створенні групи:", error);
      throw error;
    }
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
