import { NextResponse } from "next/server";

const R2_MOVIES_BASE =
  process.env.NEXT_PUBLIC_MOVIES_R2_BASE ??
  "https://pub-7ee8d6bed6ce4d1fac1f930f6fcea457.r2.dev";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const url = `${R2_MOVIES_BASE}/movies/${encodeURIComponent(id)}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Movie videos not found from R2:", response.status);
      return NextResponse.json({ videos: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching movie videos from R2:", error);
    return NextResponse.json({ videos: [] });
  }
}
