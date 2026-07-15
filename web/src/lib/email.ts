import { prisma } from "./prisma";
import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("0123456789", 6);

export async function createEmailCode(email: string): Promise<string> {
  await prisma.emailCode.deleteMany({
    where: { email, used: false },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.emailCode.create({
    data: { email, code, expiresAt },
  });

  return code;
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<boolean> {
  const record = await prisma.emailCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.emailCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  console.log(`[Email] Sending code ${code} to ${email}`);

  // TODO: Integrate with SMTP (nodemailer) when SMTP is configured
  // For now, just log the code for development
}
