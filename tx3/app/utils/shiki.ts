import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

let highlighterInstance: HighlighterCore | null = null;
let highlighterPromise: Promise<HighlighterCore> | null = null;

export async function getHighlighter(): Promise<HighlighterCore> {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Return existing promise if creation is in progress
  if (highlighterPromise) {
    return highlighterPromise;
  }

  // Create new highlighter instance
  highlighterPromise = createHighlighterCore({
    themes: [
      import('shiki/themes/dracula.mjs'),
    ],
    langs: [
      import('./tx3.tmLanguage.json'),
    ],
    // `shiki/wasm` contains the wasm binary inlined as base64 string.
    engine: createOnigurumaEngine(import('shiki/wasm'))
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

// Optional: Export a function to dispose the highlighter when needed
export function disposeHighlighter(): void {
  if (highlighterInstance) {
    highlighterInstance.dispose();
    highlighterInstance = null;
    highlighterPromise = null;
  }
}