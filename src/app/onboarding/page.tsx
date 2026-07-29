"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile } from "../lib/supabase/profiles";
import { useAuth } from "../utils/isAuth";
import "./onboarding.scss";

const USERNAME_REGEX = /^[a-z0-9_-]+$/i;

function validateUsername(value: string): string | null {
  if (value.length < 3) return "Minimum 3 characters";
  if (value.length > 20) return "Maximum 20 characters";
  if (!/^[a-z]/i.test(value)) return "Must start with a letter";
  if (!USERNAME_REGEX.test(value)) return "Only letters, numbers, _ and -";
  return null;
}

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoading, role, refreshRole } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/"); return; }
    if (role !== "pending" && role !== null) router.push("/");
  }, [isLoading, user, role, router]);

  const handleRoleSelect = async (chosen: "buyer" | "seller") => {
    setPanelLoading(true);
    try {
      await updateProfile({ role: chosen });
      setStep(2);
    } catch (err) {
      console.error("Error setting role:", err);
      setPanelError("Error when setting role. Please try again.");
    } finally {
      setPanelLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setUsername(val);
    setUsernameError(validateUsername(val) ?? "");
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUsername(username);
    if (error) { setUsernameError(error); return; }

    setUsernameLoading(true);
    try {
      await updateProfile({ username });
      await refreshRole();
      router.push("/");
    } catch (err: any) {
      const isDuplicate =
        err?.code === "23505" ||
        err?.message?.toLowerCase().includes("unique") ||
        err?.message?.toLowerCase().includes("duplicate");
      setUsernameError(
        isDuplicate ? "This username is already in use" : "Error while saving. Try again."
      );
    } finally {
      setUsernameLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <main>
      {step === 1 && (
        <div className="onboarding-role-select">
          <button
            className="onboarding-panel onboarding-panel--buy"
            onClick={() => handleRoleSelect("buyer")}
            disabled={panelLoading}
          >
            <span className="onboarding-panel__label caveat">BUY</span>
            <span className="onboarding-panel__desc">
              I want to acquire a roofing business
            </span>
          </button>
          {panelError && (
            <span className="onboarding-panel-error">{panelError}</span>
          )}
          <button
            className="onboarding-panel onboarding-panel--sell"
            onClick={() => handleRoleSelect("seller")}
            disabled={panelLoading}
          >
            <span className="onboarding-panel__label caveat">SELL</span>
            <span className="onboarding-panel__desc">
              I want to sell my roofing business
            </span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-username">
          <h2>Choose your username</h2>
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="yourname"
              autoComplete="off"
              disabled={usernameLoading}
            />
            {usernameError && (
              <span className="onboarding-error">{usernameError}</span>
            )}
            <button
              type="submit"
              disabled={!!validateUsername(username) || usernameLoading}
            >
              {usernameLoading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
