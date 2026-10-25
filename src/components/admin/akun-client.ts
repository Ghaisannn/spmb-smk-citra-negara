export async function akunCall(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  query = ""
) {
  const res = await fetch(`/api/admin/akun${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    message: (json.message as string) || (res.ok ? "Berhasil." : "Gagal memproses permintaan."),
  };
}

// 54 karakter tanpa huruf/angka yang mirip (I, l, O, 0, 1).
const ABJAD = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function acakSandi(panjang = 10) {
  const out: string[] = [];
  while (out.length < panjang) {
    const buf = new Uint8Array(panjang * 2);
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < 216 && out.length < panjang) out.push(ABJAD[b % ABJAD.length]);
    }
  }
  return out.join("");
}