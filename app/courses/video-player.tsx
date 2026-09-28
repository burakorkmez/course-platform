"use client"

import "@imagekit/video-player/styles.css"
import { useEffect, useEffectEvent, useRef } from "react"
import type { Player } from "@imagekit/video-player"
import { saveProgress, signLessonUrl } from "./actions"

type Lesson = { courseSlug: string; lessonSlug: string; resumeAt: number; done: boolean; track: boolean }

// ImageKit's video player (Video.js underneath), filling its positioned parent.
// Without `lesson` it plays a public file (the course trailer). With `lesson` the file is private: every URL the
// player loads is signed through the server, and signed-in viewers' progress is saved.
// Video.js deletes its element when disposed, so each mount creates a fresh one rather than rendering a React <video>:
// that keeps it working through StrictMode's double mount in dev.
export function VideoPlayer({ imagekitId, src, poster, lesson }: { imagekitId: string; src: string; poster?: string; lesson?: Lesson }) {
  const box = useRef<HTMLDivElement>(null)
  const lastSave = useRef(0)
  const autoCompleted = useRef(false)
  const isPrivate = !!lesson

  const sign = useEffectEvent((url: string) => signLessonUrl(lesson!.courseSlug, lesson!.lessonSlug, url))

  // Saves the position every 15s and on pause, and completes the lesson once 90% of it has played.
  // ponytail: no save on pagehide, so up to 15s can be lost when a tab closes mid-video.
  const report = useEffectEvent((player: Player, force: boolean) => {
    if (!lesson?.track) return
    const time = player.currentTime() ?? 0
    const duration = player.duration() ?? 0
    const finish = !lesson.done && !autoCompleted.current && duration > 0 && time / duration >= 0.9
    if (finish) autoCompleted.current = true
    if (!force && !finish && Date.now() - lastSave.current < 15_000) return
    lastSave.current = Date.now()
    // A failed completion is retried on the next timeupdate; a failed position save just waits for the next one.
    saveProgress(lesson.courseSlug, lesson.lessonSlug, { positionS: time, ...(finish && { completed: true }) }).catch(() => {
      if (finish) autoCompleted.current = false
    })
  })

  // Picks up where the viewer stopped, unless they'd finished the lesson or stopped in its last seconds.
  const resume = useEffectEvent((player: Player) => {
    const duration = player.duration() ?? 0
    if (lesson && !lesson.done && lesson.resumeAt > 5 && lesson.resumeAt < duration - 10) player.currentTime(lesson.resumeAt)
  })

  useEffect(() => {
    const el = document.createElement("video-js")
    box.current?.append(el)
    let player: Player | undefined
    let disposed = false

    // Loaded on demand: it's a large bundle and only runs in the browser.
    import("@imagekit/video-player").then(({ videoPlayer }) => {
      if (disposed) return
      const p = videoPlayer(
        el,
        { imagekitId, ...(isPrivate && { signerFn: (url: string) => sign(url) }) },
        { controls: true, fill: true, preload: "metadata", playbackRates: [1, 1.25, 1.5, 2] }
      )
      p.one("loadedmetadata", () => resume(p))
      p.on("timeupdate", () => report(p, false))
      p.on("pause", () => report(p, true))
      // Without a poster, ImageKit generates one from the video.
      p.src({ src, ...(poster && { poster: { src: poster } }) })
      player = p
    })

    return () => {
      disposed = true
      if (player) player.dispose()
      else el.remove()
    }
  }, [imagekitId, src, poster, isPrivate])

  // The player takes its accent from --color-accent; this makes it the brand periwinkle.
  return <div ref={box} className="absolute inset-0 [&_.video-js]:[--color-accent:var(--primary)]" />
}
