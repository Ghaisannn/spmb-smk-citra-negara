import { adminOnly, unauthorized } from "@/lib/admin-guard";
import { buatTemplate } from "@/lib/soal-import";

export const runtime = "nodejs";

export async function GET() {
  if (!(await adminOnly())) return unauthorized();

  const file = await buatTemplate();
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-bank-soal.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}