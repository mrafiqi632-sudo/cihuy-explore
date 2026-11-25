let toastTimer = null;

export function createToastElement() {
  const el = document.createElement('div');
  el.id = 'toast';
  el.className = 'toast hidden';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  return el;
}

export function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = String(message || '');
  el.classList.remove('hidden');
  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    el.classList.add('hidden');
  }, 2600);
}
