'use client';

import dynamic from 'next/dynamic';

// Dynamically import StagewiseToolbar with SSR disabled
const StagewiseToolbar = dynamic(
  () => import('@stagewise/toolbar-next').then((mod) => mod.StagewiseToolbar),
  { ssr: false }
);

export default function StagewiseToolbarWrapper() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <StagewiseToolbar />
  );
}
