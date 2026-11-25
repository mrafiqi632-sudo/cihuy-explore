import { CATEGORIES, REGIONS } from '../data/seed.js';
import { t } from '../i18n/translations.js';
import {
  getEffectiveRole,
  isFavorite,
  resetFilters,
  setFilter,
  startQuickEditItem,
  toggleFavorite,
} from '../state/store.js';
import { attachImageFallbacks, esc, formatIDR, renderImage } from '../utils/format.js';
import { openDestinationModal } from './modal.js';
import { showToast } from './toast.js';

function getFilteredDestinations(state) {
  const { q, region, category, sort } = state.filters;
  const query = q.trim().toLowerCase();

  const items = state.destinations.filter((d) => {
    const matchesQuery =
      !query ||
      d.nama.toLowerCase().includes(query) ||
      d.wilayah.toLowerCase().includes(query) ||
      d.deskripsi.toLowerCase().includes(query) ||
      d.kategori.toLowerCase().includes(query);
    const matchesRegion = !region || d.wilayah === region;
    const matchesCategory = !category || d.kategori === category;
    return matchesQuery && matchesRegion && matchesCategory;
  });

  if (sort === 'name') {
    items.sort((a, b) => a.nama.localeCompare(b.nama));
  } else if (sort === 'cost') {
    items.sort((a, b) => (Number(a.estimasiBiaya) || 0) - (Number(b.estimasiBiaya) || 0));
  } else {
    items.sort((a, b) => Number(b.unggulan) - Number(a.unggulan));
  }

  return items;
}

