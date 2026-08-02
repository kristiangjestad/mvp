"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import {
  CHECK_IN_DURATION_MS,
  createVipSession,
  formatCheckInTime,
  readVipSession,
  VipSession,
  writeVipSession,
} from "@/lib/vip-session";

const ACCESS_CODE = process.env.NEXT_PUBLIC_VIP_PASSWORD ?? "vip2026";

export function VipApp() {
  const [session, setSession] = useState<VipSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(readVipSession());
  }, []);

  if (session === undefined) {
    return <main className="app-shell" aria-label="Laster VIP-pass" />;
  }

  if (!session) {
    return <AccessGate onAuthorized={setSession} />;
  }

  function checkIn() {
    if (!session) return;
    const updated = { ...session, checkInUntil: Date.now() + CHECK_IN_DURATION_MS };
    writeVipSession(updated);
    setSession(updated);
  }

  return <VipPass session={session} onCheckIn={checkIn} />;
}

function AccessGate({ onAuthorized }: { onAuthorized: (session: VipSession) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Skriv inn navnet ditt.");
      return;
    }
    if (password !== ACCESS_CODE) {
      setError("Passordet er ikke riktig.");
      return;
    }

    const nextSession = createVipSession(trimmedName);
    writeVipSession(nextSession);
    onAuthorized(nextSession);
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
        <p className="access-intro">Skriv inn navn og passord for å åpne passet.</p>

        <form onSubmit={submit} className="access-form">
          <label htmlFor="name">Navn</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label htmlFor="password">Passord</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="access-button">Åpne VIP-pass</button>
        </form>
      </section>
    </main>
  );
}

function VipPass({ session, onCheckIn }: { session: VipSession; onCheckIn: () => void }) {
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
          <Image
            className="dancers"
            src="/assets/dancer-silhouettes.png"
            alt=""
            width={893}
            height={534}
            priority
          />
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
            <button className="check-in-button" type="button" onClick={onCheckIn}>Sjekk inn</button>
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
