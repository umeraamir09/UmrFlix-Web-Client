import { NextResponse } from "next/server";
import { requireAuth, createJellyfinHeaders } from "@/lib/apiAuth";

export async function POST() {
    try {
        const auth = await requireAuth()
        const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
        const url = `${jellyfinUrl}/Library/Refresh`;

        const res = await fetch(url, {
            method: 'POST',
            headers: createJellyfinHeaders(auth.jellyfinToken),
        });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to Refresh' }, { status: 500 });
    }

    return NextResponse.json({"message": "Success"}, {status: 200})

    } catch (err) {
    console.error('[GET_ALL_MEDIA] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
}