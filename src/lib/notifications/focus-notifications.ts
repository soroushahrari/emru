type SessionPhase = "focus" | "rest"

function playSubtleChime() {
  if (typeof window === "undefined") {
    return
  }

  const Context =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Context) {
    return
  }

  try {
    const ctx = new Context()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.18)
    osc.onended = () => {
      void ctx.close()
    }
  } catch {
    // noop
  }
}

export async function primeFocusNotifications() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return
  }

  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission()
    } catch {
      // noop
    }
  }
}

export async function notifyFocusSessionEnded(nextPhase: SessionPhase) {
  playSubtleChime()

  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return
  }

  if (Notification.permission !== "granted") {
    return
  }

  try {
    const body =
      nextPhase === "rest"
        ? "Focus session complete. Start your rest when ready."
        : "Rest session complete. Start your next focus session when ready."

    new Notification("Emru Focus", {
      body,
      tag: "emru-focus-session",
      silent: false,
    })
  } catch {
    // noop
  }
}
