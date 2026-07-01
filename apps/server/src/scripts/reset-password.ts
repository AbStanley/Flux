import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    }),
  );
}

async function main() {
  console.log('\n=============================================');
  console.log('   Flux Admin Tools: Secure Password Reset   ');
  console.log('=============================================\n');

  // Parse arguments
  let email = '';
  let password = '';

  for (const arg of process.argv) {
    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1];
    }
    if (arg.startsWith('--password=')) {
      password = arg.split('=')[1];
    }
  }

  if (!email) {
    email = await askQuestion('Enter User Email: ');
  }
  if (!password) {
    password = await askQuestion('Enter New Password: ');
  }

  if (!email || !password) {
    console.error('\n❌ Error: Both email and password are required.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`\n❌ Error: User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`\n⚙️  Hashing new password for ${email}...`);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    console.log(`💾 Updating database record...`);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(
      `\n✅ Success! Password for "${email}" has been successfully updated.`,
    );
  } catch (err) {
    console.error('\n❌ Error occurred during password reset:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
