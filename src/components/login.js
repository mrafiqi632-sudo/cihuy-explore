import { t } from '../i18n/translations.js';
import {
  loginAsDemoRole,
  loginWithEmailAction,
  loginWithGoogleAction,
  logoutAction,
  refreshVerificationAction,
  registerWithEmailAction,
  resendVerificationAction,
  resetPasswordAction,
  setAuthMode,
  setLang,
} from '../state/store.js';
import { esc } from '../utils/format.js';
import { showToast } from './toast.js';

export function renderAuthLoading(container, lang = 'id') {
  container.innerHTML = `
    <div class="auth-loading-shell">
      <div class="auth-loading-card">
        <div class="brand-mark" style="margin-bottom:10px;">cihuy<span>.</span>explore</div>
        <p style="color:var(--ink-muted);font-size:0.875rem;">${esc(t('authLoading', lang))}</p>
      </div>
    </div>
  `;
}

function renderVerificationCard(lang, auth) {
  return `
    <section class="login-card" aria-labelledby="verifyTitleHeading">
      <h2 id="verifyTitleHeading">${esc(t('verifyTitle', lang))}</h2>
      <p class="login-card-sub" style="margin-bottom:10px;">${esc(t('verifyDesc', lang))}</p>
      <p class="mono" style="font-size:0.875rem;font-weight:700;color:var(--brand-primary);margin-bottom:12px;">
        ${esc(auth.unverifiedEmail || '')}
      </p>
      <p style="font-size:0.875rem;color:var(--ink-secondary);margin-bottom:20px;">
        ${esc(t('verifyHint', lang))}
      </p>

      <div class="login-form">
        <button type="button" class="btn btn-google" id="verifyCheckBtn" ${auth.signingIn ? 'disabled' : ''}>
          ${esc(auth.signingIn ? t('loginSigningIn', lang) : t('verifyCheckBtn', lang))}
        </button>
        <button type="button" class="btn btn-ghost btn-google" id="verifyResendBtn">
          ${esc(t('verifyResendBtn', lang))}
        </button>
        <button type="button" class="btn btn-danger btn-google" id="verifySwitchBtn">
          ${esc(t('verifySwitchAccountBtn', lang))}
        </button>
      </div>

      ${auth.error ? `<div class="form-error" role="alert">${esc(auth.error)}</div>` : ''}
    </section>
  `;
}

