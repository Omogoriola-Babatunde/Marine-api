import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db',
  }),
});

try {
  const q = await prisma.quote.create({
    data: {
      cargoType: 'electronics',
      cargoValue: 1000,
      origin: 'A',
      destination: 'B',
      premium: 5,
    },
  });
  console.log(q);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
