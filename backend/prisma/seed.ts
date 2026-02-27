const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Define Admin Credentials
  const adminEmail = "tmarket290@gmail.com"; // Change this to your preferred email
  const adminPassword = "Brock...31"; // Change this to a strong password

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // 3. Upsert the Admin User
  // 'upsert' prevents duplicate errors if you run the seed multiple times
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "ADMIN",
      balance: 0,
    },
  });

  console.log("✅ Admin user created/updated successfully:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log("🚀 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });