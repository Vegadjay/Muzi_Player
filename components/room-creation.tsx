"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PlayCircle, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export function RoomCreation() {
  const [roomId, setRoomId] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const createRoom = async () => {
    if (!isMounted) return;

    const newRoomId = Math.random().toString(36).substring(2, 8);

    try {
      await set(ref(database, `rooms/${newRoomId}`), {
        videoId: "",
        isPlaying: false,
        currentTime: 0,
        lastUpdate: Date.now(),
        lastPlayingUpdate: Date.now(),
        host: true
      });

      localStorage.setItem("isHost", "true");
      router.push(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room. Please try again.");
    }
  };

  const joinRoom = () => {
    if (!isMounted) return;

    if (roomId.trim()) {
      localStorage.setItem("isHost", "false");
      router.push(`/room/${roomId.trim()}`);
    } else {
      toast.error("Please enter a valid room code.");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6 text-center">
        <Button onClick={createRoom} className="w-full" size="lg">
          <PlayCircle className="mr-2 h-5 w-5" />
          Create New Room
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or Join Existing</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && joinRoom()}
          />
          <Button onClick={joinRoom} variant="secondary">
            <Share2 className="mr-2 h-4 w-4" />
            Join
          </Button>
        </div>
      </div>
    </Card>
  );
}