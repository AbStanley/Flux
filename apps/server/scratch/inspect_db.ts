
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const words = await prisma.word.findMany({
    select: {
      sourceLanguage: true,
      targetLanguage: true,
      userId: true,
      type: true
    }
  });
  console.log(JSON.stringify(words, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
