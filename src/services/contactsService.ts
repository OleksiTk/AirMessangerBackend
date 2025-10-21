import { prisma } from "../config/prisma.js";

export const contactsService = {
  async addContacts(name_profile: string, userId: string) {
    const checkIfItsDontYou = await prisma.user.findUnique({
      where: { googleId: userId },
      select: { name_profile: true },
    });
    if (checkIfItsDontYou.name_profile == name_profile) {
      throw new Error("Dont add You");
    }
    const addContact = await prisma.contacts.create({
      data: {
        name_profile,
        userId,
      },
    });
    const findNameProfileMy = await prisma.user.findUnique({
      where: { googleId: userId },
      select: { name_profile: true },
    });

    if (!findNameProfileMy) {
      throw new Error("User not found");
    }

    // Знаходимо googleId користувача, який має такий name_profile
    const findUserId = await prisma.user.findUnique({
      where: { name_profile },
      select: { googleId: true },
    });

    if (!findUserId) {
      throw new Error("User with given name_profile not found");
    }

    // Додаємо контакт для іншого користувача
    const addContactsForAnother = await prisma.contacts.create({
      data: {
        name_profile: findNameProfileMy.name_profile,
        userId: findUserId.googleId,
      },
    });

    console.log(addContactsForAnother);

    return addContact;
  },
  async getContacts(userId: string) {
    const contactProfiles = await prisma.contacts.findMany({
      where: { userId },
      select: { name_profile: true },
    });

    // 2. Дістаємо список name_profile (googleId користувачів-контактів)
    const profileIds = contactProfiles.map((c: any) => c.name_profile);

    // 3. Отримуємо дані користувачів по name_profile (googleId)
    const users = await prisma.user.findMany({
      where: {
        name_profile: {
          in: profileIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        name_profile: true,
      },
    });

    return users;
  },
  deletContacts() {},
};
