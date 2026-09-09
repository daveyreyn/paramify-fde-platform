'use client';

import dynamic from 'next/dynamic';

// WebGL + model fetch are browser-only; the placeholder mirrors the old
// brand square so the layout doesn't jump while the canvas loads.
const GlassLogoCanvas = dynamic(() => import('./glass-logo-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center font-mono text-lg font-bold text-primary">
      {'>_'}
    </div>
  ),
});

export function GlassLogo({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <GlassLogoCanvas />
    </div>
  );
}
