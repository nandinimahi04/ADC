/**
 * chat-rules.ts
 * ---------------------------------------------------------------
 * Rule-based "brain" of the AI Chat.
 * Pure functions only (no Angular, no network) so it is easy to
 * read, extend and test.
 *
 * Flow:  text -> clean -> split into clauses -> remove filler words
 *        -> match rules -> list of Intents
 * ---------------------------------------------------------------
 */

export type AppName = 'chrome' | 'notepad' | 'vscode' | 'calculator';
export type PowerCommand = 'shutdown' | 'restart' | 'lock' | 'sleep';

export type Intent =
  | { type: 'open_app'; app: AppName }
  | { type: 'power'; command: PowerCommand }
  | { type: 'battery' }
  | { type: 'system_info' }
  | { type: 'connection' }
  | { type: 'help' }
  | { type: 'greeting' }
  | { type: 'thanks' }
  | { type: 'clear_chat' }
  | { type: 'need_app' }
  | { type: 'unknown_app'; name: string }
  | { type: 'close_unsupported' }
  | { type: 'unknown'; text: string };

export const APP_LABELS: Record<AppName, string> = {
  chrome: 'Chrome',
  notepad: 'Notepad',
  vscode: 'VS Code',
  calculator: 'Calculator'
};

export const POWER_LABELS: Record<PowerCommand, { ask: string; done: string }> = {
  shutdown: { ask: 'shut down', done: 'Shutting down your PC…' },
  restart: { ask: 'restart', done: 'Restarting your PC…' },
  lock: { ask: 'lock', done: 'Your PC is locked.' },
  sleep: { ask: 'put to sleep', done: 'Putting your PC to sleep…' }
};

export const HELP_TEXT =
  `Here's what I can do:\n` +
  `• Open apps – "open Chrome", "launch Notepad", "start VS Code", "open calculator"\n` +
  `• Power – "lock pc", "sleep", "restart", "shutdown" (I always ask you to confirm first)\n` +
  `• Info – "battery", "system info", "am I connected?"\n` +
  `• Combine – "open chrome and notepad", "open vs code then lock pc"\n` +
  `• Chat – "help", "clear chat"\n\n` +
  `You can type naturally, e.g. "please open the chrome" works too.`;

// ------------------------------------------------------------------
// WORD LISTS  (add your own synonyms here)
// ------------------------------------------------------------------

/** Phrases that mean each app. Add more names if you like. */
const APP_ALIASES: Record<AppName, string[]> = {
  chrome: ['chrome', 'google chrome', 'chrome browser', 'browser', 'web browser', 'internet'],
  notepad: ['notepad', 'note pad', 'text editor'],
  vscode: ['vscode', 'vs code', 'visual studio code', 'visual studio', 'code editor', 'code'],
  calculator: ['calculator', 'calc']
};

/** Single words that are also matched with typo tolerance ("crome", "notpad"). */
const FUZZY_APP_WORDS: Array<[string, AppName]> = [
  ['chrome', 'chrome'],
  ['browser', 'chrome'],
  ['notepad', 'notepad'],
  ['vscode', 'vscode'],
  ['calculator', 'calculator']
];

const OPEN_VERBS = new Set([
  'open', 'launch', 'start', 'run', 'execute', 'load', 'boot', 'fire', 'bring', 'begin', 'opening'
]);

const CLOSE_VERBS = new Set([
  'close', 'quit', 'exit', 'kill', 'terminate', 'end', 'stop'
]);

/** Polite / filler words that are ignored. */
const FILLERS = new Set([
  'please', 'pls', 'plz', 'kindly', 'can', 'could', 'would', 'will', 'you', 'u',
  'the', 'a', 'an', 'my', 'me', 'for', 'to', 'now', 'just', 'right', 'quickly',
  'asap', 'jarvis', 'bro', 'buddy', 'i', 'want', 'need', 'wanna', 'like', 'let',
  'lets', 'go', 'ahead', 'it', 'up', 'app', 'application', 'software', 'program'
]);

const GREETING_WORDS = new Set([
  'hi', 'hii', 'hello', 'hey', 'yo', 'good', 'morning', 'afternoon', 'evening',
  'namaste', 'there', 'jarvis'
]);

const IGNORE_FOR_UNKNOWN = new Set([...OPEN_VERBS, ...GREETING_WORDS]);

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

