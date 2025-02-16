import { RoomCreation } from '@/components/room-creation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Play Your Favorites Here
          </h1>
          <RoomCreation />
        </div>
      </main>
    </div>
  );
}