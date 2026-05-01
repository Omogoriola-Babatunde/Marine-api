import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;

let prisma;

export const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL || "file:./dev.db",
      }),
    });
  }
  return prisma;
};

export const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
