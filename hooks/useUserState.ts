"use client"

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { useCurrentUser } from "@/components/AuthGate"
import { supabase } from "@/lib/supabase"
import { queueUserStateWrite } from "@/lib/userStateWrites"

/** A row per account and data key. RLS in supabase/user_state.sql enforces ownership. */
export function useUserState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean, string | null] {
  const user = useCurrentUser()
  const [value, setValue] = useState<T>(initial)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialRef = useRef(initial)
  const loaded = useRef(false)

  useEffect(() => {
    let active = true
    supabase!.from("user_state").select("value").eq("user_id", user.id).eq("key", key).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) { setError(error.message); return }
        setValue(data ? data.value as T : initialRef.current)
        setReady(true)
      })
    return () => { active = false }
  }, [user.id, key])

  useEffect(() => {
    if (!ready) return
    if (!loaded.current) { loaded.current = true; return }
    void queueUserStateWrite(async () => {
      const { error } = await supabase!.from("user_state").upsert(
        { user_id: user.id, key, value }, { onConflict: "user_id,key" }
      )
      if (error) setError(`Could not save account data: ${error.message}`)
    })
  }, [value, ready, user.id, key])

  return [value, setValue, ready, error]
}
