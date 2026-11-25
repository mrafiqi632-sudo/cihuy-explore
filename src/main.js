import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { renderCulinarySection } from './components/culinary.js';
import { renderDashboardSection } from './components/dashboard.js';
import { renderDestinationGridOnly, renderDestinationsSection } from './components/destinations.js';
import { renderFavoritesSection } from './components/favorites.js';
import { renderFooter } from './components/footer.js';
import { renderHeader, updateHeaderFavCount } from './components/header.js';
import { renderHero } from './components/hero.js';
import { renderAuthLoading, renderLoginPage } from './components/login.js';
import { renderMapSection } from './components/map.js';
import { createModalRoot } from './components/modal.js';
import {
  renderPlannerSection,
  updateBudgetSummaryOnly,
  updateItineraryListOnly,
  updatePackageGridOnly,
} from './components/planner.js';
import { renderStaysSection } from './components/stays.js';
import { createToastElement } from './components/toast.js';
import { getState, initAuthSession, subscribe } from './state/store.js';

function bootstrap() {
  const app = document.getElementById('app');
  if (!app) return;

  const initialState = getState();
  document.documentElement.lang = initialState.lang;

  let mountedMode = null; // 'loading' | 'login' | 'workspace'
  let slots = null;

  const mountWorkspaceShell = () => {
    app.innerHTML = '';
    const headerSlot = document.createElement('div');
    const mainEl = document.createElement('main');
    mainEl.id = 'main-content';

    const heroSlot = document.createElement('div');
    const destinationsSlot = document.createElement('div');
    const mapSlot = document.createElement('div');
    const culinarySlot = document.createElement('div');
    const staysSlot = document.createElement('div');
    const plannerSlot = document.createElement('div');
    const favoritesSlot = document.createElement('div');
    const dashboardSlot = document.createElement('div');
    const footerSlot = document.createElement('div');

    mainEl.append(
      heroSlot,
      destinationsSlot,
      mapSlot,
      culinarySlot,
      staysSlot,
      plannerSlot,
      favoritesSlot,
      dashboardSlot
    );

    app.append(headerSlot, mainEl, footerSlot, createModalRoot(), createToastElement());

    slots = {
      headerSlot,
      heroSlot,
      destinationsSlot,
      mapSlot,
      culinarySlot,
      staysSlot,
      plannerSlot,
      favoritesSlot,
      dashboardSlot,
      footerSlot,
    };
  };

  const renderAllWorkspaceSections = (state) => {
    if (!slots) return;
    renderHeader(slots.headerSlot, state);
    renderHero(slots.heroSlot, state);
    renderDestinationsSection(slots.destinationsSlot, state);
    renderMapSection(slots.mapSlot, state);
    renderCulinarySection(slots.culinarySlot, state);
    renderStaysSection(slots.staysSlot, state);
    renderPlannerSection(slots.plannerSlot, state);
    renderFavoritesSection(slots.favoritesSlot, state);
    renderDashboardSection(slots.dashboardSlot, state);
    renderFooter(slots.footerSlot, state);
  };

  const syncView = (state, scope = 'all') => {
    if (!state.auth.ready) {
      if (mountedMode !== 'loading') {
        mountedMode = 'loading';
        slots = null;
        renderAuthLoading(app, state.lang);
      }
      return;
    }

    if (!state.auth.user) {
      mountedMode = 'login';
      slots = null;
      renderLoginPage(app, state);
      app.append(createToastElement());
      return;
    }

    if (mountedMode !== 'workspace') {
      mountedMode = 'workspace';
      mountWorkspaceShell();
      renderAllWorkspaceSections(state);
      return;
    }

    if (scope === 'auth' || scope === 'lang' || scope === 'all') {
      renderAllWorkspaceSections(state);
      return;
    }

    if (scope === 'destinations') {
      renderDestinationGridOnly(state);
      renderMapSection(slots.mapSlot, state);
      return;
    }

    if (scope === 'favorites') {
      updateHeaderFavCount(state.favorites.length);
      renderDestinationGridOnly(state);
      renderCulinarySection(slots.culinarySlot, state);
      renderStaysSection(slots.staysSlot, state);
      renderFavoritesSection(slots.favoritesSlot, state);
      return;
    }

    if (scope === 'planner') {
      updateItineraryListOnly(state);
      return;
    }

    if (scope === 'budget') {
      updateBudgetSummaryOnly(state);
      return;
    }

    if (scope === 'packages') {
      updatePackageGridOnly(state);
      return;
    }

    if (scope === 'admin') {
      renderDashboardSection(slots.dashboardSlot, state);
    }
  };

  syncView(initialState, 'auth');
  subscribe(syncView);
  initAuthSession();
}

bootstrap();
