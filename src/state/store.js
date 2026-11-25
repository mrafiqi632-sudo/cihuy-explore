import { SEED_DATA } from '../data/seed.js';
import {
  ADMIN_EMAIL,
  deleteCatalogEntry,
  ensureUserProfile,
  fetchAllUsersForAdmin,
  fetchCatalogCollection,
  fetchUserFavorites,
  fetchUserTrip,
  mapAuthErrorMessage,
  registerWithEmail,
  reloadCurrentAuthUser,
  removeUserFavorite,
  resendVerificationEmail,
  saveCatalogEntry,
  saveUserFavorite,
  saveUserTripToDb,
  seedAllCatalogsToFirestore,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeAuthState,
  updateUserRoleInDb,
} from '../firebase/service.js';

const STORAGE_KEYS = {
  lang: 'ce_lang',
};

const todayIso = new Date().toISOString().slice(0, 10);

const state = {
  lang: localStorage.getItem(STORAGE_KEYS.lang) === 'en' ? 'en' : 'id',
  auth: {
    ready: false,
    user: null,
    needsVerification: false,
    unverifiedEmail: null,
    mode: 'login',
    previewRole: null,
    error: null,
    info: null,
    signingIn: false,
  },
  usersList: [],
  destinations: structuredClone(SEED_DATA.destinations),
  foods: structuredClone(SEED_DATA.foods),
  stays: structuredClone(SEED_DATA.stays),
  packages: structuredClone(SEED_DATA.packages),
  favorites: [],
  filters: {
    q: '',
    region: '',
    category: '',
    sort: 'featured',
  },
  trip: {
    namaPerjalanan: 'Jelajah Aceh',
    tanggalMulai: todayIso,
    jumlahHari: 3,
    jumlahWisatawan: 2,
    daftarAktivitas: [],
  },
  budget: {
    transport: 250000,
    hotel: 350000,
    meal: 120000,
    activityCost: 100000,
  },
  packageFilter: {
    interest: '',
    maxDuration: 3,
    maxBudget: 1500000,
  },
  admin: {
    type: 'destinations',
    editId: null,
  },
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(scope = 'all') {
  listeners.forEach((fn) => fn(state, scope));
}

export function getState() {
  return state;
}

export function getEffectiveRole() {
  const realRole = state.auth.user?.role || 'user';
  if (realRole === 'admin' && state.auth.previewRole) {
    return state.auth.previewRole;
  }
  return realRole;
}

export function setAuthMode(mode) {
  state.auth.mode = mode === 'register' ? 'register' : 'login';
  state.auth.error = null;
  state.auth.info = null;
  notify('auth');
}

export function setPreviewRole(role) {
  if (state.auth.user?.role !== 'admin') return;
  if (role === 'admin' || !role) {
    state.auth.previewRole = null;
  } else if (role === 'operator' || role === 'user') {
    state.auth.previewRole = role;
  }
  // Ensure operator preview does not stay on admin-only tabs
  const effective = getEffectiveRole();
  if (effective === 'operator' && ['packages', 'users'].includes(state.admin.type)) {
    state.admin.type = 'destinations';
    state.admin.editId = null;
  }
  notify('all');
}

async function hydrateSignedInUser(firebaseUser) {
  const profile = await ensureUserProfile(firebaseUser);
  state.auth = {
    ...state.auth,
    ready: true,
    user: profile,
    needsVerification: false,
    unverifiedEmail: null,
    previewRole: null,
    error: null,
    info: null,
    signingIn: false,
  };

  const [dests, foods, stays, pkgs, favs, savedTrip] = await Promise.all([
    fetchCatalogCollection('destinations'),
    fetchCatalogCollection('foods'),
    fetchCatalogCollection('stays'),
    fetchCatalogCollection('packages'),
    fetchUserFavorites(profile.uid),
    fetchUserTrip(profile.uid),
  ]);

  if (dests.length === 0 && profile.role === 'admin') {
    await seedAllCatalogsToFirestore(profile.uid);
    state.destinations = structuredClone(SEED_DATA.destinations);
    state.foods = structuredClone(SEED_DATA.foods);
    state.stays = structuredClone(SEED_DATA.stays);
    state.packages = structuredClone(SEED_DATA.packages);
  } else {
    state.destinations = dests.length ? dests : structuredClone(SEED_DATA.destinations);
    state.foods = foods.length ? foods : structuredClone(SEED_DATA.foods);
    state.stays = stays.length ? stays : structuredClone(SEED_DATA.stays);
    state.packages = pkgs.length ? pkgs : structuredClone(SEED_DATA.packages);
  }

  state.favorites = favs || [];

  if (savedTrip) {
    state.trip = {
      namaPerjalanan: savedTrip.namaPerjalanan || 'Jelajah Aceh',
      tanggalMulai: savedTrip.tanggalMulai || todayIso,
      jumlahHari: Math.min(5, Math.max(1, Number(savedTrip.jumlahHari) || 3)),
      jumlahWisatawan: Math.min(30, Math.max(1, Number(savedTrip.jumlahWisatawan) || 2)),
      daftarAktivitas: Array.isArray(savedTrip.daftarAktivitas) ? savedTrip.daftarAktivitas : [],
    };
    if (savedTrip.budget) {
      state.budget = { ...state.budget, ...savedTrip.budget };
    }
  }

  if (profile.role === 'admin' && profile.email === ADMIN_EMAIL) {
    try {
      state.usersList = await fetchAllUsersForAdmin();
    } catch {
      state.usersList = [profile];
    }
  } else {
    state.usersList = [];
  }

  notify('auth');
}

export function initAuthSession() {
  return subscribeAuthState(async (firebaseUser) => {
    if (!firebaseUser) {
      state.auth = {
        ...state.auth,
        ready: true,
        user: null,
        needsVerification: false,
        unverifiedEmail: null,
        previewRole: null,
        error: null,
        signingIn: false,
      };
      state.usersList = [];
      state.favorites = [];
      notify('auth');
      return;
    }

    if (!firebaseUser.emailVerified) {
      state.auth = {
        ...state.auth,
        ready: true,
        user: null,
        needsVerification: true,
        unverifiedEmail: firebaseUser.email || '',
        previewRole: null,
        error: null,
        signingIn: false,
      };
      notify('auth');
      return;
    }

    try {
      await hydrateSignedInUser(firebaseUser);
    } catch (error) {
      state.auth = {
        ...state.auth,
        ready: true,
        user: null,
        needsVerification: false,
        unverifiedEmail: null,
        previewRole: null,
        error: mapAuthErrorMessage(error, state.lang),
        signingIn: false,
      };
      notify('auth');
    }
  });
}

export async function loginWithGoogleAction() {
  state.auth.signingIn = true;
  state.auth.error = null;
  state.auth.info = null;
  notify('auth');
  try {
    await signInWithGoogle();
  } catch (error) {
    state.auth.signingIn = false;
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
  }
}

export async function loginWithEmailAction(email, password) {
  state.auth.signingIn = true;
  state.auth.error = null;
  state.auth.info = null;
  notify('auth');
  try {
    await signInWithEmail(email, password);
  } catch (error) {
    state.auth.signingIn = false;
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
  }
}

export async function registerWithEmailAction(displayName, email, password) {
  state.auth.signingIn = true;
  state.auth.error = null;
  state.auth.info = null;
  notify('auth');
  try {
    await registerWithEmail(displayName, email, password);
  } catch (error) {
    state.auth.signingIn = false;
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
  }
}

export async function resendVerificationAction() {
  state.auth.error = null;
  try {
    await resendVerificationEmail();
    return true;
  } catch (error) {
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
    return false;
  }
}

export async function refreshVerificationAction() {
  state.auth.signingIn = true;
  state.auth.error = null;
  notify('auth');
  try {
    const user = await reloadCurrentAuthUser();
    if (user && user.emailVerified) {
      await hydrateSignedInUser(user);
      return true;
    }
    state.auth.signingIn = false;
    notify('auth');
    return false;
  } catch (error) {
    state.auth.signingIn = false;
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
    return false;
  }
}

export async function resetPasswordAction(email) {
  state.auth.error = null;
  state.auth.info = null;
  try {
    await sendPasswordReset(email);
    return true;
  } catch (error) {
    state.auth.error = mapAuthErrorMessage(error, state.lang);
    notify('auth');
    return false;
  }
}

export function loginAsDemoRole(role) {
  const safeRole = ['user', 'operator', 'admin'].includes(role) ? role : 'user';
  const profiles = {
    user: {
      uid: 'demo-user',
      email: 'demo-user@cihuy.local',
      displayName: 'Wisatawan Demo',
      role: 'user',
      isDemo: true,
    },
    operator: {
      uid: 'demo-operator',
      email: 'demo-operator@cihuy.local',
      displayName: 'Operator Lapangan Demo',
      role: 'operator',
      isDemo: true,
    },
    admin: {
      uid: 'demo-admin',
      email: 'demo-admin@cihuy.local',
      displayName: 'Admin Katalog Demo',
      role: 'admin',
      isDemo: true,
    },
  };

  state.auth = {
    ...state.auth,
    ready: true,
    user: profiles[safeRole],
    needsVerification: false,
    unverifiedEmail: null,
    previewRole: null,
    error: null,
    info: null,
    signingIn: false,
  };
  state.usersList = [
    { uid: 'demo-user', email: 'demo-user@cihuy.local', displayName: 'Wisatawan Demo', role: 'user' },
    { uid: 'demo-operator', email: 'demo-operator@cihuy.local', displayName: 'Operator Lapangan Demo', role: 'operator' },
    { uid: 'demo-admin', email: 'demo-admin@cihuy.local', displayName: 'Admin Katalog Demo', role: 'admin' },
  ];
  state.admin.type = 'destinations';
  state.admin.editId = null;
  notify('auth');
}

export async function logoutAction() {
  if (state.auth.user?.isDemo) {
    state.auth = {
      ...state.auth,
      ready: true,
      user: null,
      needsVerification: false,
      unverifiedEmail: null,
      previewRole: null,
      error: null,
      info: null,
      signingIn: false,
    };
    state.usersList = [];
    state.favorites = [];
    notify('auth');
    return;
  }
  await signOutUser();
}

export function setLang(lang) {
  state.lang = lang === 'en' ? 'en' : 'id';
  localStorage.setItem(STORAGE_KEYS.lang, state.lang);
  document.documentElement.lang = state.lang;
  notify('lang');
}

export function setFilter(patch) {
  state.filters = { ...state.filters, ...patch };
  notify('destinations');
}

export function resetFilters() {
  state.filters = { q: '', region: '', category: '', sort: 'featured' };
  notify('destinations');
}

export function isFavorite(id) {
  return state.favorites.some((f) => f.itemId === id);
}

export function toggleFavorite(itemId, tipeItem) {
  const uid = state.auth.user?.uid;
  const isDemo = Boolean(state.auth.user?.isDemo);
  const idx = state.favorites.findIndex((f) => f.itemId === itemId);
  const removed = idx >= 0;

  if (removed) {
    const [existing] = state.favorites.splice(idx, 1);
    if (uid && !isDemo && existing?.id) {
      removeUserFavorite(uid, existing.id).catch(() => {});
    }
  } else {
    const favId = `fav_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    state.favorites.push({
      id: favId,
      uid: uid || 'local',
      itemId,
      tipeItem,
    });
    if (uid && !isDemo) {
      saveUserFavorite(uid, favId, itemId, tipeItem).catch(() => {});
    }
  }

  notify('favorites');
  return !removed;
}

export function updateTripMeta(patch) {
  state.trip = { ...state.trip, ...patch };
  const days = Math.min(5, Math.max(1, Number(state.trip.jumlahHari) || 1));
  state.trip.jumlahHari = days;
  state.trip.jumlahWisatawan = Math.min(30, Math.max(1, Number(state.trip.jumlahWisatawan) || 1));
  state.trip.daftarAktivitas = state.trip.daftarAktivitas.filter((a) => a.hari <= days);
  notify('planner');
}

export function addTripActivity(destinasiId, hari, catatan = '') {
  if (!destinasiId) return;
  state.trip.daftarAktivitas.push({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hari: Math.min(state.trip.jumlahHari, Math.max(1, Number(hari) || 1)),
    destinasiId,
    catatan: String(catatan || '').trim(),
  });
  notify('planner');
}

export function removeTripActivity(activityId) {
  state.trip.daftarAktivitas = state.trip.daftarAktivitas.filter((a) => a.id !== activityId);
  notify('planner');
}

export function clearTripActivities() {
  state.trip.daftarAktivitas = [];
  notify('planner');
}

export function calculateBudgetSummary() {
  const days = Math.max(1, Number(state.trip.jumlahHari) || 1);
  const people = Math.max(1, Number(state.trip.jumlahWisatawan) || 1);
  const rooms = Math.ceil(people / 2);
  const nights = Math.max(0, days - 1);

  const transport = Math.max(0, Number(state.budget.transport) || 0) * people;
  const hotel = Math.max(0, Number(state.budget.hotel) || 0) * rooms * nights;
  const meal = Math.max(0, Number(state.budget.meal) || 0) * people * days;
  const activity = Math.max(0, Number(state.budget.activityCost) || 0) * people * days;
  const total = transport + hotel + meal + activity;

  return { days, people, rooms, nights, transport, hotel, meal, activity, total };
}

export function updateBudget(patch) {
  state.budget = { ...state.budget, ...patch };
  notify('budget');
}

export async function saveTripToStorage() {
  const uid = state.auth.user?.uid;
  if (!uid) return null;
  if (state.auth.user?.isDemo) {
    try {
      localStorage.setItem('ce_demo_trip', JSON.stringify({ trip: state.trip, budget: state.budget }));
    } catch {
      // Ignore storage errors
    }
    return state.trip;
  }
  return saveUserTripToDb(uid, state.trip, state.budget);
}

export async function loadTripFromStorage() {
  const uid = state.auth.user?.uid;
  if (!uid) return false;
  let saved = null;
  if (state.auth.user?.isDemo) {
    try {
      const raw = localStorage.getItem('ce_demo_trip');
      if (raw) {
        const parsed = JSON.parse(raw);
        saved = parsed?.trip ? { ...parsed.trip, budget: parsed.budget } : null;
      }
    } catch {
      saved = null;
    }
  } else {
    saved = await fetchUserTrip(uid);
  }
  if (!saved) return false;
  state.trip = {
    namaPerjalanan: saved.namaPerjalanan || 'Jelajah Aceh',
    tanggalMulai: saved.tanggalMulai || todayIso,
    jumlahHari: Math.min(5, Math.max(1, Number(saved.jumlahHari) || 3)),
    jumlahWisatawan: Math.min(30, Math.max(1, Number(saved.jumlahWisatawan) || 2)),
    daftarAktivitas: Array.isArray(saved.daftarAktivitas) ? saved.daftarAktivitas : [],
  };
  if (saved.budget) {
    state.budget = { ...state.budget, ...saved.budget };
  }
  notify('planner');
  notify('budget');
  return true;
}

export function updatePackageFilter(patch) {
  state.packageFilter = { ...state.packageFilter, ...patch };
  notify('packages');
}

export function applyPackageToTrip(packageId) {
  const pkg = state.packages.find((p) => p.id === packageId);
  if (!pkg) return null;
  const days = Math.min(5, Math.max(1, Number(pkg.durasi) || 2));
  state.trip.namaPerjalanan = pkg.nama;
  state.trip.jumlahHari = days;
  state.trip.daftarAktivitas = (pkg.daftarDestinasi || []).map((destId, index) => ({
    id: `act-${Date.now()}-${index}`,
    hari: Math.min(index + 1, days),
    destinasiId: destId,
    catatan: '',
  }));
  notify('planner');
  return pkg;
}

export function setAdminType(type) {
  const allowed =
    getEffectiveRole() === 'admin'
      ? ['destinations', 'foods', 'stays', 'packages', 'users']
      : ['destinations', 'foods', 'stays'];
  if (!allowed.includes(type)) return;
  state.admin.type = type;
  state.admin.editId = null;
  notify('admin');
}

export function setAdminEditId(id) {
  state.admin.editId = id || null;
  notify('admin');
}

export function startQuickEditItem(type, id) {
  const role = getEffectiveRole();
  if (role === 'user') return;
  if (role === 'operator' && ['packages', 'users'].includes(type)) return;
  state.admin.type = type;
  state.admin.editId = id;
  notify('admin');
  document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' });
}

export async function upsertAdminItem(type, payload) {
  const uid = state.auth.user?.uid;
  const isDemo = Boolean(state.auth.user?.isDemo);
  const role = getEffectiveRole();
  if (!uid || role === 'user') return;
  if (role === 'operator' && type === 'packages') return;

  const list = state[type];
  if (!Array.isArray(list)) return;

  if (type === 'destinations') {
    payload.mapsUrl =
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(`${payload.nama} ${payload.wilayah} Aceh Indonesia`);
    payload.unggulan = Boolean(payload.unggulan);
    payload.verifikasiInfo = payload.verifikasiInfo || 'Informasi contoh; perlu verifikasi lapangan.';
  }

  const existingIndex = state.admin.editId
    ? list.findIndex((item) => item.id === state.admin.editId)
    : -1;

  const isNew = existingIndex < 0;
  const targetId = isNew ? `${type[0]}${Date.now()}` : state.admin.editId;
  const fullRecord = { ...(isNew ? {} : list[existingIndex]), ...payload, id: targetId };

  if (!isDemo) {
    await saveCatalogEntry(type, fullRecord, uid, isNew);
  }

  if (isNew) {
    list.push(fullRecord);
  } else {
    list[existingIndex] = fullRecord;
  }

  state.admin.editId = null;
  notify('all');
}

export async function deleteAdminItem(type, id) {
  if (getEffectiveRole() !== 'admin') return;
  if (!Array.isArray(state[type])) return;

  if (!state.auth.user?.isDemo) {
    await deleteCatalogEntry(type, id);
  }
  state[type] = state[type].filter((item) => item.id !== id);
  if (state.admin.editId === id) {
    state.admin.editId = null;
  }
  notify('all');
}

export async function resetAllDemoData() {
  if (getEffectiveRole() !== 'admin' || !state.auth.user?.uid) return;
  if (!state.auth.user?.isDemo) {
    await seedAllCatalogsToFirestore(state.auth.user.uid);
  }
  state.destinations = structuredClone(SEED_DATA.destinations);
  state.foods = structuredClone(SEED_DATA.foods);
  state.stays = structuredClone(SEED_DATA.stays);
  state.packages = structuredClone(SEED_DATA.packages);
  state.admin.editId = null;
  state.filters = { q: '', region: '', category: '', sort: 'featured' };
  notify('all');
}

export async function changeUserRoleAction(targetUid, nextRole) {
  if (state.auth.user?.role !== 'admin') return;
  if (!state.auth.user?.isDemo) {
    await updateUserRoleInDb(targetUid, nextRole);
  }
  state.usersList = state.usersList.map((u) =>
    u.uid === targetUid ? { ...u, role: nextRole } : u
  );
  notify('admin');
}
