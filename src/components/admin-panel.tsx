"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type CodeStatus = "unused" | "active" | "expired" | "revoked";

type AdminCode = {
  codeHash: string;
  codeSuffix: string;
  comment: string;
  durationDays: number | null;
  createdAt: number;
  claimedAt?: number;
  claimedName?: string;
  expiresAt?: number;
  lastSeenAt?: number;
  revokedAt?: number;
  status: CodeStatus;
};

const statusLabels: Record<CodeStatus, string> = {
  unused: "Ubrukt",
  active: "Aktiv",
  expired: "Utløpt",
  revoked: "Sperret",
};

function formatDate(value?: number) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | undefined>();
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [comment, setComment] = useState("");
  const [durationDays, setDurationDays] = useState(90);
  const [unlimited, setUnlimited] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCodes = useCallback(async () => {
    const response = await fetch("/api/admin/codes", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = (await response.json()) as { codes?: AdminCode[]; error?: string };
    if (!response.ok) throw new Error(data.error ?? "Kunne ikke hente kodene.");
    setCodes(data.codes ?? []);
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (data.authenticated) return loadCodes();
        setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false));
  }, [loadCodes]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke logge inn.");
      setPassword("");
      await loadCodes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke logge inn.");
    } finally {
      setBusy(false);
    }
  }

  async function createCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setNewCode("");
    try {
      const response = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, durationDays, unlimited }),
      });
      const data = (await response.json()) as { code?: string; error?: string };
      if (!response.ok || !data.code) throw new Error(data.error ?? "Kunne ikke opprette koden.");
      setNewCode(data.code);
      setComment("");
      await loadCodes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke opprette koden.");
    } finally {
      setBusy(false);
    }
  }

  async function updateCode(codeHash: string, action: "reset" | "revoke") {
    if (action === "revoke" && !window.confirm("Vil du sperre denne tilgangen?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/codes/${codeHash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke oppdatere koden.");
      setMessage(action === "reset" ? "Enheten er nullstilt. Samme kode kan brukes på nytt." : "Tilgangen er sperret.");
      await loadCodes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke oppdatere koden.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCode(codeHash: string) {
    if (!window.confirm("Vil du slette koden og eventuell aktiv tilgang permanent?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/codes/${codeHash}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Kunne ikke slette koden.");
      setMessage("Koden er slettet.");
      await loadCodes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunne ikke slette koden.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setCodes([]);
  }

  if (authenticated === undefined) {
    return (
      <main className="admin-shell admin-login-shell">
        <div className="game-unicorn-mark" aria-label="Laster spillverksted">
          <span aria-hidden="true">✦</span>
          <strong aria-hidden="true">🦄</strong>
          <span aria-hidden="true">✦</span>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-shell admin-login-shell">
        <section className="admin-login-card">
          <div className="game-unicorn-mark" aria-hidden="true">
            <span>✦</span>
            <strong>🦄</strong>
            <span>✦</span>
          </div>
          <p className="admin-kicker">Rosa regnbuerike</p>
          <h1>Spillverksted</h1>
          <p className="admin-login-intro">Bare for spillmestere.</p>
          <form onSubmit={login} className="admin-form">
            <label htmlFor="admin-password">Mesterpassord</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="submit" disabled={busy}>{busy ? "Åpner…" : "Åpne verkstedet"}</button>
          </form>
          {message ? <p className="admin-message admin-error" role="alert">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Rosa regnbuerike</p>
          <h1>Spillerkoder</h1>
        </div>
        <button type="button" className="admin-secondary" onClick={logout}>Lukk verkstedet</button>
      </header>

      <section className="admin-create-card">
        <div>
          <h2>Lag ny stjernekode</h2>
          <p>Koden bindes til den første spilleren som aktiverer den.</p>
        </div>
        <form onSubmit={createCode} className="admin-create-form">
          <label htmlFor="comment">Hvem skal få koden?</label>
          <input
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Eksempel: Ola Nordmann"
            maxLength={120}
            required
          />
          <label className="admin-unlimited-toggle" htmlFor="unlimited">
            <input
              id="unlimited"
              type="checkbox"
              checked={unlimited}
              onChange={(event) => setUnlimited(event.target.checked)}
            />
            <span>Ubegrenset tilgang</span>
          </label>
          {!unlimited ? (
            <>
              <label htmlFor="duration">Fast varighet fra aktivering</label>
              <div className="admin-duration-row">
                <input
                  id="duration"
                  type="number"
                  min={1}
                  max={3650}
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  required
                />
                <span>dager</span>
              </div>
            </>
          ) : null}
          <button type="submit" disabled={busy}>{busy ? "Tryller…" : "Lag stjernekode"}</button>
        </form>

        {newCode ? (
          <div className="admin-new-code" role="status">
            <span>Ny stjernekode — kopier den nå</span>
            <strong>{newCode}</strong>
            <button type="button" onClick={() => navigator.clipboard.writeText(newCode)}>Kopier kode</button>
          </div>
        ) : null}
      </section>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <section className="admin-list-section">
        <div className="admin-list-heading">
          <h2>Alle spillerkoder</h2>
          <span>{codes.length} totalt</span>
        </div>
        {codes.length === 0 ? <p className="admin-empty">Ingen spillerkoder er laget ennå.</p> : null}
        <div className="admin-code-list">
          {codes.map((code) => (
            <article className="admin-code-card" key={code.codeHash}>
              <div className="admin-code-topline">
                <strong>{code.comment}</strong>
                <span className={`admin-status admin-status-${code.status}`}>{statusLabels[code.status]}</span>
              </div>
              <p className="admin-code-mask">DTVIP-•••••-{code.codeSuffix}</p>
              <dl>
                <div><dt>Varighet</dt><dd>{code.durationDays === null ? "Ubegrenset" : `${code.durationDays} dager`}</dd></div>
                <div><dt>Opprettet</dt><dd>{formatDate(code.createdAt)}</dd></div>
                <div><dt>Aktivert av</dt><dd>{code.claimedName ?? "–"}</dd></div>
                <div><dt>Sist sett</dt><dd>{formatDate(code.lastSeenAt)}</dd></div>
              </dl>
              <div className="admin-code-actions">
                {code.status !== "unused" ? (
                  <button type="button" className="admin-secondary" disabled={busy} onClick={() => updateCode(code.codeHash, "reset")}>Nullstill enhet</button>
                ) : null}
                {code.status !== "revoked" ? (
                  <button type="button" className="admin-danger" disabled={busy} onClick={() => updateCode(code.codeHash, "revoke")}>Sperr</button>
                ) : null}
                <button type="button" className="admin-delete" disabled={busy} onClick={() => deleteCode(code.codeHash)}>Slett</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
