import Image from "next/image"
import { Pause, Play, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type Testimonial = { name: string; role: string; avatar: string; quote: string }

// Placeholder quotes and AI-generated faces: replace with real student reviews before launch.
export const testimonials: Testimonial[] = [
  {
    name: "Maya Chen",
    role: "Frontend Engineer",
    avatar: "/avatars/maya.jpg",
    quote:
      "I've bought a lot of courses I never finished. This is the first one where I actually shipped the project at the end. No filler, no 20-minute intros.",
  },
  {
    name: "Daniel Okafor",
    role: "Full-stack Developer",
    avatar: "/avatars/daniel.jpg",
    quote:
      "The Full-Stack Next.js course covers the parts every other tutorial skips: auth, payments, webhooks, deploying. It became the blueprint for my own SaaS.",
  },
  {
    name: "Sofia Martínez",
    role: "Senior Software Engineer",
    avatar: "/avatars/sofia.jpg",
    quote:
      "I recommend it to every junior on my team. Clear explanations, real code, and the source for every lesson means nobody gets stuck on a typo.",
  },
  {
    name: "Arjun Patel",
    role: "Computer Science Student",
    avatar: "/avatars/arjun.jpg",
    quote: "University taught me algorithms. This taught me how to build and ship an actual product.",
  },
  {
    name: "Emily Novak",
    role: "Engineering Manager",
    avatar: "/avatars/emily.jpg",
    quote:
      "System Design for Web Devs is the most practical take on caching and queues I've seen. No whiteboard theater, just real trade-offs you'll hit at work.",
  },
  {
    name: "Lucas Ferreira",
    role: "Freelance Developer",
    avatar: "/avatars/lucas.jpg",
    quote: "Lifetime access paid for itself with the first client project. I come back every time a new course drops.",
  },
  {
    name: "Hana Kim",
    role: "Junior Developer",
    avatar: "/avatars/hana.jpg",
    quote:
      "The player remembers exactly where I stopped, so I learned in 20-minute chunks on the train. Three courses done in two months.",
  },
  {
    name: "Tom Becker",
    role: "Backend Engineer",
    avatar: "/avatars/tom.jpg",
    quote:
      "After fifteen years of Java I needed the modern TypeScript stack, fast. TypeScript Deep Dive got me there in a weekend.",
  },
  {
    name: "Amara Nwosu",
    role: "Indie Hacker",
    avatar: "/avatars/amara.jpg",
    quote:
      "Shipped my side project two weeks after finishing. It feels like pairing with a senior dev who actually explains the why.",
  },
]

export const avatars = testimonials.map((t) => t.avatar)

export function Stars({ className }: { className?: string }) {
  return (
    <div role="img" aria-label="Rated 5 out of 5" className={cn("flex gap-0.5 text-primary", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-3.5 fill-current" />
      ))}
    </div>
  )
}

function TestimonialCard({ name, role, avatar, quote, duplicate }: Testimonial & { duplicate: boolean }) {
  return (
    <figure
      aria-hidden={duplicate || undefined}
      className="relative rounded-2xl border bg-card/80 p-6 shadow-[0_10px_40px_-24px_var(--glow)] before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary/50 before:to-transparent"
    >
      <Stars />
      <blockquote className="mt-4 text-[0.9375rem] leading-relaxed text-foreground/90">{quote}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Image src={avatar} alt="" width={40} height={40} className="size-10 rounded-full ring-1 ring-primary/30" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  )
}

// Each column renders its cards twice and scrolls up by half its height, so the loop is seamless.
function Column({ items, className }: { items: Testimonial[]; className?: string }) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div className="flex animate-marquee-up flex-col gap-6 pb-6 group-has-checked/reviews:[animation-play-state:paused] hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[false, true].flatMap((duplicate) =>
          items.map((t) => <TestimonialCard key={`${duplicate}-${t.name}`} {...t} duplicate={duplicate} />)
        )}
      </div>
    </div>
  )
}

export function Testimonials() {
  return (
    <div className="group/reviews">
      <div className="relative flex max-h-[42rem] gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_85%,transparent)]">
        <Column items={testimonials.slice(0, 3)} className="[--duration:34s]" />
        <Column items={testimonials.slice(3, 6)} className="hidden [--duration:44s] md:block" />
        <Column items={testimonials.slice(6, 9)} className="hidden [--duration:39s] lg:block" />
      </div>
      {/* A native checkbox, so pausing needs no JS: the columns read it through :has(). Hidden under reduced motion, where nothing moves. */}
      <label
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-lg" }),
          "mx-auto mt-6 flex cursor-pointer rounded-full has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 motion-reduce:hidden"
        )}
      >
        <input type="checkbox" aria-label="Pause reviews" className="peer sr-only" />
        <Pause className="peer-checked:hidden" />
        <Play className="hidden peer-checked:block" />
      </label>
    </div>
  )
}
