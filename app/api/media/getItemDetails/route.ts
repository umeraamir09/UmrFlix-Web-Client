import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import roundRating from "@/lib/roundRating";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const urlParams = new URL(req.url).searchParams;
    const itemId = urlParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'itemId parameter is required' }, { status: 400 });
    }

    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Items/${itemId}?Fields=ProviderIds,ExternalUrls`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[JELLYFIN ERROR]', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch media from Jellyfin' }, { status: 500 });
    }

    const jellyfinData = await res.json();
    console.log('[GET_ITEM_DETAILS] Fetched item:', jellyfinData.Name || 'Unknown');

    // Normalize response
    const item = {
      Id: jellyfinData.Id,
      Name: jellyfinData.Name,
      Type: jellyfinData.Type,
      AgeRating: jellyfinData.OfficialRating,
      Rating: roundRating(jellyfinData.CommunityRating || 0),
      ReleaseYear: jellyfinData.ProductionYear,
      Overview: jellyfinData.Overview,
      Duration: formatRuntimeTicks(jellyfinData.RunTimeTicks || 0),
      ImageUrl: createJellyfinImageUrl(jellyfinData.Id, 'Primary', auth.jellyfinToken),
      BackdropUrl: (jellyfinData.BackdropImageTags && jellyfinData.BackdropImageTags.length > 0)
        ? createJellyfinImageUrl(jellyfinData.Id, 'Backdrop', auth.jellyfinToken, jellyfinData.BackdropImageTags[0])
        : null,
      LogoUrl: (jellyfinData.ImageTags && jellyfinData.ImageTags.Logo)
        ? createJellyfinImageUrl(jellyfinData.Id, 'Logo', auth.jellyfinToken, jellyfinData.ImageTags.Logo)
        : null,
      Genres: jellyfinData.Genres || [],
      Studios: jellyfinData.Studios || [],
      People: jellyfinData.People || [],
      CommunityRating: jellyfinData.CommunityRating,
      CriticRating: jellyfinData.CriticRating,
      ImdbRating: jellyfinData.CommunityRating || null,
      ImdbId: jellyfinData.ProviderIds?.Imdb || null,
      Taglines: jellyfinData.Taglines || [],
      RunTimeTicks: jellyfinData.RunTimeTicks
    };

    console.log('[GET_ITEM_DETAILS] Success for item:', item.Name);

    return NextResponse.json({ item });

  } catch (err) {
    console.error('[GET_ITEM_DETAILS] Error:', err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
