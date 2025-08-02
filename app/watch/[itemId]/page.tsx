// app/watch/[itemId]/page.tsx
import WatchPageClient from './WatchPageClient';

interface PageProps {
  params: {
    itemId: string;
  };
}

// Server Component - handles the route params
export default async function WatchPage({ params }: PageProps) {
  const {itemId} = await params; 
  return (
    <WatchPageClient 
      itemId={itemId} 
      serverUrl="https://watch.umroo.art" 
    />
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { itemId } = await params;
  return {
    title: `Watch - ${itemId}`,
    description: 'Umrflix Video Player',
  };
}