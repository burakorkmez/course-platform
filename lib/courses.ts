// ponytail: hard-coded fake data until Phase 2/5 moves courses, lessons and progress into Postgres.

type Lesson = { title: string; duration: string; free?: boolean }
type Section = { title: string; lessons: Lesson[] }

export type Course = {
  slug: string
  title: string
  tagline: string
  description: string
  thumbnail: string
  level: string
  tags: string[]
  students: number
  rating: number
  updated: string
  badge?: string
  outcomes: string[]
  sections: Section[]
}

export type FlatLesson = Lesson & { slug: string; section: string; index: number }

export const PRICE = "$25"

// Completed lesson count per enrolled course (lessons are completed in order). Not listed = not owned.
const enrollments: Record<string, number> = {
  "codex-mobile-apps": 5,
  "claude-code-bootcamp": 2,
  "mern-realtime-chat": 11,
}

export const courses: Course[] = [
  {
    slug: "codex-mobile-apps",
    title: "Build Real Mobile Apps with Codex",
    tagline: "Go from idea to the App Store with OpenAI Codex, Expo and React Native.",
    description:
      "Build Codesgram, a full social app with a feed, realtime chat and image uploads, while Codex writes the boilerplate. You'll learn how to plan features with AI, review what it writes, and ship a real app to both stores.",
    thumbnail: "/courses/codex-mobile-apps.jpg",
    level: "Beginner",
    tags: ["Codex", "Expo", "React Native", "TypeScript"],
    students: 1284,
    rating: 4.9,
    updated: "Sep 2026",
    badge: "New",
    outcomes: [
      "Plan and scaffold a mobile app with Codex",
      "Build auth, a feed and realtime chat",
      "Upload and optimize images",
      "Ship to the App Store and Google Play with EAS",
    ],
    sections: [
      {
        title: "Getting Started",
        lessons: [
          { title: "Course introduction", duration: "04:12", free: true },
          { title: "Setting up Codex and Expo", duration: "09:48", free: true },
          { title: "Planning the app with AI", duration: "12:05" },
          { title: "Project structure", duration: "07:31" },
        ],
      },
      {
        title: "Building the App",
        lessons: [
          { title: "Auth screens", duration: "18:22" },
          { title: "Feed and posts", duration: "24:10" },
          { title: "Realtime chat", duration: "21:47" },
          { title: "Image uploads", duration: "15:36" },
        ],
      },
      {
        title: "Shipping",
        lessons: [
          { title: "Push notifications", duration: "13:09" },
          { title: "App icons and splash screens", duration: "08:44" },
          { title: "Building with EAS", duration: "16:20" },
          { title: "Publishing to the stores", duration: "19:02" },
        ],
      },
    ],
  },
  {
    slug: "claude-code-bootcamp",
    title: "Claude Code Bootcamp: 3 Real Mobile Apps",
    tagline: "Build a food tracker, a travel planner and a clinic app end to end with Claude Code.",
    description:
      "Three complete apps, one workflow. You'll set up Claude Code properly, learn the prompts and project memory that keep it on track, then build FitKal AI, TripMate AI and SmileCare from scratch.",
    thumbnail: "/courses/claude-code-bootcamp.jpg",
    level: "Intermediate",
    tags: ["Claude Code", "React Native", "Expo", "AI"],
    students: 2941,
    rating: 4.9,
    updated: "Aug 2026",
    badge: "Bestseller",
    outcomes: [
      "Work with Claude Code like a senior pair programmer",
      "Use camera, maps and video calls in React Native",
      "Call AI APIs safely from a mobile app",
      "Take three apps from idea to launch",
    ],
    sections: [
      {
        title: "Claude Code Fundamentals",
        lessons: [
          { title: "Welcome to the bootcamp", duration: "05:20", free: true },
          { title: "Installing Claude Code", duration: "08:15", free: true },
          { title: "Prompts that actually work", duration: "14:40" },
          { title: "CLAUDE.md and project memory", duration: "11:28" },
        ],
      },
      {
        title: "App 1: FitKal AI",
        lessons: [
          { title: "Scanning meals with the camera", duration: "22:05" },
          { title: "Nutrition API and charts", duration: "19:47" },
          { title: "Daily goals and streaks", duration: "16:12" },
        ],
      },
      {
        title: "App 2: TripMate AI",
        lessons: [
          { title: "Generating itineraries", duration: "20:33" },
          { title: "Maps and places", duration: "18:09" },
          { title: "Offline trips", duration: "13:54" },
        ],
      },
      {
        title: "App 3: SmileCare",
        lessons: [
          { title: "Booking flow", duration: "17:41" },
          { title: "Video consultations", duration: "21:16" },
          { title: "Launch checklist", duration: "09:58" },
        ],
      },
    ],
  },
  {
    slug: "local-business-apps",
    title: "Mobile Apps for Local Businesses",
    tagline: "Find real clients and build them booking apps with Claude Code.",
    description:
      "Local businesses need apps and almost nobody is building them. Learn how to find and price your first client, then build Dentify, a dental clinic app with bookings, reminders and an admin dashboard, and hand it off like a pro.",
    thumbnail: "/courses/local-business-apps.jpg",
    level: "Intermediate",
    tags: ["Claude Code", "Expo", "Stripe", "Freelancing"],
    students: 856,
    rating: 4.8,
    updated: "Jul 2026",
    outcomes: [
      "Find, pitch and price local clients",
      "Build appointment booking with reminders",
      "Take payments with Stripe",
      "Set up maintenance retainers",
    ],
    sections: [
      {
        title: "Finding Clients",
        lessons: [
          { title: "Why local businesses need apps", duration: "06:30", free: true },
          { title: "Finding your first client", duration: "12:14", free: true },
          { title: "Pricing your work", duration: "10:47" },
        ],
      },
      {
        title: "Building Dentify",
        lessons: [
          { title: "Design system and screens", duration: "19:22" },
          { title: "Appointment booking", duration: "23:08" },
          { title: "Reminders and notifications", duration: "14:51" },
          { title: "Admin dashboard", duration: "20:36" },
        ],
      },
      {
        title: "Delivering",
        lessons: [
          { title: "Payments with Stripe", duration: "17:19" },
          { title: "Handing off to the client", duration: "09:40" },
          { title: "Maintenance retainers", duration: "08:25" },
        ],
      },
    ],
  },
  {
    slug: "mobile-apps-with-claude",
    title: "Build Real Mobile Apps with Claude",
    tagline: "Ship an AI calorie tracker with React Native, TypeScript and Claude.",
    description:
      "Build Bulky AI, a calorie tracker that analyzes meal photos, from an empty folder to a paid app. Along the way you'll get a React Native crash course, polished animations and a working subscription paywall.",
    thumbnail: "/courses/mobile-apps-with-claude.jpg",
    level: "Beginner",
    tags: ["Claude", "React Native", "TypeScript", "Expo"],
    students: 1932,
    rating: 4.9,
    updated: "Jun 2026",
    outcomes: [
      "Learn React Native from the ground up",
      "Analyze meal photos with AI",
      "Add animations that feel native",
      "Sell subscriptions with a paywall",
    ],
    sections: [
      {
        title: "Foundations",
        lessons: [
          { title: "Introduction", duration: "03:58", free: true },
          { title: "Tools and setup", duration: "10:21", free: true },
          { title: "React Native crash course", duration: "24:45" },
        ],
      },
      {
        title: "Bulky AI",
        lessons: [
          { title: "Onboarding flow", duration: "15:33" },
          { title: "Photo meal logging", duration: "21:09" },
          { title: "AI nutrition analysis", duration: "18:27" },
          { title: "Recipes screen", duration: "13:48" },
        ],
      },
      {
        title: "Polish and Launch",
        lessons: [
          { title: "Animations", duration: "12:36" },
          { title: "Paywall and subscriptions", duration: "19:55" },
          { title: "Store submission", duration: "14:02" },
        ],
      },
    ],
  },
  {
    slug: "claude-code-mobile",
    title: "The Ultimate Claude Code Mobile Tutorial",
    tagline: "Build Triply, a travel app, from a blank folder to the App Store.",
    description:
      "One app, every step. Plan Triply with Claude Code, add Google and Apple sign-in, AI trip planning and search, then get it production-ready with theming, error tracking and release builds.",
    thumbnail: "/courses/claude-code-mobile.jpg",
    level: "All levels",
    tags: ["Claude Code", "Expo", "TypeScript", "Tailwind"],
    students: 1517,
    rating: 4.8,
    updated: "May 2026",
    outcomes: [
      "Plan a full app with Claude Code",
      "Add Google and Apple sign-in",
      "Build AI trip planning and search",
      "Ship production builds with error tracking",
    ],
    sections: [
      {
        title: "Setup",
        lessons: [
          { title: "Course overview", duration: "04:47", free: true },
          { title: "Claude Code in 10 minutes", duration: "10:03", free: true },
          { title: "Planning Triply", duration: "09:12" },
        ],
      },
      {
        title: "Core Features",
        lessons: [
          { title: "Auth with Google and Apple", duration: "17:58" },
          { title: "Trip planning with AI", duration: "22:41" },
          { title: "Destinations and search", duration: "16:19" },
          { title: "Saved trips", duration: "12:27" },
        ],
      },
      {
        title: "Production",
        lessons: [
          { title: "Theming and dark mode", duration: "11:36" },
          { title: "Error tracking", duration: "09:05" },
          { title: "Release builds", duration: "15:44" },
        ],
      },
    ],
  },
  {
    slug: "mern-realtime-chat",
    title: "MERN Realtime Chat App",
    tagline: "Build a realtime chat with React, Socket.io, MongoDB and Node.js.",
    description:
      "Build a messenger with realtime messages, online presence, image messages and dark mode. You'll write the Express and Socket.io backend, the React frontend, and deploy the whole thing.",
    thumbnail: "/courses/mern-realtime-chat.jpg",
    level: "Intermediate",
    tags: ["React", "Socket.io", "MongoDB", "Node.js"],
    students: 3408,
    rating: 4.9,
    updated: "Apr 2026",
    outcomes: [
      "Build a REST API with Express and MongoDB",
      "Authenticate users with JWT",
      "Send realtime messages with Socket.io",
      "Deploy a full MERN app",
    ],
    sections: [
      {
        title: "Backend",
        lessons: [
          { title: "Project setup", duration: "05:12", free: true },
          { title: "Express and MongoDB", duration: "14:38", free: true },
          { title: "Authentication with JWT", duration: "19:26" },
          { title: "Socket.io server", duration: "16:50" },
        ],
      },
      {
        title: "Frontend",
        lessons: [
          { title: "React and Tailwind setup", duration: "10:44" },
          { title: "Chat layout", duration: "18:13" },
          { title: "Realtime messages", duration: "21:37" },
          { title: "Online presence", duration: "12:09" },
        ],
      },
      {
        title: "Deploy",
        lessons: [
          { title: "Image messages", duration: "13:25" },
          { title: "Dark and light mode", duration: "09:51" },
          { title: "Deploying the app", duration: "15:30" },
        ],
      },
    ],
  },
]

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const seconds = (d: string) => d.split(":").reduce((total, n) => total * 60 + Number(n), 0)

export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug)
}

export function getLessons(course: Course): FlatLesson[] {
  return course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s.title }))).map((l, index) => ({
    ...l,
    slug: slugify(l.title),
    index,
  }))
}

export function getStats(course: Course) {
  const lessons = getLessons(course)
  return { lessons: lessons.length, duration: formatDuration(lessons.reduce((t, l) => t + seconds(l.duration), 0)) }
}

export function getProgress(course: Course) {
  const total = getLessons(course).length
  const completed = enrollments[course.slug] ?? 0
  return { owned: course.slug in enrollments, completed, total, percent: Math.round((completed / total) * 100) }
}

export const canWatch = (course: Course, lesson: FlatLesson) => getProgress(course).owned || !!lesson.free

// The lesson to pick up from: the first one not completed yet (or the last one when finished).
export function resumeLesson(course: Course) {
  const lessons = getLessons(course)
  return lessons[Math.min(getProgress(course).completed, lessons.length - 1)]
}
