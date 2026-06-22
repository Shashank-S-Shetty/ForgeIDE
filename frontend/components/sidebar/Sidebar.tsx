"use client";

import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="flex items-center justify-center px-8 py-6 flex-shrink-0">
      {/* Logo only — click to go to lobby */}
      <button
        onClick={() => router.push("/dashboard")}
        className="text-5xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:opacity-80 transition-opacity"
        title="Go to lobby"
      >
        CA
      </button>
    </aside>
  );
}
