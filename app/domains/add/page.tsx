'use client'

import { requireAuth } from "@/app/lib/server-auth"
import { AddDomainForm } from "./add-domain-form"

export default function AddDomainPage() {
  return <AddDomainForm userId={1} />
}
