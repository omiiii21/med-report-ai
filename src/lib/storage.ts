import type { Provider } from './llm';

const PROVIDER_KEY = 'med-report:provider';
const apiKeyName = (p: Provider) => `med-report:key:${p}`;
const modelKeyName = (p: Provider) => `med-report:model:${p}`;

export function getProvider(): Provider {
  try {
    const v = localStorage.getItem(PROVIDER_KEY);
    return v === 'gemini' || v === 'openrouter' ? v : 'openrouter';
  } catch {
    return 'openrouter';
  }
}

export function setProvider(p: Provider): void {
  try {
    localStorage.setItem(PROVIDER_KEY, p);
  } catch {
    /* ignore */
  }
}

export function getApiKey(p: Provider): string | null {
  try {
    return sessionStorage.getItem(apiKeyName(p));
  } catch {
    return null;
  }
}

export function setApiKey(p: Provider, key: string): void {
  try {
    if (key) sessionStorage.setItem(apiKeyName(p), key);
    else sessionStorage.removeItem(apiKeyName(p));
  } catch {
    /* ignore */
  }
}

export function clearApiKey(p: Provider): void {
  try {
    sessionStorage.removeItem(apiKeyName(p));
  } catch {
    /* ignore */
  }
}

export function getModel(p: Provider): string | null {
  try {
    return localStorage.getItem(modelKeyName(p));
  } catch {
    return null;
  }
}

export function setModel(p: Provider, model: string): void {
  try {
    if (model) localStorage.setItem(modelKeyName(p), model);
    else localStorage.removeItem(modelKeyName(p));
  } catch {
    /* ignore */
  }
}

export function getActiveCredentials(): { provider: Provider; apiKey: string; model: string } | null {
  const provider = getProvider();
  const apiKey = getApiKey(provider);
  if (!apiKey) return null;
  return { provider, apiKey, model: getModel(provider) ?? '' };
}
