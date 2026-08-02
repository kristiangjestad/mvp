"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { formatCheckInTime } from "@/lib/vip-session";
import type { PublicAccessSession } from "@/lib/vip-access";

export function VipApp() {
  const [session, setSession] = useState<PublicAccessSession | null | undefined>(undefined);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/access/session", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { session?: PublicAccessSession | null; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Kunne ikke åpne VIP-passet.");
        setSession(data.session ?? null);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Kunne ikke åpne VIP-passet.");
        setSession(null);
      });
  }, []);

  if (session === undefined) {
    return <main className="app-shell" aria-label="Laster VIP-pass" />;
  }

  if (!session) {
    return <AccessGate onAuthorized={setSession} initialError={loadError} />;
  }

  async function checkIn() {
    const response = await fetch("/api/access/check-in", { method: "POST" });
    const data = (await response.json()) as { checkInUntil?: number; error?: string };
    if (!response.ok || !data.checkInUntil) throw new Error(data.error ?? "Kunne ikke sjekke inn.");
    setSession((current) => current ? { ...current, checkInUntil: data.checkInUntil } : current);
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
      setError("Skriv inn navnet ditt.");
      return;
    }
    if (!code.trim()) {
      setError("Skriv inn tilgangskoden.");
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
    <main className="app-shell access-screen">
      <section className="access-card" aria-labelledby="access-title">
        <Image
          className="access-logo"
          src="/assets/club-downtown-logo.png"
          alt="Club Downtown"
          width={836}
          height={296}
          priority
        />
        <h1 id="access-title">VIP-pass</h1>
        <p className="access-intro">Skriv inn navn og engangskoden du har fått.</p>

        <form onSubmit={submit} className="access-form">
          <label htmlFor="name">Navn</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label htmlFor="code">Engangskode</label>
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
            {submitting ? "Aktiverer…" : "Åpne VIP-pass"}
          </button>
        </form>
      </section>
    </main>
  );
}

function VipPass({ session, onCheckIn }: { session: PublicAccessSession; onCheckIn: () => Promise<void> }) {
  const [checkInError, setCheckInError] = useState("");

  async function handleCheckIn() {
    setCheckInError("");
    try {
      await onCheckIn();
    } catch (error) {
      setCheckInError(error instanceof Error ? error.message : "Kunne ikke sjekke inn.");
    }
  }

  return (
    <main className="app-shell vip-screen">
      <section className="vip-pass" aria-label={`VIP-pass for ${session.name}`}>
        <Image
          className="club-logo"
          src="/assets/club-downtown-logo.png"
          alt="Club Downtown – everything's waiting for you"
          width={836}
          height={296}
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
            <button className="check-in-button" type="button" onClick={handleCheckIn}>Sjekk inn</button>
          )}
          {checkInError ? <p className="check-in-error" role="alert">{checkInError}</p> : null}
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
