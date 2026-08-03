"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { formatCheckInTime } from "@/lib/vip-session";
import type { PublicAccessSession } from "@/lib/vip-access";

const SESSION_CACHE_KEY = "dtvip_session_cache_v1";
const CHECK_IN_KEY = "dtvip_check_in_until";
const SESSION_CACHE_MS = 60 * 60 * 1000;
const CHECK_IN_MS = 8 * 60 * 60 * 1000;

type CachedSession = {
  session: PublicAccessSession;
  validUntil: number;
};

function removeCachedSession() {
  try {
    window.localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // Ignore storage restrictions in Safari private contexts.
  }
}

function readLocalCheckIn() {
  try {
    const value = Number(window.localStorage.getItem(CHECK_IN_KEY));
    if (value > Date.now()) return value;
    window.localStorage.removeItem(CHECK_IN_KEY);
  } catch {
    // Safari can deny storage in private contexts; check-in still works in memory.
  }
  return undefined;
}

function withLocalCheckIn(session: PublicAccessSession): PublicAccessSession {
  return { ...session, checkInUntil: readLocalCheckIn() };
}

function readCachedSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedSession;
    const isExpired = cached.session.expiresAt && cached.session.expiresAt <= Date.now();
    if (!cached.session.name || cached.validUntil <= Date.now() || isExpired) {
      removeCachedSession();
      return null;
    }
    return withLocalCheckIn(cached.session);
  } catch {
    removeCachedSession();
    return null;
  }
}

function cacheValidatedSession(session: PublicAccessSession) {
  try {
    const absoluteExpiry = session.expiresAt ?? Number.POSITIVE_INFINITY;
    const cached: CachedSession = {
      session,
      validUntil: Math.min(Date.now() + SESSION_CACHE_MS, absoluteExpiry),
    };
    window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // The server session remains the source of truth when storage is unavailable.
  }
}

function updateCachedSession(session: PublicAccessSession) {
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw) as CachedSession;
    window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ ...cached, session }));
  } catch {
    // Keep the in-memory state even if Safari storage is unavailable.
  }
}

export function VipApp() {
  const [session, setSession] = useState<PublicAccessSession | null | undefined>(undefined);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const cached = readCachedSession();
    if (cached) {
      setSession(cached);
      return;
    }

    fetch("/api/access/session", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { session?: PublicAccessSession | null; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Kunne ikke åpne VIP-passet.");
        const verifiedSession = data.session ? withLocalCheckIn(data.session) : null;
        if (verifiedSession) cacheValidatedSession(verifiedSession);
        else removeCachedSession();
        setSession(verifiedSession);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Kunne ikke åpne VIP-passet.");
        setSession(null);
      });
  }, []);

  if (session === undefined) {
    return (
      <main className="app-shell game-screen game-loading" aria-label="Laster spillerpass">
        <div className="game-unicorn-mark" aria-hidden="true">
          <span>✦</span>
          <strong>🦄</strong>
          <span>✦</span>
        </div>
      </main>
    );
  }

  function authorize(sessionToCache: PublicAccessSession) {
    const authorizedSession = withLocalCheckIn(sessionToCache);
    cacheValidatedSession(authorizedSession);
    setSession(authorizedSession);
  }

  function checkIn() {
    const checkInUntil = Date.now() + CHECK_IN_MS;
    try {
      window.localStorage.setItem(CHECK_IN_KEY, String(checkInUntil));
    } catch {
      // The timestamp still remains available for this open app session.
    }
    setSession((current) => {
      if (!current) return current;
      const updated = { ...current, checkInUntil };
      updateCachedSession(updated);
      return updated;
    });
  }

  if (!session) {
    return <AccessGate onAuthorized={authorize} initialError={loadError} />;
  }

  return <VipPass session={session} onCheckIn={checkIn} />;
}

function AccessGate({
  onAuthorized,
  initialError,
}: {
  onAuthorized: (session: PublicAccessSession) => void;
  initialError?: string;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Skriv inn spillernavnet ditt.");
      return;
    }
    if (!code.trim()) {
      setError("Skriv inn stjernekoden.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, code }),
      });
      const data = (await response.json()) as { session?: PublicAccessSession; error?: string };
      if (!response.ok || !data.session) throw new Error(data.error ?? "Koden kunne ikke aktiveres.");
      onAuthorized(data.session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Koden kunne ikke aktiveres.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell access-screen game-screen">
      <section className="access-card" aria-labelledby="access-title">
        <div className="game-unicorn-mark" aria-hidden="true">
          <span>✦</span>
          <strong>🦄</strong>
          <span>✦</span>
        </div>
        <p className="access-eyebrow">Rosa regnbuerike</p>
        <h1 id="access-title">Enhjørning VIP</h1>
        <p className="access-intro">Skriv inn spillernavn og stjernekoden du har fått.</p>

        <form onSubmit={submit} className="access-form">
          <label htmlFor="name">Spillernavn</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label htmlFor="code">Stjernekode</label>
          <input
            id="code"
            name="code"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="one-time-code"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="access-button" disabled={submitting}>
            {submitting ? "Låser opp…" : "Åpne spillerpass"}
          </button>
        </form>
      </section>
    </main>
  );
}

function VipPass({ session, onCheckIn }: { session: PublicAccessSession; onCheckIn: () => void }) {
  return (
    <main className="app-shell vip-screen">
      <section className="vip-pass" aria-label={`VIP-pass for ${session.name}`}>
        <Image
          className="club-logo"
          src="/assets/club-downtown-logo-v4.png"
          alt="Club Downtown – everything's waiting for you"
          width={2033}
          height={497}
          priority
        />

        <div className="vip-artwork" aria-hidden="true">
          <div className="dancers" />
          <Image
            className="vip-badge"
            src="/assets/vip-badge.png"
            alt=""
            width={672}
            height={678}
            priority
          />
        </div>

        <div className="nameplate">
          <Image src="/assets/gold-nameplate.png" alt="" fill sizes="310px" priority />
          <strong>{session.name}</strong>
        </div>

        <p className="guest-access">Pluss <span>1</span> stk og gratis inngang</p>

        <div className="check-in-slot" aria-live="polite">
          {session.checkInUntil ? (
            <p className="check-in-time">Kan sjekke inn: {formatCheckInTime(session.checkInUntil)}</p>
          ) : (
            <button className="check-in-button" type="button" onClick={onCheckIn}>
              <span className="check-in-label-graphic" aria-hidden="true" />
              <span className="sr-only">Sjekk inn</span>
            </button>
          )}
        </div>

        <p className="instructions">
          Innsjekk gjøres av dørvakt<br />
          og dere må komme samlet.<br />
          * Du MÅ vise legitimasjon
        </p>
      </section>
    </main>
  );
}
