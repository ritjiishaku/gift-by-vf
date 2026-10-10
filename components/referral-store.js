"use client";

const REF_KEY = "vf_referral";
const NEW_KEY = "vf_ref_new";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

let ref = null;
const listeners = new Set();

export function getReferral() {
  return ref;
}

export function setReferral(value) {
  ref = value;
  listeners.forEach((fn) => fn());
}

export function subscribeReferral(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readStoredReferral() {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.rep_id || Date.now() - parsed.arrive_at > MAX_AGE) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return { rep_id: parsed.rep_id, name: parsed.rep_id };
  } catch (e) {
    return null;
  }
}

export function storeReferral(repId) {
  try {
    const clean = String(repId).replace(/[^a-z0-9_-]/gi, "").toLowerCase().slice(0, 30);
    if (!clean) return null;
    localStorage.setItem(REF_KEY, JSON.stringify({ rep_id: clean, arrive_at: Date.now() }));
    return clean;
  } catch (e) {
    return null;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(REF_KEY);
    localStorage.removeItem(NEW_KEY);
  } catch (e) {}
  setReferral(null);
}

export { REF_KEY, NEW_KEY };