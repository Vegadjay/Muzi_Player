"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { PlayCircle, Share2 } from 'lucide-react';

export function RoomCreation() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const createRoom = async () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    await set(ref(database, `rooms/${newRoomId}`), {
      videoId: '',
      isPlaying: false,
      currentTime: 0,
      lastUpdate: Date.now(),
    });
    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Button
            onClick={createRoom}
            className="w-full"
            size="lg"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Create New Room
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Join existing
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
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