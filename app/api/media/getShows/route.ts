import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import roundRating from "@/lib/roundRating";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET() {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Users/${auth.userId}/Items?IncludeItemTypes=Series&SortBy=SortName&Recursive=true&Fields=PrimaryImageAspectRatio,Overview,Path,CommunityRating,RunTimeTicks,OfficialRating,ProductionYear`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch shows from Jellyfin' }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_SHOWS] Fetched', jellyfinData.Items?.length || 0, 'shows from Jellyfin');

    // Normalize response
    const items = jellyfinData.Items?.map((item: any) => ({
      Id: item.Id,
      Name: item.Name,
      Type: item.Type,
      AgeRating: item.OfficialRating,
      Rating: roundRating(item.CommunityRating),
      ReleaseYear: item.ProductionYear,
      Overview: item.Overview,
      Duration: formatRuntimeTicks(item.RunTimeTicks),
      ImageUrl: createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken)
    })) || [];

    console.log('[GET_SHOWS] Success. Show count:', items.length);

    return NextResponse.json({ items });

  } catch (err) {
    console.error('[GET_SHOWS] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
