"use client";

import { useState } from "react";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { Icon } from "@/components/icons";

export function AdminLogin() {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [show, setShow] = useState(false);

  return (
    <div className="rep-panel admin-login-panel">
      <p className="section-label">Admin only</p>
      <h2>Sign in</h2>
      <p className="rep-hint">Enter the admin password to manage the site.</p>
      <form action={formAction} className="rep-form">
        <div className="admin-pass-field">
          <input
            type={show ? "text" : "password"}
            name="password"
            placeholder="Enter the admin password"
            autoFocus
            autoComplete="current-password"
            aria-label="Admin password"
          />
          <button
            type="button"
            className="admin-pass-toggle"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            title={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
          >
            <Icon name={show ? "eye-off" : "eye"} />
          </button>
        </div>
        <button type="submit" disabled={pending} className="rep-btn">
          {pending ? "Checking…" : "Unlock"}
        </button>
      </form>
      {state?.error ? (
        <p className="rep-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
