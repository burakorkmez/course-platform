"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// A looping globe (public/<name>.mp4, poster public/<name>.jpg) behind a section, with a pause button. The button
// follows the video's own state, so it stays right even when the browser blocks autoplay.
export function HeroVideo({ name, className, buttonClassName }: { name: string; className?: string; buttonClassName?: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  // Autoplay usually starts before hydration, so the first play event is missed: read the state once on mount.
  useEffect(() => setPlaying(!video.current?.paused), [])

  return (
    <>
      <video
        ref={video}
        autoPlay
        muted
        loop
        playsInline
        poster={`/${name}.jpg`}
        aria-hidden
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={cn("absolute inset-0 -z-10 size-full object-cover motion-safe:animate-in fade-in duration-1000", className)}
      >
        {/* No source matches under reduced motion, so the poster (a still of the globe) shows instead. */}
        <source src={`/${name}.mp4`} type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
      </video>
      {/* Nothing plays under reduced motion, so no button. */}
      <Button
        variant="outline"
        size="icon-lg"
        aria-label={playing ? "Pause background video" : "Play background video"}
        onClick={() => (video.current?.paused ? video.current.play() : video.current?.pause())}
        className={cn("absolute right-4 bottom-4 rounded-full motion-reduce:hidden sm:right-6", buttonClassName)}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
    </>
  )
}
