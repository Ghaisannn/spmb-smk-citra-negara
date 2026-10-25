import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users");
    return Response.json({ status: "Terhubung", rows });
  } catch (error) {
    console.error("DB test error:", error);
    return Response.json(
      { status: "Gagal terhubung ke database" },
      { status: 500 }
    );
  }
}