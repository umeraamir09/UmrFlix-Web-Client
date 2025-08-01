import { NextResponse } from "next/server";
import formatRuntimeTicks from "@/lib/formatDuration";
import roundRating from "@/lib/roundRating";
import { requireAuth, createJellyfinHeaders, createJellyfinImageUrl } from "@/lib/apiAuth";

export async function GET() {
  try {
    // Get authenticated user
    const auth = await requireAuth();
    
    const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
    const url = `${jellyfinUrl}/Users/${auth.userId}/Items?IncludeItemTypes=Movie,Series&SortBy=CommunityRating,PlayCount&SortOrder=Descending&Recursive=true&Limit=1&Fields=PrimaryImageAspectRatio,Overview,Path,CommunityRating,RunTimeTicks`;

    const res = await fetch(url, {
      method: "GET",
      headers: createJellyfinHeaders(auth.jellyfinToken),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[POPULAR_ITEM ERROR]", res.status, text);
      return NextResponse.json({ error: "Failed to fetch popular item" }, { status: 500 });
    }

    const data = await res.json();
    const item = data.Items?.[0];

    if (!item) {
      return NextResponse.json({ error: "No items found" }, { status: 404 });
    }

    return NextResponse.json({
      id: item.Id,
      name: item.Name,
      overview: item.Overview,
      type: item.Type,
      rating: roundRating(item.CommunityRating),
      runtimeTicks: formatRuntimeTicks(item.RunTimeTicks),
      image: createJellyfinImageUrl(item.Id, 'Primary', auth.jellyfinToken),
      imageBg: createJellyfinImageUrl(item.Id, 'Backdrop', auth.jellyfinToken),
      imageLogo: createJellyfinImageUrl(item.Id, 'Logo', auth.jellyfinToken),
    });

  } catch (err) {
    console.error("[POPULAR_ITEM ERROR]", err);
    
    // Check if it's an authentication error
    if (err instanceof Error && err.message === 'Authentication required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
