import { NextResponse } from "next/server";

const R2_BASE =
  process.env.NEXT_PUBLIC_MOVIES_R2_BASE ??
  "https://pub-7ee8d6bed6ce4d1fac1f930f6fcea457.r2.dev";

interface EpisodeVideo {
  url: string;
  lang: string;
  quality: string;
  pub: number;
}

type EpisodeTree = Record<string, Record<string, EpisodeVideo[]>>;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const url = `${R2_BASE}/series/${encodeURIComponent(id)}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Series videos not found from R2:", response.status);
      // On renvoie simplement une liste vide pour éviter de casser la page
      return NextResponse.json({ videos: [] });
    }

    const data = (await response.json()) as EpisodeTree;

    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");

    let videos: EpisodeVideo[] = [];

    if (season && episode && data[season] && data[season][episode]) {
      videos = data[season][episode];
    }

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching series videos from R2:", error);
    // En cas de problème réseau, on renvoie une liste vide plutôt qu'une 500
    return NextResponse.json({ videos: [] });
  }
}
