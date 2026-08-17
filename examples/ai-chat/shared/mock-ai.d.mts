/** Type declarations for the shared mock module (imported by both the node server and the client bundle). */

export interface SeedChat {
  id: string;
  title: string;
  ageMs: number;
  q: string;
  a: string;
}

export const SEED_CHATS: SeedChat[];

export const MODELS: Array<{ label: string; value: string; icon: string }>;

export type MockStep =
  | { kind: 'reasoning' | 'text'; text: string }
  | { kind: 'tool'; name: string; input: Record<string, unknown>; output: Record<string, unknown> }
  | { kind: 'source'; url: string; title?: string };

export function mockResponseFor(prompt: string, model: string): MockStep[];

export function mockTitleFor(firstMessage: { parts?: Array<{ type: string; text?: string }> } | undefined): string;
