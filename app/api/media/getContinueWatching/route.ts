import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET() {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Users/${auth.userId}/Items/Resume`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch continue watching from Jellyfin' }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_CONTINUE_WATCHING] Fetched', jellyfinData.Items?.length || 0, 'items from Jellyfin');
    
    // Normalize response
    const items = await Promise.all((jellyfinData.Items || []).map(async (item: any) => {
      // Safely get image URL - prefer Primary image, fallback to Backdrop
      let imageUrl = null;
      if (item.Id) {
        if (item.Type === 'Episode' && item.SeriesId) {
          // For episodes, check if series has thumb image
          try {
            const seriesUrl = `${jellyfinUrl}/Users/${auth.userId}/Items/${item.SeriesId}`;
            const seriesRes = await fetch(seriesUrl, {
              method: 'GET',
              headers: createJellyfinHeaders(auth.jellyfinToken),
            });
            
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              if (seriesData.ImageTags?.Thumb) {
                imageUrl = createJellyfinImageUrl(item.SeriesId, 'Thumb', auth.jellyfinToken);
              } else {
                // Fallback to episode primary image if series has no thumb
                imageUrl = createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken);
              }
            } else {
              // Fallback to episode primary image if series fetch fails
              imageUrl = createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken);
            }
          } catch (error) {
            console.error('[GET_CONTINUE_WATCHING] Failed to fetch series data:', error);
            // Fallback to episode primary image if error occurs
            imageUrl = createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken);
          }
        } else if (item.Type === 'Movie' && item.Id && item.ImageTags?.Thumb) {
          imageUrl = createJellyfinImageUrl(item.Id, 'Thumb', auth.jellyfinToken);
        } else {
          // For movies and other content, use the item's primary image
          imageUrl = createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken);
        }
      }
      
      return {
        Id: item.Id,
        Name: item.Name,
        Type: item.Type,
        Duration: formatRuntimeTicks(item.RunTimeTicks),
        DurationTicks: item.RunTimeTicks,
        ContinueFrom: item.UserData?.PlaybackPositionTicks || 0,
        PlayCount: item.UserData?.PlayCount || 0,
        ImageUrl: imageUrl,
        SeriesName: item.SeriesName,
        SeasonName: item.SeasonName,
        SeriesId: item.SeriesId,
        SeasonId: item.SeasonId,
        IndexNumber: item.IndexNumber,
        ParentIndexNumber: item.ParentIndexNumber,
        ProductionYear: item.ProductionYear,
        CommunityRating: item.CommunityRating,
        ImageTags: item.ImageTags
      };
    }));

    console.log('[GET_CONTINUE_WATCHING] Success. Item count:');

    return NextResponse.json({ items });

  } catch (err) {
    console.error('[GET_CONTINUE_WATCHING] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
