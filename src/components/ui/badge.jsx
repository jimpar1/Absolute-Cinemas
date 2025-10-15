/*
Αυτό το στοιχείο UI εμφανίζει ένα badge με διαφορετικές παραλλαγές για κατηγοριοποίηση ή επισήμανση.
*/

import * as React from "react"
import { badgeVariants } from "./badge-variants"
import { cn } from "@/lib/utils"

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
