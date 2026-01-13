/*
Αυτό το στοιχείο UI είναι μια ετικέτα για σύνδεση με πεδία εισόδου ή άλλα στοιχεία φόρμας.
*/

import * as React from "react"
import { cn } from "@/lib/utils"

const Label = React.forwardRef(({ className, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  >
    {children}
  </label>
))
Label.displayName = "Label"

export { Label }
