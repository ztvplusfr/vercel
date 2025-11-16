import { NextResponse } from "next/server";

const R2_MOVIES_BASE =
  process.env.NEXT_PUBLIC_MOVIES_R2_BASE ??
  "https://pub-7ee8d6bed6ce4d1fac1f930f6fcea457.r2.dev";

interface VideoSource {
  url: string;
  server: string;
  quality?: string;
  hasAds?: boolean;
  lang?: string;
  pub?: number;
}

interface MovieApiResponse {
  videos?: VideoSource[];
  [key: string]: any;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Récupérer les vidéos depuis les 3 sources en parallèle
    const [r2Response, fstreamResponse, wiflixResponse] = await Promise.allSettled([
      fetch(`${R2_MOVIES_BASE}/movies/${encodeURIComponent(id)}.json`),
      fetch(`https://api.movix.club/api/fstream/movie/${id}`),
      fetch(`https://api.movix.club/api/wiflix/movie/${id}`)
    ]);

    const allVideos: VideoSource[] = [];

    // Traiter la réponse R2 (source existante)
    if (r2Response.status === 'fulfilled' && r2Response.value.ok) {
      try {
        const r2Data = await r2Response.value.json();
        if (r2Data.videos && Array.isArray(r2Data.videos)) {
          allVideos.push(...r2Data.videos.map((video: any) => ({
            ...video,
            server: video.server || 'R2',
            hasAds: false
          })));
        }
      } catch (e) {
        console.error("Error parsing R2 response:", e);
      }
    }

    // Traiter la réponse FStream
    if (fstreamResponse.status === 'fulfilled' && fstreamResponse.value.ok) {
      try {
        const fstreamData = await fstreamResponse.value.json();
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
                    hasAds: true // FStream peut contenir des pubs
                  });
                }
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing FStream response:", e);
      }
    }

    // Traiter la réponse Wiflix
    if (wiflixResponse.status === 'fulfilled' && wiflixResponse.value.ok) {
      try {
        const wiflixData = await wiflixResponse.value.json();
        if (wiflixData.url) {
          allVideos.push({
            url: wiflixData.url,
            server: 'Wiflix',
            quality: wiflixData.quality,
            hasAds: true // Wiflix peut contenir des pubs
          });
        }
      } catch (e) {
        console.error("Error parsing Wiflix response:", e);
      }
    }

    // Trier les vidéos : d'abord celles sans pubs, puis celles avec pubs
    allVideos.sort((a, b) => {
      if (a.hasAds === b.hasAds) return 0;
      return a.hasAds ? 1 : -1;
    });

    return NextResponse.json({ videos: allVideos });
  } catch (error) {
    console.error("Error fetching movie videos:", error);
    return NextResponse.json({ videos: [] });
  }
}
