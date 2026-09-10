import { PrismaClient } from "@prisma/client";

// Evită epuizarea conexiunilor în dezvoltare (hot-reload creează instanțe noi
// de client la fiecare modificare de fișier fără acest cache global).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