function renderCredentialsCard(lang, auth) {
  const isRegister = auth.mode === 'register';

  return `
    <section class="login-card" aria-labelledby="loginTitleHeading">
      <h2 id="loginTitleHeading">${esc(t('loginBoxTitle', lang))}</h2>
      <p class="login-card-sub">${esc(t('loginBoxSub', lang))}</p>

      <div class="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          class="tab-btn ${!isRegister ? 'active' : ''}"
          aria-selected="${!isRegister}"
          data-auth-mode="login"
        >${esc(t('authTabLogin', lang))}</button>
        <button
          type="button"
          role="tab"
          class="tab-btn ${isRegister ? 'active' : ''}"
          aria-selected="${isRegister}"
          data-auth-mode="register"
        >${esc(t('authTabRegister', lang))}</button>
      </div>

      <form id="emailAuthForm" class="login-form" novalidate>
        ${
          isRegister
            ? `
            <div>
              <label class="field-label" for="authName">${esc(t('authNameLabel', lang))}</label>
              <input
                id="authName"
                class="field"
                type="text"
                autocomplete="name"
                placeholder="${esc(t('authNamePlaceholder', lang))}"
                required
              />
            </div>
          `
            : ''
        }

        <div>
          <label class="field-label" for="authEmail">${esc(t('authEmailLabel', lang))}</label>
          <input
            id="authEmail"
            class="field"
            type="email"
            autocomplete="email"
            placeholder="${esc(t('authEmailPlaceholder', lang))}"
            required
          />
        </div>

        <div>
          <label class="field-label" for="authPassword">${esc(t('authPasswordLabel', lang))}</label>
          <input
            id="authPassword"
            class="field"
            type="password"
            autocomplete="${isRegister ? 'new-password' : 'current-password'}"
            minlength="6"
            placeholder="${esc(t('authPasswordPlaceholder', lang))}"
            required
          />
        </div>

        ${
          !isRegister
            ? `
            <div class="login-helper-row">
              <button type="button" class="btn-link-inline" id="forgotPasswordBtn">
                ${esc(t('forgotPasswordBtn', lang))}
              </button>
            </div>
          `
            : ''
        }

        <button type="submit" class="btn btn-google" ${auth.signingIn ? 'disabled' : ''}>
          ${esc(
            auth.signingIn
              ? t('loginSigningIn', lang)
              : isRegister
                ? t('registerEmailBtn', lang)
                : t('loginEmailBtn', lang)
          )}
        </button>
      </form>

      <div id="emailAuthStatus" class="auth-info-box hidden" role="status"></div>
      <div id="emailAuthLocalError" class="form-error hidden" role="alert"></div>
      ${auth.error ? `<div class="form-error" role="alert">${esc(auth.error)}</div>` : ''}

      <div class="auth-divider"><span>${esc(t('authDividerText', lang))}</span></div>

      <button
        type="button"
        class="btn btn-ghost btn-google"
        id="googleLoginBtn"
        ${auth.signingIn ? 'disabled' : ''}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 11.1h-9.17v2.92h5.27c-.45 2.38-2.46 3.74-5.27 3.74a6.06 6.06 0 1 1 0-12.12c1.55 0 2.95.58 4.02 1.53l2.18-2.18A9.12 9.12 0 1 0 12.18 21c5.26 0 9.17-3.7 9.17-9.03 0-.62-.06-1.23-.16-1.87Z"/>
        </svg>
        <span>${esc(auth.signingIn ? t('loginSigningIn', lang) : t('loginGoogleBtn', lang))}</span>
      </button>

      <div class="demo-accounts-box">
        <div class="demo-accounts-title">${esc(t('demoSectionTitle', lang))}</div>
        <p class="demo-accounts-sub">${esc(t('demoSectionSub', lang))}</p>
        <div class="demo-role-grid">
          <button type="button" class="demo-role-btn" data-demo-role="user">
            <div>
              <div class="demo-role-name">${esc(t('demoUserBtn', lang))}</div>
              <div class="demo-role-email mono">demo-user@cihuy.local</div>
            </div>
            <span class="role-tag user">${esc(t('roleUserLabel', lang))}</span>
          </button>
          <button type="button" class="demo-role-btn" data-demo-role="operator">
            <div>
              <div class="demo-role-name">${esc(t('demoOperatorBtn', lang))}</div>
              <div class="demo-role-email mono">demo-operator@cihuy.local</div>
            </div>
            <span class="role-tag operator">${esc(t('roleOperatorLabel', lang))}</span>
          </button>
          <button type="button" class="demo-role-btn" data-demo-role="admin">
            <div>
              <div class="demo-role-name">${esc(t('demoAdminBtn', lang))}</div>
              <div class="demo-role-email mono">demo-admin@cihuy.local</div>
            </div>
            <span class="role-tag admin">${esc(t('roleAdminLabel', lang))}</span>
          </button>
        </div>
      </div>

      <div class="login-note">
        <p>${esc(t('heroNote', lang))}</p>
      </div>
    </section>
  `;
}

