import { config } from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Muat environment dari .env.local
config({ path: ".env.local" });

async function createUser() {
  const nama = process.argv[2];
  const email = process.argv[3]?.trim().toLowerCase();
  const role = process.argv[4];
  const password = process.env.INITIAL_USER_PASSWORD;

  if (
    !nama ||
    !email ||
    !["admin", "kepsek"].includes(role ?? "") ||
    !password ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "Isi nama, email, role (admin/kepsek), dan INITIAL_USER_PASSWORD minimal 8 karakter."
    );
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME,
  });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)`,
      [nama, email, hashedPassword, role]
    );

    console.log(`Akun ${role} berhasil dibuat: ${email}`);
  } finally {
    await pool.end();
  }
}

createUser().catch((error) => {
  console.error("Gagal membuat akun:", error.message);
  process.exitCode = 1;
});