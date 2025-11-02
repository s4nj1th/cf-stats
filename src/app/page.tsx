"use client";

import { useState, useRef } from "react";

type Nullable<T> = T | null | undefined;

function parseUsername(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : null;
    }
    return trimmed;
  } catch (e) {
    return null;
  }
}

export default function Page() {
  const [input, setInput] = useState<string>("");
  const [username, setUsername] = useState<Nullable<string>>(null);
  const [error, setError] = useState<Nullable<string>>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const loadProfile = (): void => {
    setError(null);
    setCopied(false);
    const parsed = parseUsername(input);
    if (!parsed) {
      setError("Enter a valid username or Codeforces profile URL.");
      setUsername(null);
      return;
    }
    setUsername(parsed);
  };

  const iframeSrc = username
    ? `/profile/${encodeURIComponent(username)}`
    : undefined;

  const copyUrl = async () => {
    if (!username) return;
    const url = `${window.location.origin}/profile/${encodeURIComponent(
      username
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <main className="p-5 max-w-2xl mx-auto min-h-screen">
      <img src="/logo.png" alt="Logo" width={128} className="mx-auto" />
      <h1 className="text-2xl font-semibold mb-8 text-center">
        Codeforces Stats
      </h1>

      <div className="mb-3">
        <div className="flex gap-2 mt-2">
          <input
            id="cf-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadProfile();
              }
            }}
            placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
            className="flex-1 px-3 py-2 border-1 border-[#8888] focus:border-white focus:ring-none focus:outline-none rounded-md"
          />
          <button
            onClick={loadProfile}
            className={`px-3 py-2 rounded-md transition-colors group cursor-pointer ${
              input.trim()
                ? "bg-white text-black hover:bg-[#eee]"
                : "bg-[#8888] text-[#eee8] hover:bg-[#9998]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-5 stroke-2 fill-none stroke-current"
            >
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                className="translate-x-3 group-hover:translate-x-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"
              />
              <polyline
                points="12 5 19 12 12 19"
                className="-translate-x-1 group-hover:translate-x-0 transition-transform duration-300 ease-in-out"
              />
            </svg>
          </button>
        </div>
        {error && <div className="text-[#e88] mt-2 text-center">{error}</div>}
      </div>

      <section className="text-center mt-12">
        {username && (
          <>
            <div className="border border-[#8888] bg-black rounded-md inline-block">
              <iframe
                ref={iframeRef}
                title={`Codeforces profile ${username}`}
                src={iframeSrc}
                className="w-[520px] h-[350px] mx-auto"
              />
            </div>

            <div className="mt-4 gap-4 flex justify-center">
              <a
                className="px-2 py-1 rounded-md text-sm transition bg-transparent text-[#ccc] hover:bg-[#111] cursor-pointer border-2 border-[#111]"
                href={`https://codeforces.com/profile/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Profile
              </a>
              <button
                onClick={copyUrl}
                className={`px-2 py-1 rounded-md text-sm transition cursor-pointer ${
                  copied
                    ? "bg-[#9998] text-white hover:bg-[#8888]"
                    : "bg-white text-black hover:bg-[#eee]"
                }`}
              >
                {copied ? "Copied!" : "Copy Stats URL"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
