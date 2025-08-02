import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const urlParams = new URL(req.url).searchParams;
    const seasonId = urlParams.get('seasonId');
    
    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId parameter is required' }, { status: 400 });
    }

    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Items?ParentId=${seasonId}&Fields=Overview,MediaStreams,Path`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch episodes from Jellyfin' }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_EPISODES] Fetched episodes for season:', seasonId);

    // Normalize response
    const episodes = jellyfinData.Items?.map((episode: any) => ({
      Id: episode.Id,
      Name: episode.Name,
      IndexNumber: episode.IndexNumber,
      ParentIndexNumber: episode.ParentIndexNumber,
      Overview: episode.Overview,
      Duration: formatRuntimeTicks(episode.RunTimeTicks || 0),
      RunTimeTicks: episode.RunTimeTicks,
      ImageUrl: createJellyfinImageUrl(episode.Id, 'Primary', auth.jellyfinToken),
      SeriesId: episode.SeriesId,
      SeasonId: episode.SeasonId
    })) || [];

    return NextResponse.json({ episodes });

  } catch (err) {
    console.error('[GET_EPISODES] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
