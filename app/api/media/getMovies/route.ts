import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import roundRating from "@/lib/roundRating";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET() {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    console.log('[GET_MOVIES] Starting request for user:', auth.userId);
    
    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Users/${auth.userId}/Items?IncludeItemTypes=Movie&SortBy=SortName&Recursive=true&Fields=PrimaryImageAspectRatio,Overview,Path,CommunityRating,RunTimeTicks,OfficialRating,ProductionYear`;
    
    console.log('[GET_MOVIES] Fetching from Jellyfin URL:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[GET_MOVIES] Request timeout after 30 seconds');
      controller.abort();
    }, 30000); // 30 second timeout
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[GET_MOVIES] Jellyfin API error:', {
        status: res.status,
        statusText: res.statusText,
        url: url,
        error: errorText
      });
      
      if (res.status === 401) {
        return NextResponse.json({ error: 'Authentication failed with Jellyfin server' }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: `Jellyfin server error: ${res.status} ${res.statusText}`,
        details: errorText 
      }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_MOVIES] Fetched', jellyfinData.Items?.length || 0, 'movies from Jellyfin');

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

    console.log('[GET_MOVIES] Success. Movie count:', items.length);

    return NextResponse.json({ items });

  } catch (err) {
    console.error('[GET_MOVIES] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
