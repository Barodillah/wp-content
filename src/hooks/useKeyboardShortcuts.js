import { useEffect } from 'react';

/**
 * Checks if the event target is a text input, textarea, or contentEditable element
 */
export function isTypingInInput(target) {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toLowerCase() : '';
  if (tagName === 'input') {
    const type = target.type ? target.type.toLowerCase() : 'text';
    // Checkbox and radio buttons don't block general shortcuts
    return type !== 'checkbox' && type !== 'radio' && type !== 'button' && type !== 'submit';
  }
  if (tagName === 'textarea' || tagName === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Hook to register global keyboard shortcuts
 * @param {Array<{ key: string, ctrl?: boolean, shift?: boolean, alt?: boolean, allowInInput?: boolean, action: (e: KeyboardEvent) => void }>} shortcuts
 */
export function useKeyboardShortcuts(shortcuts = [], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event) {
      const inInput = isTypingInInput(event.target);

      for (const item of shortcuts) {
        if (!item || typeof item.action !== 'function') continue;

        // Skip if typing in an input unless explicitly allowed (e.g. Escape)
        if (inInput && !item.allowInInput) continue;

        const keyMatches =
          item.key.toLowerCase() === event.key.toLowerCase() ||
          item.key === event.code;

        if (!keyMatches) continue;

        const ctrlMatches = !!item.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatches = item.shift !== undefined
          ? (!!item.shift === event.shiftKey)
          : (item.key === '?' ? true : !event.shiftKey);
        const altMatches = !!item.alt === event.altKey;

        if (ctrlMatches && shiftMatches && altMatches) {
          item.action(event);
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}