export function renderDestinationGridOnly(state) {
  const grid = document.getElementById('destGrid');
  const countEl = document.getElementById('destCount');
  if (!grid) return;

  const { lang } = state;
  const items = getFilteredDestinations(state);

  if (countEl) {
    countEl.textContent = `${items.length} ${t('destCountLabel', lang)}`;
  }

  // Keep filter controls synchronized (e.g. when updated via Map or Reset)
  const searchEl = document.getElementById('filterSearch');
  const regionEl = document.getElementById('filterRegion');
  const categoryEl = document.getElementById('filterCategory');
  const sortEl = document.getElementById('filterSort');
  if (searchEl && document.activeElement !== searchEl) searchEl.value = state.filters.q;
  if (regionEl) regionEl.value = state.filters.region;
  if (categoryEl) categoryEl.value = state.filters.category;
  if (sortEl) sortEl.value = state.filters.sort;

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">${esc(t('noDestMatch', lang))}</div>`;
    return;
  }

  const isStaff = getEffectiveRole() !== 'user';

  grid.innerHTML = items
    .map((d) => {
      const fav = isFavorite(d.id);
      return `
        <article class="card">
          <div class="card-media">
            ${renderImage(d.imageUrl, d.nama)}
            <button
              type="button"
              class="fav-btn ${fav ? 'active' : ''}"
              data-fav-dest="${esc(d.id)}"
              aria-label="${esc(fav ? t('modalFavRemove', lang) : t('modalFavAdd', lang))}"
              aria-pressed="${fav}"
            >${fav ? '&#9829;' : '&#9825;'}</button>
          </div>
          <div class="card-body">
            <div class="meta-line">
              <span>${esc(d.wilayah)}</span>
              <span aria-hidden="true">&middot;</span>
              <span>${esc(d.kategori)}</span>
            </div>
            <h3 class="card-title">${esc(d.nama)}</h3>
            <p class="card-desc">${esc(d.deskripsi)}</p>
            <div class="status-text na">${esc(t('verifyShort', lang))}</div>
            <div class="card-foot">
              <div>
                <div class="price-text tabular">${esc(formatIDR(d.estimasiBiaya))}</div>
                <div class="price-unit">${esc(t('perPersonEst', lang))}</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                ${
                  isStaff
                    ? `<button type="button" class="btn btn-ghost btn-sm" data-quick-edit-dest="${esc(d.id)}">${esc(t('quickEditBtn', lang))}</button>`
                    : ''
                }
                <button type="button" class="btn btn-sm" data-open-dest="${esc(d.id)}">
                  ${esc(t('detailBtn', lang))}
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  attachImageFallbacks(grid);
}

export function renderDestinationsSection(container, state) {
  const { lang, filters } = state;

  container.innerHTML = `
    <section class="section" id="destinations">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('destKicker', lang))}</p>
            <h2>${esc(t('destTitle', lang))}</h2>
            <p class="section-sub">${esc(t('destSub', lang))}</p>
          </div>
          <span class="section-meta tabular" id="destCount"></span>
        </div>

        <div class="filter-bar">
          <div class="search-field">
            <label class="field-label" for="filterSearch">${esc(t('searchLabel', lang))}</label>
            <input
              id="filterSearch"
              class="field"
              type="search"
              value="${esc(filters.q)}"
              placeholder="${esc(t('searchPlaceholder', lang))}"
            />
          </div>
          <div>
            <label class="field-label" for="filterRegion">${esc(t('regionLabel', lang))}</label>
            <select id="filterRegion" class="field">
              <option value="">${esc(t('allRegions', lang))}</option>
              ${REGIONS.map((r) => `<option value="${esc(r)}" ${filters.region === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label" for="filterCategory">${esc(t('categoryLabel', lang))}</label>
            <select id="filterCategory" class="field">
              <option value="">${esc(t('allCategories', lang))}</option>
              ${CATEGORIES.map((c) => `<option value="${esc(c)}" ${filters.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label" for="filterSort">${esc(t('sortLabel', lang))}</label>
            <select id="filterSort" class="field">
              <option value="featured" ${filters.sort === 'featured' ? 'selected' : ''}>${esc(t('sortFeatured', lang))}</option>
              <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>${esc(t('sortName', lang))}</option>
              <option value="cost" ${filters.sort === 'cost' ? 'selected' : ''}>${esc(t('sortCost', lang))}</option>
            </select>
          </div>
          <button type="button" class="btn btn-ghost" id="resetFilterBtn">${esc(t('resetFilters', lang))}</button>
        </div>

        <div class="card-grid" id="destGrid"></div>
      </div>
    </section>
  `;

  container.querySelector('#filterSearch')?.addEventListener('input', (e) => {
    setFilter({ q: e.target.value });
  });
  container.querySelector('#filterRegion')?.addEventListener('change', (e) => {
    setFilter({ region: e.target.value });
  });
  container.querySelector('#filterCategory')?.addEventListener('change', (e) => {
    setFilter({ category: e.target.value });
  });
  container.querySelector('#filterSort')?.addEventListener('change', (e) => {
    setFilter({ sort: e.target.value });
  });
  container.querySelector('#resetFilterBtn')?.addEventListener('click', () => {
    resetFilters();
  });

  const grid = container.querySelector('#destGrid');
  grid?.addEventListener('click', (e) => {
    const quickEditBtn = e.target.closest('[data-quick-edit-dest]');
    if (quickEditBtn) {
      startQuickEditItem('destinations', quickEditBtn.getAttribute('data-quick-edit-dest'));
      return;
    }
    const favBtn = e.target.closest('[data-fav-dest]');
    if (favBtn) {
      const id = favBtn.getAttribute('data-fav-dest');
      const added = toggleFavorite(id, 'destinasi');
      showToast(t(added ? 'toastFavAdded' : 'toastFavRemoved', state.lang));
      return;
    }
    const detailBtn = e.target.closest('[data-open-dest]');
    if (detailBtn) {
      const id = detailBtn.getAttribute('data-open-dest');
      const dest = state.destinations.find((d) => d.id === id);
      if (!dest) return;
      openDestinationModal(dest, {
        lang: state.lang,
        isFav: isFavorite(dest.id),
        focusRestoreEl: detailBtn,
        onToggleFav: () => {
          const added = toggleFavorite(dest.id, 'destinasi');
          showToast(t(added ? 'toastFavAdded' : 'toastFavRemoved', state.lang));
          return added;
        },
      });
    }
  });

  renderDestinationGridOnly(state);
}
