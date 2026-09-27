"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

// The looping globe behind the hero, with a pause button. The button follows the video's own state,
// so it stays right even when the browser blocks autoplay.
export function HeroVideo() {
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
        poster="/hero-globe.jpg"
        aria-hidden
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 -z-10 size-full object-cover motion-safe:animate-in fade-in duration-1000"
      >
        {/* No source matches under reduced motion, so the poster (a still of the globe) shows instead. */}
        <source src="/hero-globe.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
      </video>
      {/* bottom-20 clears the product preview, which overlaps the hero by 4rem. Nothing plays under reduced motion, so no button. */}
      <Button
        variant="outline"
        size="icon-lg"
        aria-label={playing ? "Pause background video" : "Play background video"}
        onClick={() => (video.current?.paused ? video.current.play() : video.current?.pause())}
        className="absolute right-4 bottom-20 rounded-full motion-reduce:hidden sm:right-6"
      >
        {playing ? <Pause /> : <Play />}
      </Button>
    </>
  )
}
