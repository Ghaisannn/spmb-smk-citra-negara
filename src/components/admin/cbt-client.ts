export async function cbtCall(body: unknown) {
  const res = await fetch("/api/admin/cbt", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    message: (json.message as string) || (res.ok ? "Berhasil." : "Gagal memproses permintaan."),
  };
}