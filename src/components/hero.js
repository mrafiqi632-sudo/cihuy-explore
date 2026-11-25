import { REGIONS } from '../data/seed.js';
import { t } from '../i18n/translations.js';
import { getEffectiveRole, setLang, setPreviewRole } from '../state/store.js';
import { esc } from '../utils/format.js';

function getRoleLabel(role, lang) {
  if (role === 'admin') return t('roleAdminLabel', lang);
  if (role === 'operator') return t('roleOperatorLabel', lang);
  return t('roleUserLabel', lang);
}

export function renderHero(container, state) {
  const { lang, destinations, packages, auth } = state;
  const user = auth.user;
  const effectiveRole = getEffectiveRole();
  const isRealAdmin = user?.role === 'admin';

  container.innerHTML = `
    <section class="hero" id="top">
      <div class="wrap">
        <div class="hero-top-row">
          <p class="hero-eyebrow">${esc(t('heroEyebrow', lang))}</p>
          <div class="segmented" role="group" aria-label="Language selector">
            <button type="button" data-lang-btn="id" class="${lang === 'id' ? 'active' : ''}" aria-pressed="${lang === 'id'}">ID</button>
            <button type="button" data-lang-btn="en" class="${lang === 'en' ? 'active' : ''}" aria-pressed="${lang === 'en'}">EN</button>
          </div>
        </div>

        ${
          user
            ? `
            <div class="hero-session-strip">
              <div class="hero-session-info">
                <span>${esc(t('signedInAs', lang))}: <strong>${esc(user.displayName)}</strong></span>
                <span class="role-tag ${esc(effectiveRole)}">${esc(t('activeRolePrefix', lang))}: ${esc(getRoleLabel(effectiveRole, lang))}</span>
                ${
                  user.isDemo
                    ? `<span style="font-size:0.75rem;color:var(--brand-gold-soft);font-weight:600;">${esc(t('demoBadgeLabel', lang))}</span>`
                    : ''
                }
              </div>
              ${
                isRealAdmin
                  ? `
                  <div class="role-preview-controls">
                    <label for="rolePreviewSelect">${esc(t('previewModeLabel', lang))}:</label>
                    <select id="rolePreviewSelect" class="role-preview-select">
                      <option value="admin" ${effectiveRole === 'admin' ? 'selected' : ''}>${esc(t('roleAdminLabel', lang))}</option>
                      <option value="operator" ${effectiveRole === 'operator' ? 'selected' : ''}>${esc(t('roleOperatorLabel', lang))}</option>
                      <option value="user" ${effectiveRole === 'user' ? 'selected' : ''}>${esc(t('roleUserLabel', lang))}</option>
                    </select>
                  </div>
                `
                  : ''
              }
            </div>
          `
            : ''
        }

        <div class="hero-grid">
          <div>
            <h1>${esc(t('heroTitle', lang))}</h1>
            <p class="hero-desc">${esc(t('heroDesc', lang))}</p>
            <div class="hero-actions">
              <a class="btn btn-gold" href="#destinations">${esc(t('exploreCta', lang))}</a>
              <a class="btn btn-ghost" href="#planner">${esc(t('planCta', lang))}</a>
              ${
                effectiveRole !== 'user'
                  ? `<a class="btn btn-ghost" href="#admin">${esc(effectiveRole === 'admin' ? t('navAdmin', lang) : t('navOperator', lang))}</a>`
                  : ''
              }
            </div>
          </div>

          <svg class="hero-motif" viewBox="0 0 220 220" fill="none" aria-hidden="true">
            <rect x="26" y="26" width="168" height="168" rx="18" stroke="rgba(230,195,122,0.55)" stroke-width="1.5"/>
            <polygon points="110,16 204,110 110,204 16,110" stroke="rgba(230,195,122,0.7)" stroke-width="1.5"/>
            <circle cx="110" cy="110" r="44" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
            <path d="M110 48L130 90L172 110L130 130L110 172L90 130L48 110L90 90Z" stroke="rgba(230,195,122,0.85)" stroke-width="1.5"/>
            <circle cx="110" cy="110" r="10" fill="rgba(230,195,122,0.75)"/>
          </svg>
        </div>

        <div class="hero-kpi-strip">
          <div class="kpi-item">
            <strong class="tabular">${REGIONS.length}</strong>
            <span>${esc(t('statRegions', lang))}</span>
          </div>
          <div class="kpi-item">
            <strong class="tabular">${destinations.length}+</strong>
            <span>${esc(t('statPlaces', lang))}</span>
          </div>
          <div class="kpi-item">
            <strong class="tabular">${packages.length}</strong>
            <span>${esc(t('statPackages', lang))}</span>
          </div>
          <div class="kpi-item">
            <strong class="tabular">100%</strong>
            <span>${esc(t('statLocal', lang))}</span>
          </div>
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-lang-btn');
      if (nextLang && nextLang !== state.lang) {
        setLang(nextLang);
      }
    });
  });

  container.querySelector('#rolePreviewSelect')?.addEventListener('change', (e) => {
    setPreviewRole(e.target.value);
  });
}
