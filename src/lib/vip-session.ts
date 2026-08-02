export const VIP_SESSION_KEY = "downtown-vip-session-v1";
export const VIP_SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
export const CHECK_IN_DURATION_MS = 8 * 60 * 60 * 1000;

export type VipSession = {
  version: 1;
  name: string;
  authorizedAt: number;
  expiresAt: number;
  checkInUntil?: number;
};

export function readVipSession(): VipSession | null {
  try {
    const value = window.localStorage.getItem(VIP_SESSION_KEY);
    if (!value) return null;

    const session = JSON.parse(value) as Partial<VipSession>;
    if (
      session.version !== 1 ||
      typeof session.name !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(VIP_SESSION_KEY);
      return null;
    }

    return session as VipSession;
  } catch {
    window.localStorage.removeItem(VIP_SESSION_KEY);
    return null;
  }
}

export function writeVipSession(session: VipSession) {
  window.localStorage.setItem(VIP_SESSION_KEY, JSON.stringify(session));
}

export function createVipSession(name: string): VipSession {
  const authorizedAt = Date.now();
  return {
    version: 1,
    name: name.trim(),
    authorizedAt,
    expiresAt: authorizedAt + VIP_SESSION_DURATION_MS,
  };
}

export function formatCheckInTime(timestamp: number) {
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${day} kl: ${time}`;
}
