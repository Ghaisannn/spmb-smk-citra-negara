import { getCurrentSession } from "@/lib/auth";
import { deleteRead, getRingkasNotif, markAllRead, markRead } from "@/lib/notifikasi";

async function siswa() {
  const s = await getCurrentSession();
  return s && s.role === "calon_siswa" ? s : null;
}

const tolak = () => Response.json({ message: "Tidak diizinkan." }, { status: 401 });

export async function GET(request: Request) {
  const s = await siswa();
  if (!s) return tolak();

  const limit = Number(new URL(request.url).searchParams.get("limit")) || 10;
  return Response.json(await getRingkasNotif(s.id, limit), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request) {
  const s = await siswa();
  if (!s) return tolak();

  try {
    const b = await request.json();
    if (b.all === true) {
      await markAllRead(s.id);
      return Response.json({ message: "Semua notifikasi ditandai sudah dibaca." });
    }
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ message: "Notifikasi tidak valid." }, { status: 400 });
    }
    await markRead(s.id, id);
    return Response.json({ message: "Ditandai sudah dibaca." });
  } catch (e) {
    console.error("Notifikasi patch error:", e);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const s = await siswa();
  if (!s) return tolak();

  try {
    if (new URL(request.url).searchParams.get("dibaca") !== "1") {
      return Response.json({ message: "Permintaan tidak valid." }, { status: 400 });
    }
    await deleteRead(s.id);
    return Response.json({ message: "Notifikasi yang sudah dibaca dihapus." });
  } catch (e) {
    console.error("Notifikasi delete error:", e);
    return Response.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}