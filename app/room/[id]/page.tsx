"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { database } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Copy, Loader2 } from "lucide-react";
import ReactPlayer from "react-player";
import toast from "react-hot-toast";
import { debounce } from "lodash";

export const dynamic = "force-dynamic";

interface RoomData {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdate: number;
  host: boolean;
}

export default function Room() {
  const { id } = useParams();
  const [videoUrl, setVideoUrl] = useState("");
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const playerRef = useRef<ReactPlayer>(null);
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setIsHost(localStorage.getItem("isHost") === "true");
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && isMounted) {
        if (JSON.stringify(data) !== JSON.stringify(roomData)) {
          setRoomData(data);

          if (data.lastUpdate !== lastUpdateRef.current && playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentTime - data.currentTime);

            if (timeDiff > 2) {
              playerRef.current.seekTo(data.currentTime, "seconds");
            }
            lastUpdateRef.current = data.lastUpdate;
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, isMounted, roomData]);

  const updateRoomState = useCallback(async (updates: Partial<RoomData>) => {
    if (!id || !isHost || isUpdatingRef.current) return;

    try {
      isUpdatingRef.current = true;
      const roomRef = ref(database, `rooms/${id}`);
      const now = Date.now();

      await set(roomRef, {
        ...roomData,
        ...updates,
        lastUpdate: now
      });

      lastUpdateRef.current = now;
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update room state");
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    }
  }, [id, roomData, isHost]);

  const handlePlayPause = useCallback(async () => {
    if (!isHost) {
      toast.error("Only the host can control playback");
      return;
    }

    if (isUpdatingRef.current) return;

    await updateRoomState({ isPlaying: !roomData?.isPlaying });
  }, [roomData?.isPlaying, updateRoomState, isHost]);

  const handleProgress = useCallback(
    debounce(({ playedSeconds }: { playedSeconds: number }) => {
      if (roomData?.isPlaying && isHost && isVisible) {
        updateRoomState({ currentTime: playedSeconds });
      }
    }, 2000),
    [roomData?.isPlaying, updateRoomState, isHost, isVisible]
  );

  const handleVideoSubmit = async () => {
    if (!isHost) {
      toast.error("Only the host can change the video");
      return;
    }

    try {
      const videoId = getYouTubeId(videoUrl);
      if (!videoId) {
        toast.error("Invalid YouTube URL");
        return;
      }

      await updateRoomState({
        videoId,
        currentTime: 0,
        isPlaying: false
      });
      setVideoUrl("");
      toast.success("Video loaded successfully!");
    } catch (error) {
      console.error("Video load error:", error);
      toast.error("Failed to load video");
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied!");
  };

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Room: {id}</h1>
              <p className="text-sm text-muted-foreground">
                {isHost ? "You are the host" : "View only mode"}
              </p>
            </div>
            <Button variant="outline" onClick={copyRoomLink}>
              <Copy className="h-4 w-4 mr-2" /> Copy Room Link
            </Button>
          </div>

          {isHost && (
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter YouTube URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVideoSubmit()}
              />
              <Button onClick={handleVideoSubmit}>Load Video</Button>
            </div>
          )}

          {roomData?.videoId && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${roomData.videoId}`}
                  width="100%"
                  height="100%"
                  playing={roomData.isPlaying && isVisible}
                  controls={isHost}
                  onPlay={() => {
                    if (!isUpdatingRef.current && !roomData.isPlaying && isHost) {
                      handlePlayPause();
                    }
                  }}
                  onPause={() => {
                    if (!isUpdatingRef.current && roomData.isPlaying && isHost) {
                      handlePlayPause();
                    }
                  }}
                  onProgress={handleProgress}
                  onError={(error) => console.error("Player error:", error)}
                  config={{
                    youtube: {
                      playerVars: {
                        playsinline: 1,
                        modestbranding: 1,
                        origin: typeof window !== 'undefined' ? window.location.origin : '',
                        enablejsapi: 1,
                        rel: 0,
                        controls: isHost ? 1 : 0
                      }
                    }
                  }}
                />
              </div>
              {isHost && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant={roomData.isPlaying ? "outline" : "default"}
                    onClick={handlePlayPause}
                    disabled={isUpdatingRef.current}
                  >
                    {roomData.isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Play
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}