import { onMounted, onUnmounted } from 'vue';

type Shortcut = {
  combo: string;
  handler: (event: KeyboardEvent) => void;
};

const normalize = (combo: string) =>
  combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .sort()
    .join('+');

const eventToCombo = (event: KeyboardEvent) => {
  const keys: string[] = [];
  if (event.shiftKey) keys.push('shift');
  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta');
  if (event.altKey) keys.push('alt');
  keys.push(event.key.toLowerCase());
  return keys.sort().join('+');
};

export const useShortcuts = (shortcuts: Shortcut[]) => {
  const map = new Map(shortcuts.map((shortcut) => [normalize(shortcut.combo), shortcut.handler]));

  const listener = (event: KeyboardEvent) => {
    const combo = eventToCombo(event);
    const handler = map.get(combo);
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  };

  onMounted(() => window.addEventListener('keydown', listener));
  onUnmounted(() => window.removeEventListener('keydown', listener));
};

