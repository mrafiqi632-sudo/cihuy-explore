import { t } from '../i18n/translations.js';
import { getEffectiveRole, isFavorite, startQuickEditItem, toggleFavorite } from '../state/store.js';
import { attachImageFallbacks, esc, formatIDR, renderImage } from '../utils/format.js';
import { openWhatsAppModal } from './modal.js';
import { showToast } from './toast.js';

function getHalalBadgeInfo(status, lang) {
  if (status === 'terverifikasi') {
    return { cls: 'ok', text: t('halalVerified', lang) };
  }
  if (status === 'belum_terverifikasi') {
    return { cls: 'warn', text: t('halalUnverified', lang) };
  }
  return { cls: 'na', text: t('halalUnknown', lang) };
}

export function renderCulinarySection(container, state) {
  const { lang, foods } = state;
  const isStaff = getEffectiveRole() !== 'user';

  container.innerHTML = `
    <section class="section" id="culinary">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('foodKicker', lang))}</p>
            <h2>${esc(t('foodTitle', lang))}</h2>
            <p class="section-sub">${esc(t('foodSub', lang))}</p>
          </div>
          <span class="section-meta tabular">${foods.length} ${esc(t('tabFoods', lang))}</span>
        </div>

        <div class="card-grid" id="foodGrid">
          ${foods
            .map((f) => {
              const fav = isFavorite(f.id);
              const statusInfo = getHalalBadgeInfo(f.statusSertifikasiHalal, lang);
              return `
                <article class="card">
                  <div class="card-media">
                    ${renderImage(f.imageUrl, f.nama)}
                    <button
                      type="button"
                      class="fav-btn ${fav ? 'active' : ''}"
                      data-fav-food="${esc(f.id)}"
                      aria-label="${esc(fav ? t('modalFavRemove', lang) : t('modalFavAdd', lang))}"
                      aria-pressed="${fav}"
                    >${fav ? '&#9829;' : '&#9825;'}</button>
                  </div>
                  <div class="card-body">
                    <div class="meta-line">
                      <span>${esc(f.wilayah)}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>${esc(f.kategori)}</span>
                    </div>
                    <h3 class="card-title">${esc(f.nama)}</h3>
                    <div class="status-text ${statusInfo.cls}">${esc(statusInfo.text)}</div>
                    <p class="card-desc">${esc(f.sumberVerifikasi || '')}</p>
                    <div class="card-foot">
                      <div>
                        <div class="price-text tabular">${esc(formatIDR(f.harga))}</div>
                        <div class="price-unit">${esc(t('simPrice', lang))}</div>
                      </div>
                      <div style="display:flex;gap:6px;align-items:center;">
                        ${
                          isStaff
                            ? `<button type="button" class="btn btn-ghost btn-sm" data-quick-edit-food="${esc(f.id)}">${esc(t('quickEditBtn', lang))}</button>`
                            : ''
                        }
                        <button type="button" class="btn btn-sm" data-wa-food="${esc(f.id)}">
                          ${esc(t('contactSeller', lang))}
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

  const grid = container.querySelector('#foodGrid');
  grid?.addEventListener('click', (e) => {
    const quickEditBtn = e.target.closest('[data-quick-edit-food]');
    if (quickEditBtn) {
      startQuickEditItem('foods', quickEditBtn.getAttribute('data-quick-edit-food'));
      return;
    }
    const favBtn = e.target.closest('[data-fav-food]');
    if (favBtn) {
      const id = favBtn.getAttribute('data-fav-food');
      const added = toggleFavorite(id, 'kuliner');
      showToast(t(added ? 'toastFavAdded' : 'toastFavRemoved', state.lang));
      return;
    }
    const waBtn = e.target.closest('[data-wa-food]');
    if (waBtn) {
      const id = waBtn.getAttribute('data-wa-food');
      const food = state.foods.find((item) => item.id === id);
      if (!food) return;
      openWhatsAppModal({
        name: food.nama,
        phone: food.kontak,
        lang: state.lang,
        focusRestoreEl: waBtn,
      });
    }
  });
}
