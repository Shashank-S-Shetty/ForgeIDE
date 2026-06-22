"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { useTheme } from "@/lib/ThemeContext";
import { executeCode } from "@/lib/piston";
import Navbar from "@/components/navbar/Navbar";
import EditorPanel from "@/components/editor/EditorPanel";
import CollaborationPanel from "@/components/collaboration/CollaborationPanel";
import TerminalPanel, { TerminalLine } from "@/components/terminal/TerminalPanel";

// EditorPanel will expose this via ref
export interface EditorRef {
  getActiveFile: () => { fileName: string; code: string };
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomId =
    typeof params.room === "string"
      ? params.room
      : Array.isArray(params.room)
      ? params.room[0]
      : "";

  // Validate room ID format (must be CA-XXXX with 4 alphanumeric chars)
  const isValidRoomId = /^CA-[A-Z0-9]{4}$/i.test(roomId);

  const [userName, setUserName] = useState("Anonymous");
  const [outputLines, setOutputLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");

  const editorRef = useRef<EditorRef | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("codearena-username");
    if (saved) setUserName(saved);
  }, []);

  // Redirect to dashboard if invalid room ID
  useEffect(() => {
    if (roomId && !isValidRoomId) {
      alert(`Invalid room ID: ${roomId}\n\nRoom IDs must be in the format CA-XXXX (e.g., CA-A3F9)`);
      router.push("/dashboard");
    }
  }, [roomId, isValidRoomId, router]);

  useEffect(() => {
    if (!roomId || !isValidRoomId) return;

    const joinRoom = () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-room", { roomId, userName });
      console.log(`Joined room: ${roomId} as ${userName}`);
    };

    if (!socket.connected) {
      socket.connect();
    }

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.disconnect();
    };
  }, [roomId, userName]);

  const handleRun = async () => {
    if (!editorRef.current || isRunning) return;

    const { fileName, code } = editorRef.current.getActiveFile();

    if (!code.trim()) {
      setOutputLines([
        { type: "error", text: "Error: No code to execute. Write some code first." },
      ]);
      return;
    }

    setIsRunning(true);
    setOutputLines([
      { type: "info", text: `▶ Running ${fileName}...` },
    ]);

    try {
      const result = await executeCode(fileName, code, stdin);

      const lines: TerminalLine[] = [
        { type: "info", text: `▶ Executed ${fileName}` },
      ];

      if (result.output) {
        lines.push({ type: "output", text: result.output.trim() });
      }

      if (result.error) {
        lines.push({ type: "error", text: result.error.trim() });
      }

      if (result.exitCode === 0) {
        lines.push({ type: "success", text: `✓ Process exited with code 0` });
      } else {
        lines.push({ type: "error", text: `✗ Process exited with code ${result.exitCode}` });
      }

      setOutputLines(lines);
    } catch (err: unknown) {
      setOutputLines([
        { type: "error", text: `Execution failed: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTerminalCommand = async (
    command: string,
    addLines: (lines: TerminalLine[]) => void,
    terminalStdin: string
  ) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Parse common run commands: python3 main.py, node app.js, etc.
    const runPatterns = [
      { regex: /^python3?\s+(\S+)/, ext: ".py" },
      { regex: /^node\s+(\S+)/, ext: ".js" },
      { regex: /^ts-node\s+(\S+)/, ext: ".ts" },
      { regex: /^java\s+(\S+)/, ext: ".java" },
    ];

    let fileName: string | null = null;

    for (const { regex } of runPatterns) {
      const match = trimmed.match(regex);
      if (match) {
        fileName = match[1];
        break;
      }
    }

    // Also handle bare filename like "main.py"
    if (!fileName && /\.\w+$/.test(trimmed)) {
      fileName = trimmed;
    }

    if (fileName && editorRef.current) {
      // Find matching file from editor
      const { fileName: activeFile, code } = editorRef.current.getActiveFile();
      const targetFile = fileName === activeFile ? activeFile : fileName;

      addLines([{ type: "info", text: `▶ Running ${targetFile}...` }]);

      try {
        const result = await executeCode(targetFile, code, terminalStdin);
        const lines: TerminalLine[] = [];
        if (result.output) lines.push({ type: "output", text: result.output.trim() });
        if (result.error) lines.push({ type: "error", text: result.error.trim() });
        lines.push({
          type: result.exitCode === 0 ? "success" : "error",
          text: `Process exited with code ${result.exitCode}`,
        });
        addLines(lines);
      } catch (err) {
        addLines([{ type: "error", text: `Failed: ${err instanceof Error ? err.message : String(err)}` }]);
      }
      return;
    }

    // Handle other basic commands
    if (trimmed === "clear") {
      addLines([{ type: "info", text: "__clear__" }]);
      return;
    }

    if (trimmed === "help") {
      addLines([
        { type: "info", text: "Available commands:" },
        { type: "command", text: "  python3 <file>  — Run a Python file" },
        { type: "command", text: "  node <file>     — Run a JavaScript file" },
        { type: "command", text: "  <filename>      — Run the file directly (e.g. main.py)" },
        { type: "command", text: "  clear           — Clear the terminal" },
        { type: "command", text: "  help            — Show this help" },
      ]);
      return;
    }

    addLines([
      { type: "error", text: `Unknown command: ${trimmed}` },
      { type: "info", text: `Type "help" to see available commands.` },
    ]);
  };

  const { isDark } = useTheme();

  return (
    <main className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0F172A] text-white" : "bg-gray-100 text-gray-900"
    }`}>
      <Navbar roomId={roomId} userName={userName} onRun={handleRun} isRunning={isRunning} />
      <div className={`flex min-h-0 flex-1 gap-6 p-6 overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-[#0F172A] to-[#020617]"
          : "bg-gradient-to-br from-gray-100 to-gray-200"
      }`}>
        <EditorPanel roomId={roomId} ref={editorRef} />
        <CollaborationPanel />
      </div>
      <TerminalPanel
        outputLines={outputLines}
        onCommand={handleTerminalCommand}
        onStdinChange={setStdin}
      />
    </main>
  );
}
