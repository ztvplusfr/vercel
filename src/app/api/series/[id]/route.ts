import { NextResponse } from "next/server";

const R2_BASE =
  process.env.NEXT_PUBLIC_MOVIES_R2_BASE ??
  "https://pub-7ee8d6bed6ce4d1fac1f930f6fcea457.r2.dev";

interface EpisodeVideo {
  url: string;
  lang: string;
  quality: string;
  pub: number;
  server?: string;
  hasAds?: boolean;
}

type EpisodeTree = Record<string, Record<string, EpisodeVideo[]>>;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    let allVideos: EpisodeVideo[] = [];

    // Récupérer depuis R2 (source existante)
    try {
      const r2Url = `${R2_BASE}/series/${encodeURIComponent(id)}.json`;
      const r2Response = await fetch(r2Url);
      
      if (r2Response.ok) {
        const data = (await r2Response.json()) as EpisodeTree;
        
        if (season && episode && data[season] && data[season][episode]) {
          const r2Videos = data[season][episode];
          allVideos.push(...r2Videos.map((video: EpisodeVideo) => ({
            ...video,
            server: video.server || 'R2',
            hasAds: false
          })));
        }
      }
    } catch (e) {
      console.error("Error fetching from R2:", e);
    }

    // Récupérer depuis FStream
    if (season && episode) {
      try {
        const fstreamUrl = `https://api.movix.club/api/fstream/series/${id}/${season}/${episode}`;
        const fstreamResponse = await fetch(fstreamUrl);
        
        if (fstreamResponse.ok) {
          const fstreamData = await fstreamResponse.json();
          if (fstreamData.players) {
            // Parcourir les différentes langues disponibles
            Object.entries(fstreamData.players).forEach(([lang, players]: [string, any]) => {
              if (Array.isArray(players)) {
                players.forEach((player: any) => {
                  if (player.url) {
                    allVideos.push({
                      url: player.url,
                      lang: lang === 'VFF' ? 'FR' : lang === 'VOSTFR' ? 'VOSTFR' : 'FR',
                      quality: player.quality || 'HD',
                      pub: 0,
                      server: `FStream - ${player.player}`,
                      hasAds: true
                    });
                  }
                });
              }
            });
          }
        }
      } catch (e) {
        console.error("Error fetching from FStream:", e);
      }
    }

    // Récupérer depuis Wiflix
    if (season && episode) {
      try {
        const wiflixUrl = `https://api.movix.club/api/wiflix/series/${id}/${season}/${episode}`;
        const wiflixResponse = await fetch(wiflixUrl);
        
        if (wiflixResponse.ok) {
          const wiflixData = await wiflixResponse.json();
          if (wiflixData.url) {
            allVideos.push({
              url: wiflixData.url,
              lang: wiflixData.lang || 'FR',
              quality: wiflixData.quality || 'HD',
              pub: wiflixData.pub || 0,
              server: 'Wiflix',
              hasAds: true
            });
          }
        }
      } catch (e) {
        console.error("Error fetching from Wiflix:", e);
      }
    }

    // Trier les vidéos : d'abord celles sans pubs, puis celles avec pubs
    allVideos.sort((a, b) => {
      if (a.hasAds === b.hasAds) return 0;
      return a.hasAds ? 1 : -1;
    });

    return NextResponse.json({ videos: allVideos });
  } catch (error) {
    console.error("Error fetching series videos:", error);
    return NextResponse.json({ videos: [] });
  }
}
