import { NextResponse } from "next/server";
import { requireAuth, createJellyfinHeaders } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const urlParams = new URL(req.url).searchParams;
    const seriesId = urlParams.get('seriesId');
    
    if (!seriesId) {
      return NextResponse.json({ error: 'seriesId parameter is required' }, { status: 400 });
    }

    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Shows/${seriesId}/Seasons`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch seasons from Jellyfin' }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_SEASONS] Fetched seasons for series:', seriesId);

    // Normalize response
    const seasons = jellyfinData.Items?.map((season: any) => ({
      Id: season.Id,
      Name: season.Name,
      IndexNumber: season.IndexNumber,
      ChildCount: season.ChildCount,
      ProductionYear: season.ProductionYear,
      Overview: season.Overview
    })) || [];

    return NextResponse.json({ seasons });

  } catch (err) {
    console.error('[GET_SEASONS] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
