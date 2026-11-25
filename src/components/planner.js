import { CATEGORIES } from '../data/seed.js';
import { t } from '../i18n/translations.js';
import {
  addTripActivity,
  applyPackageToTrip,
  calculateBudgetSummary,
  clearTripActivities,
  loadTripFromStorage,
  removeTripActivity,
  saveTripToStorage,
  updateBudget,
  updatePackageFilter,
  updateTripMeta,
} from '../state/store.js';
import { copyToClipboard, esc, formatIDR } from '../utils/format.js';
import { showToast } from './toast.js';

export function updateItineraryListOnly(state) {
  const listEl = document.getElementById('itineraryDaysList');
  const daySelect = document.getElementById('planActDay');
  const { lang, trip, destinations } = state;

  // Sync top inputs when trip changes externally (e.g. Load Saved or Apply Package)
  const nameEl = document.getElementById('tripName');
  const dateEl = document.getElementById('tripDate');
  const daysEl = document.getElementById('tripDays');
  const travelersEl = document.getElementById('tripTravelers');
  if (nameEl && document.activeElement !== nameEl) nameEl.value = trip.namaPerjalanan;
  if (dateEl && document.activeElement !== dateEl) dateEl.value = trip.tanggalMulai;
  if (daysEl && document.activeElement !== daysEl) daysEl.value = String(trip.jumlahHari);
  if (travelersEl && document.activeElement !== travelersEl) travelersEl.value = String(trip.jumlahWisatawan);

  if (daySelect) {
    const prevVal = Number(daySelect.value) || 1;
    daySelect.innerHTML = Array.from({ length: trip.jumlahHari }, (_, idx) => {
      const dayNum = idx + 1;
      return `<option value="${dayNum}">${esc(t('dayLabel', lang))} ${dayNum}</option>`;
    }).join('');
    daySelect.value = String(Math.min(prevVal, trip.jumlahHari));
  }

  if (!listEl) return;

  listEl.innerHTML = Array.from({ length: trip.jumlahHari }, (_, idx) => {
    const dayNum = idx + 1;
    const acts = trip.daftarAktivitas.filter((a) => a.hari === dayNum);
    return `
      <div class="day-block">
        <div class="day-title">${esc(t('dayLabel', lang))} ${dayNum}</div>
        ${
          acts.length
            ? acts
                .map((act) => {
                  const dest = destinations.find((d) => d.id === act.destinasiId);
                  return `
                    <div class="itinerary-item">
                      <div class="itinerary-item-info">
                        <div class="itinerary-item-name">${esc(dest ? dest.nama : act.destinasiId)}</div>
                        ${act.catatan ? `<div class="itinerary-item-note">${esc(act.catatan)}</div>` : ''}
                      </div>
                      <button type="button" class="btn btn-danger btn-sm" data-remove-act="${esc(act.id)}">
                        ${esc(t('removeBtn', lang))}
                      </button>
                    </div>
                  `;
                })
                .join('')
            : `<p class="itinerary-item-note">${esc(t('noActivities', lang))}</p>`
        }
      </div>
    `;
  }).join('');
}

export function updateBudgetSummaryOnly(state) {
  const box = document.getElementById('budgetSummaryBox');
  if (!box) return;
  const { lang } = state;
  const s = calculateBudgetSummary();

  box.innerHTML = `
    <div style="font-size:0.8125rem;color:var(--ink-secondary);">${esc(t('estTotalLabel', lang))}</div>
    <div class="budget-total tabular">${esc(formatIDR(s.total))}</div>
    <div style="font-size:0.75rem;color:var(--ink-muted);margin-bottom:10px;" class="tabular">
      ${s.people} ${esc(t('travelersLabel', lang))} &middot; ${s.days} ${esc(t('daysUnit', lang))} &middot; ${s.rooms} ${esc(t('roomsNightsInfo', lang))} &times; ${s.nights} ${esc(t('nightsUnit', lang))}
    </div>
    <div class="budget-breakdown-list">
      <div class="budget-line">
        <span>${esc(t('breakdownTransport', lang))}</span>
        <span class="mono">${esc(formatIDR(s.transport))}</span>
      </div>
      <div class="budget-line">
        <span>${esc(t('breakdownHotel', lang))}</span>
        <span class="mono">${esc(formatIDR(s.hotel))}</span>
      </div>
      <div class="budget-line">
        <span>${esc(t('breakdownMeal', lang))}</span>
        <span class="mono">${esc(formatIDR(s.meal))}</span>
      </div>
      <div class="budget-line">
        <span>${esc(t('breakdownActivity', lang))}</span>
        <span class="mono">${esc(formatIDR(s.activity))}</span>
      </div>
    </div>
  `;
}

