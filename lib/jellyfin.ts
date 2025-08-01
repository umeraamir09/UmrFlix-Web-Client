// lib/jellyfin.ts
export async function getUserName(userId: string, token: string) {
  const res = await fetch(`${process.env.JELLYFIN_SRVR_URL}/Users/${userId}`, {
    headers: {
      'X-Emby-Token': token,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await res.json();
  return data.Name;
}
