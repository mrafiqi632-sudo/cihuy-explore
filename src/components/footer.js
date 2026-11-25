import { t } from '../i18n/translations.js';
import { getEffectiveRole } from '../state/store.js';
import { esc } from '../utils/format.js';

export function renderFooter(container, state) {
  const { lang } = state;
  const role = getEffectiveRole();

  const staffFooterLink =
    role === 'admin'
      ? `<a href="#admin">${esc(t('navAdmin', lang))}</a>`
      : role === 'operator'
        ? `<a href="#admin">${esc(t('navOperator', lang))}</a>`
        : '';

  container.innerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <a href="#top" class="brand-mark footer-brand">cihuy<span>.</span>explore</a>
            <p class="footer-copy">${esc(t('footerTagline', lang))}</p>
          </div>
          <nav class="footer-links" aria-label="Footer navigation">
            <a href="#destinations">${esc(t('navDest', lang))}</a>
            <a href="#map">${esc(t('navMap', lang))}</a>
            <a href="#culinary">${esc(t('navFood', lang))}</a>
            <a href="#stay">${esc(t('navStay', lang))}</a>
            <a href="#planner">${esc(t('navPlan', lang))}</a>
            ${staffFooterLink}
          </nav>
        </div>
        <div class="footer-bottom">
          <span>${esc(t('footerCopy', lang))}</span>
          <span class="mono">Aceh · 5.5483° N, 95.3238° E</span>
        </div>
      </div>
    </footer>
  `;
}