/** Lower-case, remove punctuation, unify some phrases. */
export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/shut\s+down/g, 'shutdown')
    .replace(/(power|switch|turn)\s+off/g, 'shutdown')
    .replace(/[^a-z0-9\s,&+;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Edit distance that also counts a swapped pair ("chorme") as 1. */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array(b.length + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= b.length; j++) d[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function maxTypos(word: string): number {
  return word.length <= 7 ? 1 : 2;
}

/** True if any token equals `word` (or is a close typo of it). */
function hasWord(tokens: string[], word: string, fuzzy = false): boolean {
  return tokens.some(
    (t) => t === word || (fuzzy && t.length >= 5 && distance(t, word) <= maxTypos(word))
  );
}

function hasAny(tokens: string[], words: string[]): boolean {
  return words.some((w) => tokens.includes(w));
}

function findApps(text: string, tokens: string[]): AppName[] {
  const found = new Set<AppName>();
  const padded = ` ${text} `;

  (Object.keys(APP_ALIASES) as AppName[]).forEach((app) => {
    if (APP_ALIASES[app].some((alias) => padded.includes(` ${alias} `))) {
      found.add(app);
    }
  });

  // typo tolerance
  tokens.forEach((token) => {
    if (token.length < 5) return;
    FUZZY_APP_WORDS.forEach(([word, app]) => {
      if (distance(token, word) <= maxTypos(word)) found.add(app);
    });
  });

  return Array.from(found);
}

// ------------------------------------------------------------------
// YES / NO  (used for confirmations)
// ------------------------------------------------------------------

const YES = /^(yes|y|yeah|yep|yup|sure|ok|okay|confirm|confirmed|proceed|do it|go ahead|please do|yes please|continue|haan|ha)$/;
const NO = /^(no|n|nope|nah|cancel|stop|abort|dont|do not|never mind|nevermind|leave it|na|nahi)$/;

export function isYes(text: string): boolean {
  return YES.test(cleanText(text));
}

export function isNo(text: string): boolean {
  return NO.test(cleanText(text));
}

// ------------------------------------------------------------------
// MAIN PARSER
// ------------------------------------------------------------------

const SPLITTER = /\s*(?:,|&|\+|;|\band then\b|\bthen\b|\bafter that\b|\balso\b|\band\b)\s*/;

/** Turn one message into a list of intents (max 5). */
export function parseMessage(message: string): Intent[] {
  const cleaned = cleanText(message);
  const clauses = cleaned.split(SPLITTER).filter(Boolean);
  const intents: Intent[] = [];

  clauses.forEach((clause) => intents.push(...parseClause(clause)));

  if (intents.length === 0) {
    return [{ type: 'unknown', text: message.trim() }];
  }
  return intents.slice(0, 5);
}

function parseClause(clause: string): Intent[] {
  const raw = clause.split(' ').filter(Boolean);
  const tokens = raw.filter((w) => !FILLERS.has(w));
  const text = tokens.join(' ');

  if (raw.length === 0) return [];

  // greeting only
  if (raw.every((w) => GREETING_WORDS.has(w))) return [{ type: 'greeting' }];

  // clear chat
  if (/\b(clear|delete|reset|erase)\b.*\b(chat|history|messages|conversation)\b/.test(text)) {
    return [{ type: 'clear_chat' }];
  }

  // help
  if (
    hasAny(tokens, ['help', 'commands', 'examples', 'guide', 'instructions']) ||
    /what (can|do|could) (you|i)/.test(clause)
  ) {
    return [{ type: 'help' }];
  }

  // thanks
  if (hasAny(tokens, ['thanks', 'thank', 'thx', 'thanx', 'ty'])) {
    return [{ type: 'thanks' }];
  }

  // power commands
  if (hasWord(tokens, 'shutdown', true)) return [{ type: 'power', command: 'shutdown' }];
  if (hasWord(tokens, 'restart', true) || hasWord(tokens, 'reboot', true)) {
    return [{ type: 'power', command: 'restart' }];
  }
  if (hasWord(tokens, 'lock')) return [{ type: 'power', command: 'lock' }];
  if (hasAny(tokens, ['sleep', 'suspend', 'standby'])) {
    return [{ type: 'power', command: 'sleep' }];
  }

  // apps
  const apps = findApps(text, tokens);
  const hasOpenVerb = tokens.some((w) => OPEN_VERBS.has(w));
  const hasCloseVerb = tokens.some((w) => CLOSE_VERBS.has(w));

  if (hasCloseVerb && (apps.length > 0 || tokens.length <= 2)) {
    return [{ type: 'close_unsupported' }];
  }

  if (apps.length > 0) {
    return apps.map((app) => ({ type: 'open_app', app }) as Intent);
  }

  // info
  if (hasWord(tokens, 'battery', true) || hasAny(tokens, ['charge', 'charging', 'charged'])) {
    return [{ type: 'battery' }];
  }
  if (hasAny(tokens, ['connected', 'connection', 'online', 'paired', 'reachable'])) {
    return [{ type: 'connection' }];
  }
  if (hasAny(tokens, ['info', 'information', 'status', 'details', 'specs', 'device', 'os', 'overview', 'summary'])) {
    return [{ type: 'system_info' }];
  }

  // "open <something we don't know>"
  if (hasOpenVerb) {
    const name = tokens.filter((w) => !IGNORE_FOR_UNKNOWN.has(w)).join(' ');
    return name ? [{ type: 'unknown_app', name }] : [{ type: 'need_app' }];
  }

  return [{ type: 'unknown', text: clause }];
}