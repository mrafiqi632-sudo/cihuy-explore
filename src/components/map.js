import { REGIONS } from '../data/seed.js';
import { t } from '../i18n/translations.js';
import { setFilter } from '../state/store.js';
import { esc } from '../utils/format.js';

const MAP_PINS = [
  { region: 'Sabang', label: 'Sabang', code: 'SB', x: 118, y: 74, labelY: 46 },
  { region: 'Banda Aceh', label: 'Banda Aceh', code: 'BA', x: 158, y: 122, labelY: 152 },
  { region: 'Aceh Besar', label: 'Aceh Besar', code: 'AB', x: 196, y: 156, labelY: 186 },
  { region: 'Bener Meriah', label: 'Bener Meriah', code: 'BM', x: 356, y: 158, labelY: 130 },
  { region: 'Aceh Tengah', label: 'Aceh Tengah', code: 'AT', x: 368, y: 204, labelY: 234 },
];

export function renderMapSection(container, state) {
  const { lang, destinations, filters } = state;

  const regionCounts = REGIONS.map((region) => ({
    region,
    count: destinations.filter((d) => d.wilayah === region).length,
  }));

  container.innerHTML = `
    <section class="section section-surface" id="map">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('mapKicker', lang))}</p>
            <h2>${esc(t('mapTitle', lang))}</h2>
            <p class="section-sub">${esc(t('mapSub', lang))}</p>
          </div>
          ${
            filters.region
              ? `<button type="button" class="btn btn-ghost btn-sm" id="mapClearRegionBtn">${esc(t('mapClearRegion', lang))}</button>`
              : ''
          }
        </div>

        <div class="map-layout">
          <div class="map-frame">
            <svg viewBox="0 0 600 320" role="img" aria-label="${esc(t('mapTitle', lang))}">
              <rect x="0" y="0" width="600" height="320" rx="12" fill="#dfece6" />
              <path
                d="M78,96 C105,60 158,76 226,104 C298,128 386,138 468,176 C512,198 536,244 504,274 C450,286 356,262 282,232 C202,202 128,174 84,132 Z"
                fill="#c2dcd1"
                stroke="#094c3b"
                stroke-width="2"
              />
              <circle cx="118" cy="74" r="18" fill="#c2dcd1" stroke="#094c3b" stroke-width="1.6" />
              <path d="M180,126 L360,180" stroke="#147a6c" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.55" />
              ${MAP_PINS.map((pin) => {
                const isActive = filters.region === pin.region;
                return `
                  <g
                    class="map-pin ${isActive ? 'active' : ''}"
                    data-map-region="${esc(pin.region)}"
                    role="button"
                    tabindex="0"
                    aria-label="${esc(pin.label)}"
                    aria-pressed="${isActive}"
                  >
                    <circle cx="${pin.x}" cy="${pin.y}" r="14"></circle>
                    <text x="${pin.x}" y="${pin.y}">${esc(pin.code)}</text>
                    <text
                      x="${pin.x}"
                      y="${pin.labelY}"
                      style="fill:#142822;font-family:var(--font-sans);font-size:12px;font-weight:700;"
                    >${esc(pin.label)}</text>
                  </g>
                `;
              }).join('')}
            </svg>
          </div>

          <div class="region-directory">
            <h3>${esc(t('mapDirectoryTitle', lang))}</h3>
            <div>
              ${regionCounts
                .map(({ region, count }) => {
                  const active = filters.region === region;
                  return `
                    <button
                      type="button"
                      class="region-row ${active ? 'active' : ''}"
                      data-dir-region="${esc(region)}"
                      aria-pressed="${active}"
                    >
                      <span class="region-row-name">${esc(region)}</span>
                      <span class="region-row-count tabular">${count} ${esc(t('mapDestinationsUnit', lang))}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              id="mapShowAllBtn"
              style="margin-top:auto;align-self:flex-start;"
            >${esc(t('mapClearRegion', lang))}</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const selectRegion = (region) => {
    setFilter({ region });
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
  };

  container.querySelectorAll('[data-map-region]').forEach((pin) => {
    const region = pin.getAttribute('data-map-region');
    pin.addEventListener('click', () => selectRegion(region));
    pin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectRegion(region);
      }
    });
  });

  container.querySelectorAll('[data-dir-region]').forEach((row) => {
    row.addEventListener('click', () => selectRegion(row.getAttribute('data-dir-region')));
  });

  container.querySelector('#mapClearRegionBtn')?.addEventListener('click', () => setFilter({ region: '' }));
  container.querySelector('#mapShowAllBtn')?.addEventListener('click', () => selectRegion(''));
}
