import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { SEED_DATA } from '../data/seed.js';
import { auth, db, handleFirestoreError, OperationType } from './client.js';

export const ADMIN_EMAIL = 'mrafiqi632@gmail.com';

const COLLECTIONS = {
  destinations: 'catalog_destinations',
  foods: 'catalog_foods',
  stays: 'catalog_stays',
  packages: 'catalog_packages',
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function mapAuthErrorMessage(error, lang = 'id') {
  const code = error?.code || '';
  const idMessages = {
    'auth/operation-not-allowed':
      'Login Email/Kata Sandi belum diaktifkan di Firebase Console (Authentication → Sign-in method).',
    'auth/invalid-email': 'Format alamat email tidak valid.',
    'auth/invalid-credential': 'Email atau kata sandi salah.',
    'auth/wrong-password': 'Kata sandi salah.',
    'auth/user-not-found': 'Akun dengan email ini belum terdaftar.',
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.',
    'auth/weak-password': 'Kata sandi terlalu lemah (minimal 6 karakter).',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan tunggu beberapa saat lalu coba lagi.',
    'auth/popup-closed-by-user': 'Jendela masuk Google ditutup sebelum selesai.',
    'auth/popup-blocked': 'Pop-up diblokir oleh browser. Izinkan pop-up untuk melanjutkan.',
  };
  const enMessages = {
    'auth/operation-not-allowed':
      'Email/Password sign-in is not enabled yet in Firebase Console (Authentication → Sign-in method).',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/weak-password': 'Password is too weak (minimum 6 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Google sign-in popup was closed before completion.',
    'auth/popup-blocked': 'Popup was blocked by the browser. Please allow popups and try again.',
  };
  const table = lang === 'en' ? enMessages : idMessages;
  return table[code] || (error instanceof Error ? error.message : String(error));
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(displayName, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && credential.user) {
    await updateProfile(credential.user, {
      displayName: String(displayName).trim().slice(0, 120),
    });
  }
  if (credential.user && !credential.user.emailVerified) {
    await sendEmailVerification(credential.user);
  }
  return credential;
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) return false;
  await sendEmailVerification(auth.currentUser);
  return true;
}

export async function reloadCurrentAuthUser() {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function ensureUserProfile(firebaseUser) {
  const path = `users/${firebaseUser.uid}`;
  const ref = doc(db, 'users', firebaseUser.uid);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap && snap.exists()) {
    const data = snap.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role || 'user',
    };
  }

  const isBootstrappedAdmin =
    firebaseUser.email === ADMIN_EMAIL && firebaseUser.emailVerified === true;
  const profilePayload = {
    uid: firebaseUser.uid,
    email: String(firebaseUser.email || '').slice(0, 200),
    displayName: String(firebaseUser.displayName || firebaseUser.email || 'Pengguna').slice(0, 120),
    role: isBootstrappedAdmin ? 'admin' : 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, profilePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    uid: profilePayload.uid,
    email: profilePayload.email,
    displayName: profilePayload.displayName,
    role: profilePayload.role,
  };
}