export function updatePackageGridOnly(state) {
  const grid = document.getElementById('packageGrid');
  if (!grid) return;
  const { lang, packages, packageFilter, destinations } = state;

  const matched = packages.filter((p) => {
    const okInterest = !packageFilter.interest || (p.minat || []).includes(packageFilter.interest);
    const okDuration = !packageFilter.maxDuration || Number(p.durasi) <= Number(packageFilter.maxDuration);
    const okBudget = !packageFilter.maxBudget || Number(p.estimasiBiaya) <= Number(packageFilter.maxBudget);
    return okInterest && okDuration && okBudget;
  });

  if (!matched.length) {
    grid.innerHTML = `<div class="empty-state">${esc(t('noPackages', lang))}</div>`;
    return;
  }

  grid.innerHTML = matched
    .map((pkg) => {
      const destNames = (pkg.daftarDestinasi || [])
        .map((id) => destinations.find((d) => d.id === id)?.nama || id)
        .join(', ');
      return `
        <article class="card">
          <div class="card-body">
            <div class="meta-line">
              <span>${esc(pkg.wilayah)}</span>
              <span aria-hidden="true">&middot;</span>
              <span class="tabular">${esc(pkg.durasi)} ${esc(t('daysUnit', lang))}</span>
            </div>
            <h3 class="card-title">${esc(pkg.nama)}</h3>
            <p class="card-desc">${esc(pkg.deskripsi)}</p>
            <div class="card-details-list" style="border-top:0;padding-top:0;">
              <p><strong>${esc(t('tabDestinations', lang))}:</strong> ${esc(destNames)}</p>
              <p><strong>${esc(t('interestLabel', lang))}:</strong> ${esc((pkg.minat || []).join(', '))}</p>
            </div>
            <div class="card-foot">
              <div class="price-text tabular">${esc(formatIDR(pkg.estimasiBiaya))}</div>
              <button type="button" class="btn btn-sm" data-use-pkg="${esc(pkg.id)}">
                ${esc(t('usePackageBtn', lang))}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

export function renderPlannerSection(container, state) {
  const { lang, destinations, trip, budget, packageFilter } = state;

  container.innerHTML = `
    <section class="section" id="planner">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(t('planKicker', lang))}</p>
            <h2>${esc(t('planTitle', lang))}</h2>
            <p class="section-sub">${esc(t('planSub', lang))}</p>
          </div>
        </div>

        <div class="split-grid">
          <div class="panel">
            <div class="panel-head">
              <h3>${esc(t('plannerHeading', lang))}</h3>
            </div>

            <div class="form-row">
              <div>
                <label class="field-label" for="tripName">${esc(t('tripNameLabel', lang))}</label>
                <input id="tripName" class="field" type="text" value="${esc(trip.namaPerjalanan)}" />
              </div>
              <div>
                <label class="field-label" for="tripDate">${esc(t('tripDateLabel', lang))}</label>
                <input id="tripDate" class="field" type="date" value="${esc(trip.tanggalMulai)}" />
              </div>
            </div>

            <div class="form-row" style="margin-top:12px;">
              <div>
                <label class="field-label" for="tripDays">${esc(t('durationLabel', lang))}</label>
                <input id="tripDays" class="field tabular" type="number" min="1" max="5" value="${esc(trip.jumlahHari)}" />
              </div>
              <div>
                <label class="field-label" for="tripTravelers">${esc(t('travelersLabel', lang))}</label>
                <input id="tripTravelers" class="field tabular" type="number" min="1" max="30" value="${esc(trip.jumlahWisatawan)}" />
              </div>
            </div>

            <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border-hairline);">
              <label class="field-label" for="planDestSelect">${esc(t('addActivityLabel', lang))}</label>
              <div class="form-row-3">
                <select id="planDestSelect" class="field">
                  ${destinations.map((d) => `<option value="${esc(d.id)}">${esc(d.nama)} (${esc(d.wilayah)})</option>`).join('')}
                </select>
                <select id="planActDay" class="field" aria-label="${esc(t('dayLabel', lang))}"></select>
                <button type="button" class="btn" id="addPlanActBtn">${esc(t('addBtn', lang))}</button>
              </div>
              <input
                id="planActNote"
                class="field"
                type="text"
                style="margin-top:10px;"
                placeholder="${esc(t('notePlaceholder', lang))}"
              />
            </div>

            <div id="itineraryDaysList" style="margin-top:16px;"></div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;">
              <button type="button" class="btn btn-sm" id="saveTripBtn">${esc(t('saveTripBtn', lang))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="loadTripBtn">${esc(t('loadTripBtn', lang))}</button>
              <button type="button" class="btn btn-ghost btn-sm" id="exportTripBtn">${esc(t('exportTripBtn', lang))}</button>
              <button type="button" class="btn btn-danger btn-sm" id="clearTripBtn">${esc(t('clearTripBtn', lang))}</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h3>${esc(t('budgetHeading', lang))}</h3>
            </div>
            <p style="font-size:0.8125rem;color:var(--ink-muted);margin-bottom:14px;">${esc(t('budgetSub', lang))}</p>

            <div class="form-row">
              <div>
                <label class="field-label" for="transportInput">${esc(t('transportLabel', lang))}</label>
                <input id="transportInput" class="field tabular" type="number" min="0" step="10000" value="${esc(budget.transport)}" />
              </div>
              <div>
                <label class="field-label" for="hotelInput">${esc(t('hotelLabel', lang))}</label>
                <input id="hotelInput" class="field tabular" type="number" min="0" step="10000" value="${esc(budget.hotel)}" />
              </div>
              <div>
                <label class="field-label" for="mealInput">${esc(t('mealLabel', lang))}</label>
                <input id="mealInput" class="field tabular" type="number" min="0" step="10000" value="${esc(budget.meal)}" />
              </div>
              <div>
                <label class="field-label" for="activityInput">${esc(t('activityLabel', lang))}</label>
                <input id="activityInput" class="field tabular" type="number" min="0" step="10000" value="${esc(budget.activityCost)}" />
              </div>
            </div>

            <div class="budget-summary" id="budgetSummaryBox"></div>
          </div>
        </div>

        <div class="panel package-panel">
          <div class="panel-head">
            <h3>${esc(t('packageHeading', lang))}</h3>
          </div>
          <div class="package-filter-grid">
            <div>
              <label class="field-label" for="pkgInterest">${esc(t('interestLabel', lang))}</label>
              <select id="pkgInterest" class="field">
                <option value="">${esc(t('allInterests', lang))}</option>
                ${CATEGORIES.map((c) => `<option value="${esc(c)}" ${packageFilter.interest === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label" for="pkgDays">${esc(t('maxDurationLabel', lang))}</label>
              <select id="pkgDays" class="field">
                <option value="2" ${Number(packageFilter.maxDuration) === 2 ? 'selected' : ''}>2 ${esc(t('daysUnit', lang))}</option>
                <option value="3" ${Number(packageFilter.maxDuration) === 3 ? 'selected' : ''}>3 ${esc(t('daysUnit', lang))}</option>
                <option value="5" ${Number(packageFilter.maxDuration) === 5 ? 'selected' : ''}>5 ${esc(t('daysUnit', lang))}</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="pkgBudget">${esc(t('maxBudgetLabel', lang))}</label>
              <input id="pkgBudget" class="field tabular" type="number" min="200000" step="50000" value="${esc(packageFilter.maxBudget)}" />
            </div>
            <button type="button" class="btn" id="findPkgBtn">${esc(t('findPackagesBtn', lang))}</button>
          </div>
          <div class="card-grid" id="packageGrid"></div>
        </div>
      </div>
    </section>
  `;

  // Bind trip metadata inputs
  container.querySelector('#tripName')?.addEventListener('input', (e) => {
    updateTripMeta({ namaPerjalanan: e.target.value });
  });
  container.querySelector('#tripDate')?.addEventListener('change', (e) => {
    updateTripMeta({ tanggalMulai: e.target.value });
  });
  container.querySelector('#tripDays')?.addEventListener('input', (e) => {
    updateTripMeta({ jumlahHari: e.target.value });
    updateBudgetSummaryOnly(state);
  });
  container.querySelector('#tripTravelers')?.addEventListener('input', (e) => {
    updateTripMeta({ jumlahWisatawan: e.target.value });
    updateBudgetSummaryOnly(state);
  });

  // Add/Remove activity
  container.querySelector('#addPlanActBtn')?.addEventListener('click', () => {
    const destId = container.querySelector('#planDestSelect')?.value;
    const dayVal = container.querySelector('#planActDay')?.value;
    const noteEl = container.querySelector('#planActNote');
    addTripActivity(destId, dayVal, noteEl?.value || '');
    if (noteEl) noteEl.value = '';
  });

  container.querySelector('#itineraryDaysList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-act]');
    if (!btn) return;
    removeTripActivity(btn.getAttribute('data-remove-act'));
  });

  // Save, Load, Export, Clear trip
  container.querySelector('#saveTripBtn')?.addEventListener('click', async () => {
    await saveTripToStorage();
    showToast(t('toastTripSaved', state.lang));
  });
  container.querySelector('#loadTripBtn')?.addEventListener('click', async () => {
    const loaded = await loadTripFromStorage();
    showToast(t(loaded ? 'toastTripLoaded' : 'toastNoSavedTrip', state.lang));
  });
  container.querySelector('#exportTripBtn')?.addEventListener('click', async () => {
    const summary = calculateBudgetSummary();
    const lines = [
      `${state.trip.namaPerjalanan} (${state.trip.tanggalMulai})`,
      `${state.trip.jumlahHari} ${t('daysUnit', state.lang)} · ${state.trip.jumlahWisatawan} ${t('travelersLabel', state.lang)}`,
      `${t('estTotalLabel', state.lang)}: ${formatIDR(summary.total)}`,
      '',
    ];
    for (let day = 1; day <= state.trip.jumlahHari; day += 1) {
      const items = state.trip.daftarAktivitas
        .filter((a) => a.hari === day)
        .map((a) => {
          const d = state.destinations.find((x) => x.id === a.destinasiId);
          return `- ${d ? d.nama : a.destinasiId}${a.catatan ? ` (${a.catatan})` : ''}`;
        });
      lines.push(`${t('dayLabel', state.lang)} ${day}:`);
      lines.push(items.length ? items.join('\n') : `- ${t('noActivities', state.lang)}`);
    }
    const ok = await copyToClipboard(lines.join('\n'));
    if (ok) showToast(t('toastTripExported', state.lang));
  });
  container.querySelector('#clearTripBtn')?.addEventListener('click', () => {
    clearTripActivities();
    showToast(t('toastTripCleared', state.lang));
  });

  // Budget calculator inputs
  container.querySelector('#transportInput')?.addEventListener('input', (e) => {
    updateBudget({ transport: Number(e.target.value) || 0 });
  });
  container.querySelector('#hotelInput')?.addEventListener('input', (e) => {
    updateBudget({ hotel: Number(e.target.value) || 0 });
  });
  container.querySelector('#mealInput')?.addEventListener('input', (e) => {
    updateBudget({ meal: Number(e.target.value) || 0 });
  });
  container.querySelector('#activityInput')?.addEventListener('input', (e) => {
    updateBudget({ activityCost: Number(e.target.value) || 0 });
  });

  // Package recommender
  const syncPackageFilters = () => {
    updatePackageFilter({
      interest: container.querySelector('#pkgInterest')?.value || '',
      maxDuration: Number(container.querySelector('#pkgDays')?.value) || 3,
      maxBudget: Number(container.querySelector('#pkgBudget')?.value) || 1500000,
    });
  };
  container.querySelector('#findPkgBtn')?.addEventListener('click', syncPackageFilters);
  container.querySelector('#pkgInterest')?.addEventListener('change', syncPackageFilters);
  container.querySelector('#pkgDays')?.addEventListener('change', syncPackageFilters);
  container.querySelector('#pkgBudget')?.addEventListener('input', syncPackageFilters);

  container.querySelector('#packageGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-use-pkg]');
    if (!btn) return;
    const pkg = applyPackageToTrip(btn.getAttribute('data-use-pkg'));
    if (pkg) {
      updateBudgetSummaryOnly(state);
      showToast(t('toastPackageApplied', state.lang));
    }
  });

  updateItineraryListOnly(state);
  updateBudgetSummaryOnly(state);
  updatePackageGridOnly(state);
}
