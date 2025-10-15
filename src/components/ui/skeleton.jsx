/*
Αυτό το στοιχείο UI είναι ένα placeholder σκελετού που εμφανίζεται κατά τη φόρτωση περιεχομένου.
*/

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
