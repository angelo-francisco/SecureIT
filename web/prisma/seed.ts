import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@secureit.com";
  const adminPassword = "admin123456789";

  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
