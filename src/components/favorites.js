import { t } from '../i18n/translations.js';
import { toggleFavorite } from '../state/store.js';
import { attachImageFallbacks, esc, formatIDR, renderImage } from '../utils/format.js';
import { showToast } from './toast.js';

function resolveFavoriteItem(fav, state) {
  if (fav.tipeItem === 'destinasi') {
    const d = state.destinations.find((x) => x.id === fav.itemId);
    if (!d) return null;
    return {
      id: d.id,
      tipe: 'destinasi',
      typeLabel: t('typeDest', state.lang),
      nama: d.nama,
      wilayah: d.wilayah,
      imageUrl: d.imageUrl,
      price: formatIDR(d.estimasiBiaya),
    };
  }
  if (fav.tipeItem === 'kuliner') {
    const f = state.foods.find((x) => x.id === fav.itemId);
    if (!f) return null;
    return {
      id: f.id,
      tipe: 'kuliner',
      typeLabel: t('typeFood', state.lang),
      nama: f.nama,
      wilayah: f.wilayah,
      imageUrl: f.imageUrl,
      price: formatIDR(f.harga),
    };
  }
  const h = state.stays.find((x) => x.id === fav.itemId);
  if (!h) return null;
  return {
    id: h.id,
    tipe: 'penginapan',
    typeLabel: t('typeStay', state.lang),
    nama: h.nama,
    wilayah: h.wilayah,
    imageUrl: h.imageUrl,
    price: formatIDR(h.hargaPerMalam),
  };
}

export function renderFavoritesSection(container, state) {
  const { lang, favorites } = state;
  const resolved = favorites.map((fav) => resolveFavoriteItem(fav, state)).filter(Boolean);

  container.innerHTML = `
    <section class="section section-surface" id="favorites">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('favKicker', lang))}</p>
            <h2>${esc(t('favTitle', lang))}</h2>
            <p class="section-sub">${esc(t('favSub', lang))}</p>
          </div>
          <span class="section-meta tabular">${resolved.length} ${esc(t('favorites', lang))}</span>
        </div>

        <div class="card-grid" id="favGrid">
          ${
            resolved.length
              ? resolved
                  .map(
                    (item) => `
                <article class="card">
                  <div class="card-media">
                    ${renderImage(item.imageUrl, item.nama)}
                  </div>
                  <div class="card-body">
                    <div class="meta-line">
                      <span>${esc(item.typeLabel)}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>${esc(item.wilayah)}</span>
                    </div>
                    <h3 class="card-title">${esc(item.nama)}</h3>
                    <div class="card-foot">
                      <span class="price-text tabular">${esc(item.price)}</span>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        data-remove-fav="${esc(item.id)}"
                        data-remove-type="${esc(item.tipe)}"
                      >${esc(t('removeFavBtn', lang))}</button>
                    </div>
                  </div>
                </article>
              `
                  )
                  .join('')
              : `<div class="empty-state">${esc(t('noFavorites', lang))}</div>`
          }
        </div>
      </div>
    </section>
  `;

  attachImageFallbacks(container);

  container.querySelector('#favGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-fav]');
    if (!btn) return;
    const id = btn.getAttribute('data-remove-fav');
    const tipe = btn.getAttribute('data-remove-type');
    toggleFavorite(id, tipe);
    showToast(t('toastFavRemoved', state.lang));
  });
}
