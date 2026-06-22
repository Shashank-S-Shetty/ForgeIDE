"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Plus, Play, X, Copy, Mail } from "lucide-react";
import { socket } from "@/lib/socket";
import { useTheme } from "@/lib/ThemeContext";

interface NavbarProps {
  roomId: string;
  userName: string;
  onRun: () => void;
  isRunning: boolean;
}

export default function Navbar({ roomId, userName, onRun, isRunning }: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    setIsConnected(socket.connected);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const roomUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmailInvite = () => {
    const subject = encodeURIComponent("Join my CodeArena session");
    const body = encodeURIComponent(
      `Hey! Join me on CodeArena for real-time collaborative coding.\n\nRoom ID: ${roomId}\nDirect link: ${roomUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const initial = userName ? userName[0].toUpperCase() : "?";

  return (
    <>
      <header className={`flex items-center justify-between flex-shrink-0 h-20 px-8 border-b transition-colors duration-300 backdrop-blur-xl ${
        isDark
          ? "border-[#1E293B] bg-[#0B1120]/70 text-white"
          : "border-gray-200 bg-white/80 text-gray-900"
      }`}>
        {/* Left - Logo + Room info */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="text-4xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            title="Go to lobby"
          >
            CA
          </button>
          
          {/* Room info */}
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Editor Workspace
            </h1>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Room ID: <span className="text-cyan-500 font-mono">{roomId}</span>
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 font-bold text-white transition-all duration-300 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
          >
            {copied ? "Copied!" : "Share Room"}
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className={`flex items-center gap-3 px-5 py-3 transition-all duration-300 border rounded-2xl hover:scale-105 ${
              isDark
                ? "border-[#1E293B] bg-[#111827] text-white hover:bg-[#1F2937]"
                : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Invite Users
            <Plus size={18} />
          </button>

          <button
            onClick={onRun}
            disabled={isRunning}
            className={`flex items-center gap-3 px-8 py-3 font-semibold transition-all duration-300 rounded-2xl ${
              isRunning
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "text-black bg-cyan-500 hover:bg-cyan-400 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
            }`}
          >
            <Play size={18} />
            {isRunning ? "Running..." : "Run"}
          </button>

          {/* Profile */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
            isDark ? "bg-[#111827] border-[#1E293B]" : "bg-gray-100 border-gray-200"
          }`}>
            <div className="flex items-center justify-center w-12 h-12 font-bold rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white">
              {initial}
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {userName}
              </h3>
              <p className="text-sm text-green-500">Status: Online</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex items-center justify-center transition-all duration-300 w-14 h-14 rounded-2xl border ${
              isDark
                ? "bg-[#111827] border-[#1E293B] text-yellow-400 hover:bg-[#1F2937]"
                : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          {/* Connection status */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
            isConnected ? "bg-[#052e16] border-green-900" : "bg-[#1c0a0a] border-red-900"
          }`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className={`font-medium ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-8 transition-colors duration-300 ${
            isDark ? "bg-[#0B1120] border-[#1E293B]" : "bg-white border-gray-200"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Invite Collaborators
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "hover:bg-[#1E293B] text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Room Link */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Share this link
              </label>
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                isDark ? "bg-[#111827] border-[#1E293B]" : "bg-gray-50 border-gray-200"
              }`}>
                <code className={`flex-1 text-sm font-mono truncate ${
                  isDark ? "text-cyan-400" : "text-cyan-600"
                }`}>
                  {roomUrl}
                </code>
                <button
                  onClick={handleCopyLink}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    copied
                      ? "bg-green-500 text-white"
                      : isDark
                      ? "bg-[#1E293B] text-gray-300 hover:bg-[#273449] hover:text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900"
                  }`}
                  title="Copy link"
                >
                  <Copy size={18} />
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-sm text-green-500">✓ Link copied to clipboard!</p>
              )}
            </div>

            {/* Room ID */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Or share the Room ID
              </label>
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                isDark ? "bg-[#111827] border-[#1E293B]" : "bg-gray-50 border-gray-200"
              }`}>
                <code className={`flex-1 text-2xl font-mono font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>
                  {roomId}
                </code>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEmailInvite}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 border ${
                  isDark
                    ? "border-[#1E293B] bg-[#111827] text-white hover:bg-[#1F2937]"
                    : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Mail size={18} />
                Send via Email
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 transition-all duration-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
