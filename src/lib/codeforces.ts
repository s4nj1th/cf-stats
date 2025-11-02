export interface CodeforcesUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  contribution?: number;
  friendOfCount?: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  avatar?: string;
}

interface CodeforcesApiResponse {
  status: "OK" | "FAILED";
  result?: CodeforcesUser[];
  comment?: string;
}

export async function getUserData(
  username: string
): Promise<CodeforcesUser | null> {
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(
        username
      )}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;
    const data: CodeforcesApiResponse = await res.json();
    if (data.status === "OK" && data.result && data.result.length > 0) {
      return data.result[0];
    }
    return null;
  } catch {
    return null;
  }
}
