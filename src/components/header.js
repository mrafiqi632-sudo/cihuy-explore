import { t } from '../i18n/translations.js';
import { getEffectiveRole, logoutAction } from '../state/store.js';
import { esc } from '../utils/format.js';
import { showToast } from './toast.js';

export function renderHeader(container, state) {
  const { lang, favorites } = state;
  const favCount = favorites.length;
  const role = getEffectiveRole();

  const staffNavLink =
    role === 'admin'
      ? `<a href="#admin">${esc(t('navAdmin', lang))}</a>`
      : role === 'operator'
        ? `<a href="#admin">${esc(t('navOperator', lang))}</a>`
        : '';

  container.innerHTML = `
    <header class="site-header">
      <div class="wrap nav-inner">
        <a href="#top" class="brand-mark">cihuy<span>.</span>explore</a>

        <nav class="nav-links" id="primaryNav" aria-label="Main navigation">
          <a href="#destinations">${esc(t('navDest', lang))}</a>
          <a href="#culinary">${esc(t('navFood', lang))}</a>
          <a href="#stay">${esc(t('navStay', lang))}</a>
          <a href="#planner">${esc(t('navPlan', lang))}</a>
          ${staffNavLink}
        </nav>

        <div class="nav-cta-zone">
          <a href="#favorites" class="btn btn-ghost btn-sm">
            ${esc(t('favorites', lang))} (<span class="tabular" id="headerFavCount">${favCount}</span>)
          </a>
          <button type="button" class="btn btn-sm" id="signOutBtn">
            ${esc(t('signOutBtn', lang))}
          </button>
          <button
            type="button"
            class="menu-toggle"
            id="mobileMenuToggle"
            aria-expanded="false"
            aria-controls="primaryNav"
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `;

  const toggleBtn = container.querySelector('#mobileMenuToggle');
  const nav = container.querySelector('#primaryNav');
  toggleBtn?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    });
  });

  container.querySelector('#signOutBtn')?.addEventListener('click', async () => {
    await logoutAction();
    showToast(t('toastSignedOut', state.lang));
  });
}

export function updateHeaderFavCount(count) {
  const badge = document.getElementById('headerFavCount');
  if (badge) badge.textContent = String(count);
}
