import { t } from '../i18n/translations.js';
import { copyToClipboard, esc, formatIDR, renderImage, attachImageFallbacks, sanitizePhone } from '../utils/format.js';
import { showToast } from './toast.js';

let modalBackdrop = null;
let lastFocusedEl = null;

export function createModalRoot() {
  const backdrop = document.createElement('div');
  backdrop.id = 'modalBackdrop';
  backdrop.className = 'modal-backdrop hidden';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'modalTitle');
  backdrop.innerHTML = `
    <div class="modal-box">
      <button type="button" class="modal-close" id="modalCloseBtn" aria-label="Close dialog">&times;</button>
      <div id="modalContent"></div>
    </div>
  `;

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeModal();
    }
  });

  backdrop.querySelector('#modalCloseBtn')?.addEventListener('click', () => {
    closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalBackdrop && !modalBackdrop.classList.contains('hidden')) {
      closeModal();
    }
  });

  modalBackdrop = backdrop;
  return backdrop;
}

export function openModal(html, focusRestoreEl = null, lang = 'id') {
  if (!modalBackdrop) return;
  lastFocusedEl = focusRestoreEl || document.activeElement;
  const closeBtn = modalBackdrop.querySelector('#modalCloseBtn');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', t('modalClose', lang));
  }
  const content = modalBackdrop.querySelector('#modalContent');
  if (!content) return;
  content.innerHTML = html;
  attachImageFallbacks(content);
  modalBackdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  window.requestAnimationFrame(() => {
    const firstFocusable = content.querySelector('a[href], button:not([disabled]), input, select');
    (firstFocusable || closeBtn)?.focus();
  });
}

export function closeModal() {
  if (!modalBackdrop || modalBackdrop.classList.contains('hidden')) return;
  modalBackdrop.classList.add('hidden');
  document.body.style.overflow = '';
  const content = modalBackdrop.querySelector('#modalContent');
  if (content) content.innerHTML = '';
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
    lastFocusedEl.focus();
  }
  lastFocusedEl = null;
}

export function openDestinationModal(dest, { lang, isFav, onToggleFav, focusRestoreEl }) {
  const html = `
    <div class="modal-hero-img" style="overflow:hidden;border-radius:var(--r-md);margin-bottom:16px;aspect-ratio:16/9;">
      ${renderImage(dest.imageUrl, dest.nama)}
    </div>
    <div class="meta-line">
      <span>${esc(dest.wilayah)}</span>
      <span aria-hidden="true">&middot;</span>
      <span>${esc(dest.kategori)}</span>
    </div>
    <h3 id="modalTitle" style="font-size:1.5rem;margin-bottom:8px;">${esc(dest.nama)}</h3>
    <p style="color:var(--ink-secondary);margin-bottom:14px;">${esc(dest.deskripsi)}</p>
    <div class="card-details-list">
      <p><strong>${esc(t('modalAddress', lang))}:</strong> ${esc(dest.alamat)}</p>
      <p><strong>${esc(t('modalCost', lang))}:</strong> <span class="tabular">${esc(formatIDR(dest.estimasiBiaya))}</span></p>
      <p><strong>${esc(t('modalFacilities', lang))}:</strong> ${esc((dest.fasilitas || []).join(', '))}</p>
      <p><strong>${esc(t('modalWorship', lang))}:</strong> ${esc((dest.fasilitasIbadah || []).join(', '))}</p>
    </div>
    <div class="notice-bar" style="margin-top:14px;margin-bottom:0;">
      ${esc(dest.verifikasiInfo || t('verifyShort', lang))}
    </div>
    <div class="modal-actions">
      <a class="btn" href="${esc(dest.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('modalMaps', lang))}</a>
      <button type="button" class="btn btn-ghost" id="modalToggleFavBtn">
        ${esc(isFav ? t('modalFavRemove', lang) : t('modalFavAdd', lang))}
      </button>
    </div>
  `;

  openModal(html, focusRestoreEl, lang);

  const favBtn = modalBackdrop?.querySelector('#modalToggleFavBtn');
  favBtn?.addEventListener('click', () => {
    const added = onToggleFav();
    favBtn.textContent = added ? t('modalFavRemove', lang) : t('modalFavAdd', lang);
  });
}

export function openWhatsAppModal({ name, phone, lang, focusRestoreEl }) {
  const cleanPhone = sanitizePhone(phone);
  const message =
    lang === 'en'
      ? `Hello, I would like to ask about ${name} listed on cihuy explore.`
      : `Halo, saya ingin bertanya mengenai ${name} di panduan cihuy explore.`;
  const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  const html = `
    <h3 id="modalTitle" style="font-size:1.35rem;margin-bottom:8px;">${esc(t('waModalTitle', lang))}</h3>
    <p style="color:var(--ink-secondary);margin-bottom:14px;">${esc(t('waModalDesc', lang))}</p>
    <div class="card-details-list">
      <p><strong>${esc(name)}</strong></p>
      <p><strong>${esc(t('waModalNumber', lang))}:</strong> <span class="mono">+${esc(cleanPhone)}</span></p>
      <p><strong>${esc(t('waModalMessage', lang))}:</strong> "${esc(message)}"</p>
    </div>
    <div class="modal-actions">
      <a class="btn" href="${esc(waHref)}" target="_blank" rel="noopener noreferrer">${esc(t('waModalOpen', lang))}</a>
      <button type="button" class="btn btn-ghost" id="modalCopyPhoneBtn">${esc(t('waModalCopy', lang))}</button>
    </div>
  `;

  openModal(html, focusRestoreEl, lang);

  modalBackdrop?.querySelector('#modalCopyPhoneBtn')?.addEventListener('click', async () => {
    const ok = await copyToClipboard(`+${cleanPhone}`);
    if (ok) showToast(t('toastCopied', lang));
  });
}

export function openConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, focusRestoreEl, lang = 'id' }) {
  const html = `
    <h3 id="modalTitle" style="font-size:1.35rem;margin-bottom:10px;">${esc(title)}</h3>
    <p style="color:var(--ink-secondary);">${esc(message)}</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-danger" id="modalConfirmActionBtn">${esc(confirmLabel)}</button>
      <button type="button" class="btn btn-ghost" id="modalCancelActionBtn">${esc(cancelLabel)}</button>
    </div>
  `;

  openModal(html, focusRestoreEl, lang);

  modalBackdrop?.querySelector('#modalConfirmActionBtn')?.addEventListener('click', () => {
    closeModal();
    onConfirm?.();
  });
  modalBackdrop?.querySelector('#modalCancelActionBtn')?.addEventListener('click', () => {
    closeModal();
  });
}
