/*
Αυτό το αρχείο περιέχει βοηθητικές λειτουργίες, όπως η συνδυασμένη συνάρτηση για την ένωση κλάσεων CSS με clsx και tailwind-merge.
*/

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
