import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#8888] mt-8 py-6">
      <div className="max-w-4xl mx-auto px-4 text-sm text-center text-[#ccc]">
        <div>Made with ❤️ &#8212; Sanjith Muralikrishnan</div>
        <div className="mt-2">
          <a
            href="https://github.com/s4nj1th/cf-stats"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#ddd]"
          >
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
