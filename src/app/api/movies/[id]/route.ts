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

    // Récupérer depuis Wiflix
    try {
      const wiflixUrl = `https://api.movix.club/api/wiflix/movie/${id}`;
      const wiflixResponse = await fetch(wiflixUrl);

      if (wiflixResponse.ok) {
        const wiflixData = await wiflixResponse.json();
        if (wiflixData.players) {
          // Parcourir les différentes langues disponibles (vf en premier, puis vostfr)
          const languages = ['vf', 'vostfr'];
          languages.forEach(lang => {
            if (wiflixData.players[lang]) {
              wiflixData.players[lang].forEach((player: any) => {
                if (player.url) {
                  allVideos.push({
                    url: player.url,
                    lang: lang === 'vf' ? 'FR' : 'VOSTFR',
                    quality: 'HD',
                    pub: 0,
                    server: `Wiflix - ${player.name}`,
                    hasAds: true // Wiflix peut contenir des pubs
                  });
                }
              });
            }
          });
        }
      }
    } catch (e) {
      console.error("Error fetching from Wiflix:", e);
    }

    // Trier les vidéos : d'abord celles sans pubs, puis celles avec pubs, et en priorité FR/VF
    allVideos.sort((a, b) => {
      // D'abord trier par présence de pubs
      if (a.hasAds !== b.hasAds) {
        return a.hasAds ? 1 : -1;
      }
      
      // Ensuite trier par langue (FR/VF en premier)
      const langPriority = { 'FR': 0, 'VF': 0, 'VOSTFR': 1 };
      const aLangPriority = langPriority[a.lang as keyof typeof langPriority] ?? 2;
      const bLangPriority = langPriority[b.lang as keyof typeof langPriority] ?? 2;
      
      if (aLangPriority !== bLangPriority) {
        return aLangPriority - bLangPriority;
      }
      
      return 0;
    });

    return NextResponse.json({ videos: allVideos });
  } catch (error) {
    console.error("Error fetching movie videos:", error);
    return NextResponse.json({ videos: [] });
  }
}
