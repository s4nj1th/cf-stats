import { NextResponse } from "next/server";

interface CodeforcesUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  contribution?: number;
  friendOfCount?: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  titlePhoto?: string;
}

async function fetchCF<T>(endpoint: string): Promise<T> {
  const res = await fetch(`https://codeforces.com/api/${endpoint}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (data.status !== "OK") throw new Error(data.comment || "CF API error");
  return data.result as T;
}

function generateRatingGraph(ratingData: any[]): string {
  if (!ratingData.length) return "";

  const width = 460;
  const height = 100;

  const bands = [
    { min: 0, max: 1199, color: "#808080" },
    { min: 1200, max: 1399, color: "#008000" },
    { min: 1400, max: 1599, color: "#03a89e" },
    { min: 1600, max: 1899, color: "#0000ff" },
    { min: 1900, max: 2099, color: "#aa00aa" },
    { min: 2100, max: 2399, color: "#ff8c00" },
    { min: 2400, max: 9999, color: "#ff0000" },
  ];

  const minRating = Math.min(...ratingData.map((r) => r.newRating));
  const maxRating = Math.max(...ratingData.map((r) => r.newRating));
  const padding = (maxRating - minRating) * 0.1 || 100;
  const scaleMin = Math.max(0, minRating - padding);
  const scaleMax = maxRating + padding;
  const range = scaleMax - scaleMin || 1;

  const bandRects = bands
    .filter((band) => band.max >= scaleMin && band.min <= scaleMax)
    .map((band) => {
      const yTop =
        height - ((Math.min(band.max, scaleMax) - scaleMin) / range) * height;
      const yBottom =
        height - ((Math.max(band.min, scaleMin) - scaleMin) / range) * height;
      const h = yBottom - yTop;
      return `<rect x="0" y="${yTop.toFixed(
        1
      )}" width="${width}" height="${h.toFixed(1)}" fill="${
        band.color
      }" opacity="0.8"/>`;
    })
    .join("\n");

  const points = ratingData
    .map((r, i) => {
      const x = (i / (ratingData.length - 1)) * width;
      const y = height - ((r.newRating - scaleMin) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const circles = ratingData
    .map((r, i) => {
      const x = (i / (ratingData.length - 1)) * width;
      const y = height - ((r.newRating - scaleMin) / range) * height;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(
        1
      )}" r="1.6" fill="#FFD700"/>`;
    })
    .join("\n");

  return `
    <rect x="0" y="0" width="${width}" height="${height}" fill="#111" rx="4"/>
    ${bandRects}
    <polyline fill="none" stroke="#FFD700" stroke-width="2" points="${points}" />
    ${circles}
  `;
}

function generateHeatmap(submissions: any[]): string {
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;
  const days = new Array(365).fill(0);

  for (const sub of submissions) {
    const daysAgo = Math.floor((now - sub.creationTimeSeconds) / oneDay);
    if (daysAgo >= 0 && daysAgo < 365 && sub.verdict === "OK") {
      days[364 - daysAgo]++;
    }
  }

  const cols = 52;
  const rows = 7;
  const cellSize = 8;
  const gap = 1;
  const width = cols * (cellSize + gap);
  const height = rows * (cellSize + gap);
  const daysTrimmed = days.slice(1);

  const cells = daysTrimmed
    .map((count, i) => {
      const x = (i % cols) * (cellSize + gap);
      const y = Math.floor(i / cols) * (cellSize + gap);
      const intensity = Math.min(count, 4);
      const colorScale = [
        "#161B22",
        "#0E4429",
        "#006D32",
        "#26A641",
        "#39D353",
      ];
      const color = colorScale[intensity];
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="1"/>`;
    })
    .join("\n");

  return `
    <rect x="0" y="0" width="${width}" height="${height}" fill="#111" rx="4"/>
    ${cells}
  `;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  if (!username) {
    return new NextResponse("Missing username", { status: 400 });
  }

  try {
    const [user] = await fetchCF<CodeforcesUser[]>(
      `user.info?handles=${encodeURIComponent(username)}`
    );
    const ratingData = await fetchCF<any[]>(
      `user.rating?handle=${encodeURIComponent(username)}`
    );
    const submissions = await fetchCF<any[]>(
      `user.status?handle=${encodeURIComponent(username)}&from=1&count=1000`
    );

    const ratingGraph = generateRatingGraph(ratingData);
    const heatmap = generateHeatmap(submissions);

    const rank = user.rank || "unrated";
    const rating = user.rating ?? 0;
    const maxRank = user.maxRank || rank;
    const maxRating = user.maxRating ?? rating;
    const titlePhoto = user.titlePhoto?.startsWith("http")
      ? user.titlePhoto
      : `https:${user.titlePhoto || "/s/0/images/no-avatar.jpg"}`;

    const colors: Record<string, string> = {
      newbie: "#a6a6a6",
      pupil: "#00b050",
      specialist: "#66ffcc",
      expert: "#3f04fc",
      "candidate master": "#934bc9",
      master: "#ffc000",
      "international master": "#ffc000",
      grandmaster: "#ff0000",
      "international grandmaster": "#ff0000",
      "legendary grandmaster": "#ff0000",
    };
    const rankColor = colors[rank.toLowerCase()] || "#ffffff";
    const maxRankColor = colors[maxRank.toLowerCase()] || "#ffffff";

    const totalWidth = 520;
    const totalHeight = 350;

    const displayName =
      user.firstName || user.lastName
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
        : `@${user.handle}`;

    const handle = user.firstName || user.lastName ? "@" + user.handle : "";

    const svg = `
<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
  <rect width="${totalWidth}" height="${totalHeight}" rx="10" fill="#000"/>
  <style>
    .text { font-family: sans-serif; fill: #ffffff; }
  </style>

  <!-- User Info -->
  <text x="20" y="35" font-size="22" font-weight="bold" fill="white">${displayName}</text>
  <text x="20" y="60" font-size="16" fill="${rankColor}">${handle}</text>
  <text x="20" y="82" font-size="14" fill="#fff">Rank: <tspan fill="${rankColor}">${rank}</tspan></text>
  <text x="20" y="102" font-size="14" fill="#fff">Rating: ${rating} | Max: <tspan fill="${maxRankColor}">${maxRank}</tspan> (${maxRating})</text>

  <!-- Avatar -->
  <image href="${titlePhoto}" x="400" y="20" width="90" height="90"/>
  <rect x="400" y="20" width="90" height="90" fill="none" stroke="#fff" stroke-width="2"/>

  <!-- Rating Graph -->
  <g transform="translate(30, 135)">
    <text x="-10" y="-8" class="text" font-size="12" opacity="0.7">Rating History</text>
    ${ratingGraph}
  </g>
  <rect x="30" y="135" width="460" height="100" fill="none" stroke="#fff" stroke-width="2"/>

  <!-- Heatmap -->
  <g transform="translate(30, 265)">
    <text x="-10" y="-8" class="text" font-size="12" opacity="0.7">Last Year Activity</text>
    ${heatmap}
  </g>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("CF Badge Error:", err);
    return new NextResponse("User not found or API error", { status: 404 });
  }
}
