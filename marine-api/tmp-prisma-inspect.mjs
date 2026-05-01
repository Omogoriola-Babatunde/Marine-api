import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: 'file:./dev.db',
  }),
});

console.log(Object.keys(prisma));
console.log('quote', prisma.quote);
console.log('policy', prisma.policy);
await prisma.$disconnect();
