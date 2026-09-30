import { cn } from "@/lib/utils"

// A muted, looping scene (public/<name>.mp4, poster public/<name>.jpg) behind a section.
export function HeroVideo({ name, className }: { name: string; className?: string }) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      poster={`/${name}.jpg`}
      aria-hidden
      className={cn("absolute inset-0 -z-10 size-full object-cover motion-safe:animate-in fade-in duration-1000", className)}
    >
      {/* No source matches under reduced motion, so the poster (a still of the scene) shows instead. */}
      <source src={`/${name}.mp4`} type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
    </video>
  )
}
