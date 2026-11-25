export function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

export function safeUrl(url = '', fallback = '/images/illustrations/culture.svg') {
  const trimmed = String(url || '').trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return fallback;
}

export function formatIDR(amount) {
  const num = Number(amount);
  const safeNum = Number.isFinite(num) && num >= 0 ? num : 0;
  return 'Rp ' + safeNum.toLocaleString('id-ID');
}

export function renderImage(url, alt, className = '') {
  const src = esc(safeUrl(url));
  const safeAlt = esc(alt);
  const cls = className ? ` class="${esc(className)}"` : '';
  return `<img${cls} src="${src}" alt="${safeAlt}" loading="lazy" referrerpolicy="no-referrer" data-fallback-img="true" />`;
}

export function attachImageFallbacks(root = document) {
  root.querySelectorAll('img[data-fallback-img="true"]').forEach((img) => {
    if (img.dataset.bound === '1') return;
    img.dataset.bound = '1';
    img.addEventListener('error', () => {
      const alt = img.getAttribute('alt') || 'Aceh Explore';
      const wrapper = document.createElement('div');
      wrapper.className = 'img-fallback';
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', alt);
      wrapper.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 19l5.5-7 4 5 3-3.5L21 19H3z"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
        </svg>
        <span>${esc(alt)}</span>
      `;
      img.replaceWith(wrapper);
    });
  });
}

export function sanitizePhone(phone = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : '6281234567890';
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  return ok;
}
