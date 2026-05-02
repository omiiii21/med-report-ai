const KEY_API = 'med-report:openrouter-key';
const KEY_MODEL = 'med-report:openrouter-model';

export function getApiKey(): string | null {
  try {
    return sessionStorage.getItem(KEY_API);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  try {
    if (key) sessionStorage.setItem(KEY_API, key);
    else sessionStorage.removeItem(KEY_API);
  } catch {
    /* ignore */
  }
}

export function getModel(): string | null {
  try {
    return localStorage.getItem(KEY_MODEL);
  } catch {
    return null;
  }
}

export function setModel(model: string): void {
  try {
    if (model) localStorage.setItem(KEY_MODEL, model);
    else localStorage.removeItem(KEY_MODEL);
  } catch {
    /* ignore */
  }
}

export function clearApiKey(): void {
  try {
    sessionStorage.removeItem(KEY_API);
  } catch {
    /* ignore */
  }
}
