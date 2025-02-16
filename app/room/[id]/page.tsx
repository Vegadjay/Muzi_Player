"use client";

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import ReactPlayer from 'react-player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Play,
  Pause,
  Link as LinkIcon,
  Copy,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface RoomData {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdate: number;
}

export const dynamic = 'force-dynamic';

export default function Room() {
  const { id } = useParams();
  const [videoUrl, setVideoUrl] = useState('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<ReactPlayer>(null);
  const lastUpdateRef = useRef<number>(0);

  const initializeRoom = async () => {
    if (!id) return;

    const roomRef = ref(database, `rooms/${id}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      const initialData: RoomData = {
        videoId: '',
        isPlaying: false,
        currentTime: 0,
        lastUpdate: Date.now()
      };
      await set(roomRef, initialData);
      setRoomData(initialData);
    }
  };

  useEffect(() => {
    if (!id) return;

    initializeRoom();

    const roomRef = ref(database, `rooms/${id}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        // Only seek if update is from another user
        if (data.lastUpdate !== lastUpdateRef.current && playerRef.current) {
          playerRef.current.seekTo(data.currentTime);
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Firebase connection error:', error);
      toast.error('Failed to connect to room');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const updateRoomState = async (updates: Partial<RoomData>) => {
    if (!id) return;

    try {
      const roomRef = ref(database, `rooms/${id}`);
      const snapshot = await get(roomRef);
      const currentData = snapshot.val() || {};

      const newState = {
        ...currentData,
        ...updates,
        lastUpdate: Date.now(),
      };

      lastUpdateRef.current = newState.lastUpdate;
      await set(roomRef, newState);
    } catch (error) {
      console.error('Failed to update room state:', error);
      toast.error('Failed to update room state');
    }
  };

  const handlePlay = () => {
    updateRoomState({ isPlaying: true });
  };

  const handlePause = () => {
    updateRoomState({ isPlaying: false });
  };

  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (roomData?.isPlaying) {
      const now = Date.now();
      if (now - lastUpdateRef.current > 1000) {
        updateRoomState({ currentTime: playedSeconds });
      }
    }
  };

  const handleVideoSubmit = async () => {
    console.log("First pass");

    if (!videoUrl) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    console.log("Video url:", videoUrl);
    console.log("Second pass");

    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
    console.log("Video Id:", videoId);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }

    console.log("Third pass");
    try {
      await updateRoomState({
        videoId,
        currentTime: 0,
        isPlaying: false
      });
      setVideoUrl('');
      toast.success('Video loaded successfully!');
    } catch (error) {
      console.error('Failed to load video:', error);
      toast.error('Failed to load video');
    }
  };

  const copyRoomLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Room link copied! Share this link with others to watch together.');
    } catch (error) {
      console.error('Failed to copy room link:', error);
      toast.error('Failed to copy room link');
    }
  };

  if (isLoading) {
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
            <h1 className="text-2xl font-bold">Room: {id}</h1>
            <Button variant="outline" onClick={copyRoomLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Room Link
            </Button>
          </div>

          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Enter YouTube URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVideoSubmit()}
            />
            <Button onClick={handleVideoSubmit}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Load Video
            </Button>
          </div>

          {roomData?.videoId && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${roomData.videoId}`}
                  width="100%"
                  height="100%"
                  playing={roomData.isPlaying}
                  controls={true}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onProgress={handleProgress}
                />
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant={roomData.isPlaying ? "outline" : "default"}
                  onClick={() => updateRoomState({ isPlaying: !roomData.isPlaying })}
                >
                  {roomData.isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}