export function renderLoginPage(container, state) {
  const { lang, auth } = state;

  container.innerHTML = `
    <div class="login-shell">
      <aside class="login-aside">
        <div class="login-aside-top">
          <span class="brand-mark">cihuy<span>.</span>explore</span>
          <div class="segmented" role="group" aria-label="Language selector">
            <button type="button" data-login-lang="id" class="${lang === 'id' ? 'active' : ''}" aria-pressed="${lang === 'id'}">ID</button>
            <button type="button" data-login-lang="en" class="${lang === 'en' ? 'active' : ''}" aria-pressed="${lang === 'en'}">EN</button>
          </div>
        </div>

        <div class="login-aside-body">
          <p class="hero-eyebrow">${esc(t('loginKicker', lang))}</p>
          <h1>${esc(t('loginTitle', lang))}</h1>
          <p class="login-aside-desc">${esc(t('loginDesc', lang))}</p>

          <div class="role-guide-section">
            <h2 class="role-guide-heading">${esc(t('loginRolesHeading', lang))}</h2>
            <div class="role-guide-list">
              <div class="role-guide-item">
                <div class="role-guide-title">${esc(t('roleUserLabel', lang))}</div>
                <p class="role-guide-desc">${esc(t('roleUserDesc', lang))}</p>
              </div>
              <div class="role-guide-item">
                <div class="role-guide-title">${esc(t('roleOperatorLabel', lang))}</div>
                <p class="role-guide-desc">${esc(t('roleOperatorDesc', lang))}</p>
              </div>
              <div class="role-guide-item">
                <div class="role-guide-title">${esc(t('roleAdminLabel', lang))}</div>
                <p class="role-guide-desc">${esc(t('roleAdminDesc', lang))}</p>
              </div>
            </div>
          </div>
        </div>

        <div style="font-size:0.8125rem;color:#c2dad0;">
          <span>${esc(t('footerCopy', lang))}</span>
        </div>
      </aside>

      <main class="login-main" id="main-content">
        ${auth.needsVerification ? renderVerificationCard(lang, auth) : renderCredentialsCard(lang, auth)}
      </main>
    </div>
  `;

  container.querySelectorAll('[data-login-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-login-lang');
      if (next && next !== state.lang) {
        setLang(next);
      }
    });
  });

  if (auth.needsVerification) {
    container.querySelector('#verifyCheckBtn')?.addEventListener('click', async () => {
      const verified = await refreshVerificationAction();
      if (!verified) {
        showToast(t('verifyNotYetToast', state.lang));
      }
    });
    container.querySelector('#verifyResendBtn')?.addEventListener('click', async () => {
      const sent = await resendVerificationAction();
      if (sent) {
        showToast(t('verifyResentToast', state.lang));
      }
    });
    container.querySelector('#verifySwitchBtn')?.addEventListener('click', async () => {
      await logoutAction();
    });
    return;
  }

  container.querySelectorAll('[data-auth-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setAuthMode(btn.getAttribute('data-auth-mode'));
    });
  });

  const localErrEl = container.querySelector('#emailAuthLocalError');
  const statusEl = container.querySelector('#emailAuthStatus');
  const showLocalError = (msg) => {
    if (localErrEl) {
      localErrEl.textContent = msg;
      localErrEl.classList.remove('hidden');
    }
    statusEl?.classList.add('hidden');
  };

  container.querySelector('#emailAuthForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    localErrEl?.classList.add('hidden');
    statusEl?.classList.add('hidden');

    const email = container.querySelector('#authEmail')?.value.trim() || '';
    const password = container.querySelector('#authPassword')?.value || '';
    const isRegister = state.auth.mode === 'register';
    const name = container.querySelector('#authName')?.value.trim() || '';

    if (!email || !password || (isRegister && !name)) {
      showLocalError(t('validationRequired', state.lang));
      return;
    }

    if (isRegister) {
      await registerWithEmailAction(name, email, password);
    } else {
      await loginWithEmailAction(email, password);
    }
  });

  container.querySelector('#forgotPasswordBtn')?.addEventListener('click', async () => {
    localErrEl?.classList.add('hidden');
    statusEl?.classList.add('hidden');
    const email = container.querySelector('#authEmail')?.value.trim() || '';
    if (!email) {
      showLocalError(t('resetPasswordEnterEmail', state.lang));
      return;
    }
    const ok = await resetPasswordAction(email);
    if (ok && statusEl) {
      statusEl.textContent = t('resetPasswordSent', state.lang);
      statusEl.classList.remove('hidden');
    }
  });

  container.querySelector('#googleLoginBtn')?.addEventListener('click', async () => {
    await loginWithGoogleAction();
  });

  container.querySelectorAll('[data-demo-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-demo-role');
      loginAsDemoRole(role);
      const roleName =
        role === 'admin'
          ? t('roleAdminLabel', state.lang)
          : role === 'operator'
            ? t('roleOperatorLabel', state.lang)
            : t('roleUserLabel', state.lang);
      showToast(`${t('demoToastSignedIn', state.lang)} ${roleName}`);
    });
  });
}
