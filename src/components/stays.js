import { t } from '../i18n/translations.js';
import { getEffectiveRole, isFavorite, startQuickEditItem, toggleFavorite } from '../state/store.js';
import { attachImageFallbacks, esc, formatIDR, renderImage } from '../utils/format.js';
import { openWhatsAppModal } from './modal.js';
import { showToast } from './toast.js';

export function renderStaysSection(container, state) {
  const { lang, stays } = state;
  const isStaff = getEffectiveRole() !== 'user';

  container.innerHTML = `
    <section class="section section-surface" id="stay">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('stayKicker', lang))}</p>
            <h2>${esc(t('stayTitle', lang))}</h2>
            <p class="section-sub">${esc(t('staySub', lang))}</p>
          </div>
          <span class="section-meta tabular">${stays.length} ${esc(t('tabStays', lang))}</span>
        </div>

        <div class="card-grid" id="stayGrid">
          ${stays
            .map((h) => {
              const fav = isFavorite(h.id);
              return `
                <article class="card">
                  <div class="card-media">
                    ${renderImage(h.imageUrl, h.nama)}
                    <button
                      type="button"
                      class="fav-btn ${fav ? 'active' : ''}"
                      data-fav-stay="${esc(h.id)}"
                      aria-label="${esc(fav ? t('modalFavRemove', lang) : t('modalFavAdd', lang))}"
                      aria-pressed="${fav}"
                    >${fav ? '&#9829;' : '&#9825;'}</button>
                  </div>
                  <div class="card-body">
                    <div class="meta-line">
                      <span>${esc(h.wilayah)}</span>
                    </div>
                    <h3 class="card-title">${esc(h.nama)}</h3>
                    <div class="card-details-list" style="border-top:0;padding-top:0;">
                      <p><strong>${esc(t('facilitiesLabel', lang))}:</strong> ${esc((h.fasilitas || []).join(', '))}</p>
                      <p><strong>${esc(t('muslimFriendlyLabel', lang))}:</strong> ${esc((h.fasilitasRamahMuslim || []).join(', '))}</p>
                    </div>
                    <div class="status-text na">${esc(t('stayDisclaimer', lang))}</div>
                    <div class="card-foot">
                      <div>
                        <div class="price-text tabular">${esc(formatIDR(h.hargaPerMalam))}</div>
                        <div class="price-unit">${esc(t('perNightEst', lang))}</div>
                      </div>
                      <div style="display:flex;gap:6px;align-items:center;">
                        ${
                          isStaff
                            ? `<button type="button" class="btn btn-ghost btn-sm" data-quick-edit-stay="${esc(h.id)}">${esc(t('quickEditBtn', lang))}</button>`
                            : ''
                        }
                        <button type="button" class="btn btn-sm" data-wa-stay="${esc(h.id)}">
                          ${esc(t('contactStay', lang))}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;

  attachImageFallbacks(container);

  const grid = container.querySelector('#stayGrid');
  grid?.addEventListener('click', (e) => {
    const quickEditBtn = e.target.closest('[data-quick-edit-stay]');
    if (quickEditBtn) {
      startQuickEditItem('stays', quickEditBtn.getAttribute('data-quick-edit-stay'));
      return;
    }
    const favBtn = e.target.closest('[data-fav-stay]');
    if (favBtn) {
      const id = favBtn.getAttribute('data-fav-stay');
      const added = toggleFavorite(id, 'penginapan');
      showToast(t(added ? 'toastFavAdded' : 'toastFavRemoved', state.lang));
      return;
    }
    const waBtn = e.target.closest('[data-wa-stay]');
    if (waBtn) {
      const id = waBtn.getAttribute('data-wa-stay');
      const stay = state.stays.find((item) => item.id === id);
      if (!stay) return;
      openWhatsAppModal({
        name: stay.nama,
        phone: stay.kontak,
        lang: state.lang,
        focusRestoreEl: waBtn,
      });
    }
  });
}
