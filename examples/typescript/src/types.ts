/**
 * Shared types for the TypeScript example.
 *
 * Demonstrates defining domain types in a separate file and importing them
 * into Vue SFCs — a common pattern in real-world TypeScript projects.
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface Theme {
  primary: string;
  background: string;
  text: string;
}

export const themes = {
  light: {
    primary: '#0077ff',
    background: '#f5f5f5',
    text: '#111',
  },
  dark: {
    primary: '#66b3ff',
    background: '#1a1a2e',
    text: '#eee',
  },
} as const satisfies Record<string, Theme>;
