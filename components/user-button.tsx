"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Client-side so the pages around it stay static. Its session check also completes the OAuth
// sign-in when Google/GitHub send the user back to a public page with a verifier in the URL.
export function UserButton() {
  const router = useRouter()
  const { data } = authClient.useSession()

  if (!data) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Sign in
        </Link>
        <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
          Get Started
        </Link>
      </div>
    )
  }

  const { user } = data
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="ring-1 ring-primary/30">
          <AvatarImage src={user.image ?? undefined} alt="" />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Base UI requires a label to live inside a group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut()
            router.refresh()
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