function buildStrictCatalogPayload(type, item, uid) {
  const id = String(item.id || `${type[0]}${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');

  if (type === 'destinations') {
    return {
      id,
      nama: String(item.nama || '').slice(0, 160),
      kategori: String(item.kategori || 'Alam').slice(0, 60),
      wilayah: String(item.wilayah || 'Banda Aceh').slice(0, 80),
      deskripsi: String(item.deskripsi || '-').slice(0, 1200),
      imageUrl: String(item.imageUrl || '/images/illustrations/culture.svg').slice(0, 500),
      alamat: String(item.alamat || '').slice(0, 240),
      mapsUrl: String(
        item.mapsUrl ||
          'https://www.google.com/maps/search/?api=1&query=' +
            encodeURIComponent(`${item.nama || ''} ${item.wilayah || ''} Aceh Indonesia`)
      ).slice(0, 500),
      estimasiBiaya: Math.max(0, Number(item.estimasiBiaya) || 0),
      fasilitas: Array.isArray(item.fasilitas) ? item.fasilitas.map(String).slice(0, 20) : [],
      fasilitasIbadah: Array.isArray(item.fasilitasIbadah) ? item.fasilitasIbadah.map(String).slice(0, 20) : [],
      unggulan: Boolean(item.unggulan),
      verifikasiInfo: String(item.verifikasiInfo || 'Informasi contoh; perlu verifikasi lapangan.').slice(0, 300),
      status: 'published',
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    };
  }

  if (type === 'foods') {
    return {
      id,
      nama: String(item.nama || '').slice(0, 160),
      kategori: String(item.kategori || 'Kuliner khas').slice(0, 80),
      wilayah: String(item.wilayah || 'Banda Aceh').slice(0, 80),
      harga: Math.max(0, Number(item.harga) || 0),
      imageUrl: String(item.imageUrl || '/images/illustrations/food.svg').slice(0, 500),
      statusSertifikasiHalal: ['terverifikasi', 'belum_terverifikasi', 'tidak_diketahui'].includes(
        item.statusSertifikasiHalal
      )
        ? item.statusSertifikasiHalal
        : 'tidak_diketahui',
      sumberVerifikasi: String(item.sumberVerifikasi || '').slice(0, 300),
      kontak: String(item.kontak || '6281234567800').slice(0, 32),
      status: 'published',
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    };
  }

  if (type === 'stays') {
    return {
      id,
      nama: String(item.nama || '').slice(0, 160),
      wilayah: String(item.wilayah || 'Banda Aceh').slice(0, 80),
      hargaPerMalam: Math.max(0, Number(item.hargaPerMalam) || 0),
      fasilitas: Array.isArray(item.fasilitas) ? item.fasilitas.map(String).slice(0, 20) : [],
      fasilitasRamahMuslim: Array.isArray(item.fasilitasRamahMuslim)
        ? item.fasilitasRamahMuslim.map(String).slice(0, 20)
        : [],
      imageUrl: String(item.imageUrl || '/images/illustrations/stay.svg').slice(0, 500),
      kontak: String(item.kontak || '6281234567810').slice(0, 32),
      status: 'published',
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    };
  }

  return {
    id,
    nama: String(item.nama || '').slice(0, 160),
    durasi: Math.min(5, Math.max(1, Number(item.durasi) || 2)),
    daftarDestinasi: Array.isArray(item.daftarDestinasi) ? item.daftarDestinasi.map(String).slice(0, 20) : [],
    estimasiBiaya: Math.max(0, Number(item.estimasiBiaya) || 0),
    deskripsi: String(item.deskripsi || '-').slice(0, 1000),
    minat: Array.isArray(item.minat) ? item.minat.map(String).slice(0, 10) : [],
    wilayah: String(item.wilayah || 'Banda Aceh').slice(0, 80),
    status: 'published',
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };
}

export async function fetchCatalogCollection(type) {
  const colName = COLLECTIONS[type];
  if (!colName) return [];
  try {
    const q = query(collection(db, colName), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
    return [];
  }
}

export async function saveCatalogEntry(type, item, uid, isNew = false) {
  const colName = COLLECTIONS[type];
  if (!colName) return null;
  const payload = buildStrictCatalogPayload(type, item, uid);
  const path = `${colName}/${payload.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, colName, payload.id), payload);
    } else {
      await updateDoc(doc(db, colName, payload.id), payload);
    }
    return payload;
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
    return null;
  }
}

export async function deleteCatalogEntry(type, docId) {
  const colName = COLLECTIONS[type];
  if (!colName) return;
  const path = `${colName}/${docId}`;
  try {
    await deleteDoc(doc(db, colName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedAllCatalogsToFirestore(uid) {
  const entries = [
    ['destinations', SEED_DATA.destinations],
    ['foods', SEED_DATA.foods],
    ['stays', SEED_DATA.stays],
    ['packages', SEED_DATA.packages],
  ];

  for (const [type, list] of entries) {
    const colName = COLLECTIONS[type];
    for (const item of list) {
      const payload = buildStrictCatalogPayload(type, item, uid);
      try {
        await setDoc(doc(db, colName, payload.id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${colName}/${payload.id}`);
      }
    }
  }
}

export async function fetchUserFavorites(uid) {
  const path = `users/${uid}/favorites`;
  try {
    const q = query(collection(db, 'users', uid, 'favorites'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveUserFavorite(uid, favId, itemId, tipeItem) {
  const path = `users/${uid}/favorites/${favId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'favorites', favId), {
      id: favId,
      uid,
      itemId,
      tipeItem,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeUserFavorite(uid, favId) {
  const path = `users/${uid}/favorites/${favId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'favorites', favId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserTrip(uid) {
  const path = `user_trips/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'user_trips', uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserTripToDb(uid, trip, budget) {
  const path = `user_trips/${uid}`;
  const payload = {
    uid,
    namaPerjalanan: String(trip.namaPerjalanan || 'Jelajah Aceh').slice(0, 160),
    tanggalMulai: String(trip.tanggalMulai || '').slice(0, 20),
    jumlahHari: Math.min(5, Math.max(1, Number(trip.jumlahHari) || 3)),
    jumlahWisatawan: Math.min(30, Math.max(1, Number(trip.jumlahWisatawan) || 2)),
    daftarAktivitas: Array.isArray(trip.daftarAktivitas) ? trip.daftarAktivitas.slice(0, 50) : [],
    budget: {
      transport: Math.max(0, Number(budget.transport) || 0),
      hotel: Math.max(0, Number(budget.hotel) || 0),
      meal: Math.max(0, Number(budget.meal) || 0),
      activityCost: Math.max(0, Number(budget.activityCost) || 0),
    },
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'user_trips', uid), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function fetchAllUsersForAdmin() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export async function updateUserRoleInDb(targetUid, nextRole) {
  if (!['user', 'operator', 'admin'].includes(nextRole)) return;
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), {
      role: nextRole,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
