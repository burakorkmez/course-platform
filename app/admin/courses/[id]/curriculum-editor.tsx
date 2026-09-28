"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { GripVertical, ListVideo, Plus, PlayCircle, Trash2, VideoOff } from "lucide-react"
import { clock, cn, formatDuration } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createLesson, deleteSection, renameSection, reorderLessons, reorderSections } from "../../actions"
import { DeleteButton, SubmitButton } from "../../components"

type Lesson = { id: number; title: string; durationS: number; isPublished: boolean; isFreePreview: boolean; videoPath: string | null }
type Section = { id: number; title: string; lessons: Lesson[] }

function SortableItem({ id, children }: { id: number; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      className={cn(isDragging && "relative z-10 opacity-80")}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      )}
    </li>
  )
}

// One sortable list. Nested lists get their own context, so a lesson can't be dropped among sections.
function SortableList<T extends { id: number }>({
  id,
  items,
  onReorder,
  className,
  render,
}: {
  id: string
  items: T[]
  onReorder: (items: T[]) => void
  className?: string
  render: (item: T, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorder(
      arrayMove(
        items,
        items.findIndex((i) => i.id === active.id),
        items.findIndex((i) => i.id === over.id)
      )
    )
  }
  // `id` keeps dnd-kit's generated aria ids stable between server and client render.
  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(handle) => render(item, handle)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export function CurriculumEditor({ courseId, sections: saved }: { courseId: number; sections: Section[] }) {
  // Local copy so a drop shows instantly; replaced whenever the server sends fresh data.
  const [sections, setSections] = useState(saved)
  const [prev, setPrev] = useState(saved)
  if (saved !== prev) {
    setPrev(saved)
    setSections(saved)
  }

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
        <ListVideo className="size-10 text-primary/60" strokeWidth={1.25} />
        <p className="text-sm text-muted-foreground">No sections yet. Add the first one below, then fill it with lessons.</p>
      </div>
    )
  }

  // Lessons are numbered across the whole course, like the student curriculum.
  const offsets = sections.map((_, i) => sections.slice(0, i).reduce((n, s) => n + s.lessons.length, 0))

  return (
    <SortableList
      id={`sections-${courseId}`}
      items={sections}
      className="flex flex-col gap-4"
      onReorder={(next) => {
        setSections(next)
        reorderSections(
          courseId,
          next.map((s) => s.id)
        )
      }}
      render={(section, handle) => {
        const i = sections.indexOf(section)
        return (
          <div className="rounded-xl border bg-background/40">
            <div className="flex items-center gap-2 border-b py-2 pr-2 pl-2">
              {handle}
              <input
                key={section.title}
                defaultValue={section.title}
                aria-label="Section title"
                className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                onBlur={(e) => {
                  const title = e.target.value.trim()
                  if (!title) e.target.value = section.title
                  else if (title !== section.title) renameSection(section.id, title)
                }}
              />
              <span className="shrink-0 text-xs text-muted-foreground">
                {section.lessons.length} lessons · {formatDuration(section.lessons.reduce((t, l) => t + l.durationS, 0))}
              </span>
              <DeleteButton
                action={deleteSection.bind(null, section.id)}
                confirmText={`Delete "${section.title}" and its ${section.lessons.length} lessons? Their videos are deleted too.`}
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete section ${section.title}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </DeleteButton>
            </div>

            <SortableList
              id={`lessons-${section.id}`}
              items={section.lessons}
              className="flex flex-col gap-0.5 p-2 empty:hidden"
              onReorder={(next) => {
                setSections((all) => all.map((s) => (s.id === section.id ? { ...s, lessons: next } : s)))
                reorderLessons(
                  section.id,
                  next.map((l) => l.id)
                )
              }}
              render={(lesson, lessonHandle) => (
                <div className="flex items-center gap-2 rounded-lg py-1 pr-3 pl-1 transition-colors hover:bg-accent">
                  {lessonHandle}
                  {lesson.videoPath ? (
                    <PlayCircle className="size-4 shrink-0 text-primary" aria-label="Has video" />
                  ) : (
                    <VideoOff className="size-4 shrink-0 text-muted-foreground" aria-label="No video yet" />
                  )}
                  <Link href={`/admin/lessons/${lesson.id}`} className="min-w-0 flex-1 truncate py-1 text-sm hover:text-primary">
                    {offsets[i] + section.lessons.indexOf(lesson) + 1}. {lesson.title}
                  </Link>
                  {lesson.isFreePreview && <span className="text-xs text-primary">Free</span>}
                  {!lesson.isPublished && <Badge variant="secondary">Draft</Badge>}
                  <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {lesson.videoPath ? clock(lesson.durationS) : "--:--"}
                  </span>
                </div>
              )}
            />

            <form action={createLesson.bind(null, section.id)} className="flex gap-2 border-t p-3">
              <Input name="title" required maxLength={200} placeholder="New lesson title" aria-label={`New lesson in ${section.title}`} />
              <SubmitButton variant="outline">
                <Plus data-icon="inline-start" /> Add lesson
              </SubmitButton>
            </form>
          </div>
        )
      }}
    />
  )
}
