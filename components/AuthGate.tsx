"use client"

import { createContext, useContext, useEffect, useState, type ReactNode, type FormEvent } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import Owl from "./Owl"

const UserContext = createContext<User | null>(null)
export function useCurrentUser() {
  const user = useContext(UserContext)
  if (!user) throw new Error("User data requires a signed-in account")
  return user
}

type Mode = "login" | "signup" | "forgot" | "reset"

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === "PASSWORD_RECOVERY") setMode("reset")
      setLoading(false)
    })
    void supabase.auth.getSession().then(({ data }) => {
      if (new URLSearchParams(window.location.search).has("reset")) setMode("reset")
      const queryError = new URLSearchParams(window.location.search).get("error_description")
      const hashError = new URLSearchParams(window.location.hash.slice(1)).get("error_description")
      if (queryError || hashError) setError((queryError ?? hashError ?? "Invalid link").replaceAll("+", " "))
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => subscription.unsubscribe()
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setError("")
    setNotice("")
    setPassword("")
    setConfirm("")
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/?reset=1`,
        })
        if (error) throw error
        setNotice("If this email has an account, a password reset link is on its way. Check your inbox and spam folder.")
      } else if (mode === "reset") {
        if (!user) throw new Error("This reset link is invalid or expired. Request a new one.")
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.")
        if (password !== confirm) throw new Error("Passwords do not match.")
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        window.history.replaceState({}, "", "/")
        switchMode("login")
        setNotice("Password updated.")
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.")
        if (password !== confirm) throw new Error("Passwords do not match.")
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) setNotice("Check your email to confirm your account, then sign in.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!supabase) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-slate-200">Account setup is required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</div>
  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading Hoot…</div>
  if (user && mode !== "reset") return <UserContext.Provider value={user}>{children}</UserContext.Provider>

  const heading = { login: "Welcome back", signup: "Create your account", forgot: "Reset your password", reset: "Choose a new password" }[mode]
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3"><Owl pose="idle" size={46} /><span className="brand-gradient-text text-2xl font-bold">Hoot</span></div>
        <h1 className="text-2xl font-bold text-white">{heading}</h1>
        <p className="mt-2 text-sm text-slate-400">Your stocks, chat history, and learning progress stay with your account.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode !== "reset" && <label className="block text-sm text-slate-300">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400" /></label>}
          {mode !== "forgot" && <label className="block text-sm text-slate-300">{mode === "reset" ? "New password" : "Password"}<input required minLength={mode === "login" ? undefined : 8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400" /></label>}
          {(mode === "signup" || mode === "reset") && <label className="block text-sm text-slate-300">Confirm password<input required type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400" /></label>}
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          <button disabled={busy} className="w-full rounded-xl brand-gradient-bg px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : { login: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Update password" }[mode]}</button>
        </form>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-emerald-300">
          {mode === "login" && <><button onClick={() => switchMode("forgot")}>Forgot password?</button><button onClick={() => switchMode("signup")}>Create an account</button></>}
          {mode === "signup" && <button onClick={() => switchMode("login")}>Already have an account? Sign in</button>}
          {(mode === "forgot" || mode === "reset") && <button onClick={() => switchMode("login")}>Back to sign in</button>}
          {mode === "reset" && <button onClick={() => switchMode("forgot")}>Request another reset link</button>}
        </div>
      </div>
    </main>
  )
}
