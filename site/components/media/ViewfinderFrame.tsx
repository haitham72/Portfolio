/** Decorative camera-viewfinder corner brackets — reinforces the film/reel motif. */
export default function ViewfinderFrame({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-4 sm:inset-6 ${className ?? ""}`} aria-hidden>
      <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-text-alt/30" />
      <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-text-alt/30" />
      <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-text-alt/30" />
      <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-text-alt/30" />
    </div>
  );
}
