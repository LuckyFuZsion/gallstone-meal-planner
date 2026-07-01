"use client"

import { useEffect } from "react"

/** Dev-only: remove stale service workers left by earlier builds or ports. */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (!("serviceWorker" in navigator)) return

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister()
      }
    })
  }, [])

  return null
}
