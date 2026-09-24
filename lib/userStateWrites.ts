"use client"

let pending = Promise.resolve()

export function queueUserStateWrite(write: () => Promise<void>) {
  pending = pending.then(write, write)
  return pending
}

export function flushUserStateWrites() {
  return pending
}
