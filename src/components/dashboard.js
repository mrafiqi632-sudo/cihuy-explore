import { CATEGORIES, IMAGE_PRESETS, REGIONS } from '../data/seed.js';
import { t } from '../i18n/translations.js';
import {
  changeUserRoleAction,
  deleteAdminItem,
  getEffectiveRole,
  resetAllDemoData,
  setAdminEditId,
  setAdminType,
  upsertAdminItem,
} from '../state/store.js';
import { esc, formatIDR } from '../utils/format.js';
import { openConfirmModal } from './modal.js';
import { showToast } from './toast.js';

function getTypeLabel(type, lang) {
  const map = {
    destinations: t('tabDestinations', lang),
    foods: t('tabFoods', lang),
    stays: t('tabStays', lang),
    packages: t('tabPackages', lang),
    users: t('tabUsers', lang),
  };
  return map[type] || type;
}

function getFieldLabels(lang) {
  if (lang === 'en') {
    return {
      name: 'Name / Title *',
      region: 'Region *',
      category: 'Category *',
      address: 'Address',
      fee: 'Estimated Cost (IDR)',
      description: 'Description *',
      imagePreset: 'Local Illustration Preset',
      imageUrl: 'Image URL / Path',
      facilities: 'Amenities (comma-separated)',
      worship: 'Prayer / Muslim-friendly Info (comma-separated)',
      featured: 'Feature on top',
      foodCategory: 'Type (e.g. Kuliner khas / Produk UMKM)',
      halalStatus: 'Halal Status',
      halalSource: 'Verification Source',
      contact: 'WhatsApp Number (628...)',
      duration: 'Duration (days)',
      interests: 'Interests (comma-separated)',
      destIds: 'Destination IDs (comma-separated, e.g. d1,d2)',
    };
  }
  return {
    name: 'Nama / Judul *',
    region: 'Wilayah *',
    category: 'Kategori *',
    address: 'Alamat',
    fee: 'Estimasi Biaya (Rp)',
    description: 'Deskripsi *',
    imagePreset: 'Preset Ilustrasi Lokal',
    imageUrl: 'URL / Path Gambar',
    facilities: 'Fasilitas (pisahkan dengan koma)',
    worship: 'Info Ibadah / Ramah Muslim (pisahkan koma)',
    featured: 'Tampilkan sebagai unggulan',
    foodCategory: 'Jenis (mis. Kuliner khas / Produk UMKM)',
    halalStatus: 'Status Sertifikasi Halal',
    halalSource: 'Sumber Verifikasi',
    contact: 'Nomor WhatsApp (628...)',
    duration: 'Durasi (hari)',
    interests: 'Minat (pisahkan dengan koma)',
    destIds: 'ID Destinasi (pisahkan koma, mis. d1,d2)',
  };
}

function renderAdminFormFields(type, item, lang) {
  const L = getFieldLabels(lang);
  const v = item || {};
  const regionOptions = REGIONS.map(
    (r) => `<option value="${esc(r)}" ${v.wilayah === r ? 'selected' : ''}>${esc(r)}</option>`
  ).join('');
  const categoryOptions = CATEGORIES.map(
    (c) => `<option value="${esc(c)}" ${v.kategori === c ? 'selected' : ''}>${esc(c)}</option>`
  ).join('');

  const imagePresetBlock =
    type !== 'packages'
      ? `
        <div>
          <label class="field-label" for="adminPresetImg">${esc(L.imagePreset)}</label>
          <select id="adminPresetImg" class="field">
            <option value="">—</option>
            ${IMAGE_PRESETS.map(
              (p) => `<option value="${esc(p.url)}" ${v.imageUrl === p.url ? 'selected' : ''}>${esc(p.label)}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="field-label" for="adminImageUrl">${esc(L.imageUrl)}</label>
          <input id="adminImageUrl" class="field" type="text" value="${esc(v.imageUrl || IMAGE_PRESETS[0].url)}" />
        </div>
      `
      : '';

  if (type === 'destinations') {
    return `
      <div class="full">
        <label class="field-label" for="adminName">${esc(L.name)}</label>
        <input id="adminName" class="field" type="text" required value="${esc(v.nama || '')}" />
      </div>
      <div>
        <label class="field-label" for="adminRegion">${esc(L.region)}</label>
        <select id="adminRegion" class="field">${regionOptions}</select>
      </div>
      <div>
        <label class="field-label" for="adminCategory">${esc(L.category)}</label>
        <select id="adminCategory" class="field">${categoryOptions}</select>
      </div>
      <div>
        <label class="field-label" for="adminAddress">${esc(L.address)}</label>
        <input id="adminAddress" class="field" type="text" value="${esc(v.alamat || '')}" />
      </div>
      <div>
        <label class="field-label" for="adminPrice">${esc(L.fee)}</label>
        <input id="adminPrice" class="field tabular" type="number" min="0" step="1000" value="${esc(v.estimasiBiaya ?? 10000)}" />
      </div>
      ${imagePresetBlock}
      <div class="full">
        <label class="field-label" for="adminDesc">${esc(L.description)}</label>
        <textarea id="adminDesc" class="field" required>${esc(v.deskripsi || '')}</textarea>
      </div>
      <div>
        <label class="field-label" for="adminFacilities">${esc(L.facilities)}</label>
        <input id="adminFacilities" class="field" type="text" value="${esc((v.fasilitas || []).join(', '))}" />
      </div>
      <div>
        <label class="field-label" for="adminWorship">${esc(L.worship)}</label>
        <input id="adminWorship" class="field" type="text" value="${esc((v.fasilitasIbadah || []).join(', '))}" />
      </div>
      <div class="full">
        <label style="display:inline-flex;align-items:center;gap:8px;font-size:0.875rem;font-weight:500;">
          <input id="adminFeatured" type="checkbox" ${v.unggulan ? 'checked' : ''} />
          <span>${esc(L.featured)}</span>
        </label>
      </div>
    `;
  }

  if (type === 'foods') {
    return `
      <div class="full">
        <label class="field-label" for="adminName">${esc(L.name)}</label>
        <input id="adminName" class="field" type="text" required value="${esc(v.nama || '')}" />
      </div>
      <div>
        <label class="field-label" for="adminRegion">${esc(L.region)}</label>
        <select id="adminRegion" class="field">${regionOptions}</select>
      </div>
      <div>
        <label class="field-label" for="adminFoodCat">${esc(L.foodCategory)}</label>
        <input id="adminFoodCat" class="field" type="text" value="${esc(v.kategori || 'Kuliner khas')}" />
      </div>
      <div>
        <label class="field-label" for="adminPrice">${esc(L.fee)}</label>
        <input id="adminPrice" class="field tabular" type="number" min="0" step="1000" value="${esc(v.harga ?? 25000)}" />
      </div>
      <div>
        <label class="field-label" for="adminContact">${esc(L.contact)}</label>
        <input id="adminContact" class="field mono" type="text" value="${esc(v.kontak || '6281234567800')}" />
      </div>
      <div>
        <label class="field-label" for="adminHalalStatus">${esc(L.halalStatus)}</label>
        <select id="adminHalalStatus" class="field">
          <option value="tidak_diketahui" ${v.statusSertifikasiHalal === 'tidak_diketahui' ? 'selected' : ''}>${esc(t('halalUnknown', lang))}</option>
          <option value="belum_terverifikasi" ${v.statusSertifikasiHalal === 'belum_terverifikasi' ? 'selected' : ''}>${esc(t('halalUnverified', lang))}</option>
          <option value="terverifikasi" ${v.statusSertifikasiHalal === 'terverifikasi' ? 'selected' : ''}>${esc(t('halalVerified', lang))}</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="adminHalalSource">${esc(L.halalSource)}</label>
        <input id="adminHalalSource" class="field" type="text" value="${esc(v.sumberVerifikasi || '')}" />
      </div>
      ${imagePresetBlock}
    `;
  }

  if (type === 'stays') {
    return `
      <div class="full">
        <label class="field-label" for="adminName">${esc(L.name)}</label>
        <input id="adminName" class="field" type="text" required value="${esc(v.nama || '')}" />
      </div>
      <div>
        <label class="field-label" for="adminRegion">${esc(L.region)}</label>
        <select id="adminRegion" class="field">${regionOptions}</select>
      </div>
      <div>
        <label class="field-label" for="adminPrice">${esc(L.fee)}</label>
        <input id="adminPrice" class="field tabular" type="number" min="0" step="10000" value="${esc(v.hargaPerMalam ?? 350000)}" />
      </div>
      <div class="full">
        <label class="field-label" for="adminContact">${esc(L.contact)}</label>
        <input id="adminContact" class="field mono" type="text" value="${esc(v.kontak || '6281234567810')}" />
      </div>
      <div>
        <label class="field-label" for="adminFacilities">${esc(L.facilities)}</label>
        <input id="adminFacilities" class="field" type="text" value="${esc((v.fasilitas || ['Wi-Fi', 'Parkir']).join(', '))}" />
      </div>
      <div>
        <label class="field-label" for="adminWorship">${esc(L.worship)}</label>
        <input id="adminWorship" class="field" type="text" value="${esc((v.fasilitasRamahMuslim || ['Info masjid sekitar']).join(', '))}" />
      </div>
      ${imagePresetBlock}
    `;
  }

  return `
    <div class="full">
      <label class="field-label" for="adminName">${esc(L.name)}</label>
      <input id="adminName" class="field" type="text" required value="${esc(v.nama || '')}" />
    </div>
    <div>
      <label class="field-label" for="adminRegion">${esc(L.region)}</label>
      <select id="adminRegion" class="field">${regionOptions}</select>
    </div>
    <div>
      <label class="field-label" for="adminDuration">${esc(L.duration)}</label>
      <input id="adminDuration" class="field tabular" type="number" min="1" max="5" value="${esc(v.durasi ?? 2)}" />
    </div>
    <div>
      <label class="field-label" for="adminPrice">${esc(L.fee)}</label>
      <input id="adminPrice" class="field tabular" type="number" min="0" step="50000" value="${esc(v.estimasiBiaya ?? 750000)}" />
    </div>
    <div>
      <label class="field-label" for="adminInterests">${esc(L.interests)}</label>
      <input id="adminInterests" class="field" type="text" value="${esc((v.minat || ['Alam']).join(', '))}" />
    </div>
    <div class="full">
      <label class="field-label" for="adminDestIds">${esc(L.destIds)}</label>
      <input id="adminDestIds" class="field mono" type="text" value="${esc((v.daftarDestinasi || ['d1']).join(', '))}" />
    </div>
    <div class="full">
      <label class="field-label" for="adminDesc">${esc(L.description)}</label>
      <textarea id="adminDesc" class="field" required>${esc(v.deskripsi || '')}</textarea>
    </div>
  `;
}

function isValidImagePath(url) {
  const val = String(url || '').trim();
  if (!val) return true;
  return val.startsWith('/') || val.startsWith('https://') || val.startsWith('http://');
}

function renderUsersManagementPanel(state, lang) {
  const users = state.usersList || [];
  const currentUid = state.auth.user?.uid;

  return `
    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>${esc(t('usersHeading', lang))}</h3>
          <p style="font-size:0.8125rem;color:var(--ink-muted);margin-top:4px;">${esc(t('usersSub', lang))}</p>
        </div>
        <span class="section-meta tabular">${users.length}</span>
      </div>

      ${
        users.length
          ? `
            <div id="usersRoleList">
              ${users
                .map((u) => {
                  const isSelf = u.uid === currentUid;
                  return `
                    <div class="user-role-row">
                      <div style="min-width:0;">
                        <div style="font-weight:600;font-size:0.9375rem;">${esc(u.displayName)}</div>
                        <div style="font-size:0.8125rem;color:var(--ink-muted);" class="mono">${esc(u.email)}</div>
                      </div>
                      <div class="user-role-controls">
                        <select data-user-role-select="${esc(u.uid)}" ${isSelf ? 'disabled' : ''}>
                          <option value="user" ${u.role === 'user' ? 'selected' : ''}>${esc(t('roleUserLabel', lang))}</option>
                          <option value="operator" ${u.role === 'operator' ? 'selected' : ''}>${esc(t('roleOperatorLabel', lang))}</option>
                          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${esc(t('roleAdminLabel', lang))}</option>
                        </select>
                        ${
                          isSelf
                            ? `<span class="role-tag admin">${esc(t('roleAdminLabel', lang))}</span>`
                            : `<button type="button" class="btn btn-sm" data-save-user-role="${esc(u.uid)}">${esc(t('saveRoleBtn', lang))}</button>`
                        }
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
          : `<div class="empty-state">${esc(t('usersEmpty', lang))}</div>`
      }
    </div>
  `;
}

export function renderDashboardSection(container, state) {
  const role = getEffectiveRole();
  if (role === 'user') {
    container.innerHTML = '';
    return;
  }

  const { lang, admin } = state;
  const isAdmin = role === 'admin';
  const availableTabs = isAdmin
    ? ['destinations', 'foods', 'stays', 'packages', 'users']
    : ['destinations', 'foods', 'stays'];

  const activeTab = availableTabs.includes(admin.type) ? admin.type : 'destinations';
  const activeList = state[activeTab] || [];
  const editingItem = admin.editId ? activeList.find((x) => x.id === admin.editId) : null;
  const typeLabel = getTypeLabel(activeTab, lang);

  const kicker = isAdmin ? t('adminKicker', lang) : t('operatorKicker', lang);
  const title = isAdmin ? t('adminTitle', lang) : t('operatorTitle', lang);
  const sub = isAdmin ? t('adminSub', lang) : t('operatorSub', lang);
  const notice = isAdmin ? t('adminRoleNotice', lang) : t('operatorNotice', lang);

  container.innerHTML = `
    <section class="section" id="admin">
      <div class="wrap">
        <div class="section-head">
          <div>
            <p class="section-kicker">${esc(kicker)}</p>
            <h2>${esc(title)}</h2>
            <p class="section-sub">${esc(sub)}</p>
          </div>
          ${
            isAdmin
              ? `<button type="button" class="btn btn-danger btn-sm" id="resetDemoBtn">${esc(t('resetDemoBtn', lang))}</button>`
              : ''
          }
        </div>

        <div class="notice-bar">${esc(notice)}</div>

        <div class="tab-bar" role="tablist" aria-label="${esc(title)}">
          ${availableTabs
            .map(
              (tab) => `
              <button
                type="button"
                role="tab"
                class="tab-btn ${activeTab === tab ? 'active' : ''}"
                aria-selected="${activeTab === tab}"
                data-admin-tab="${tab}"
              >${esc(getTypeLabel(tab, lang))}</button>
            `
            )
            .join('')}
        </div>

        ${
          activeTab === 'users' && isAdmin
            ? renderUsersManagementPanel(state, lang)
            : `
            <div class="split-grid">
              <div class="panel">
                <div class="panel-head">
                  <h3>${esc((editingItem ? t('editTitlePrefix', lang) : t('addTitlePrefix', lang)) + typeLabel)}</h3>
                </div>
                <form id="adminForm" novalidate>
                  <div class="admin-form-grid">
                    ${renderAdminFormFields(activeTab, editingItem, lang)}
                  </div>
                  <div id="adminFormError" class="form-error hidden" role="alert"></div>
                  <div style="display:flex;gap:10px;margin-top:16px;">
                    <button type="submit" class="btn">${esc(t('saveDataBtn', lang))}</button>
                    ${
                      editingItem
                        ? `<button type="button" class="btn btn-ghost" id="cancelEditBtn">${esc(t('cancelBtn', lang))}</button>`
                        : ''
                    }
                  </div>
                </form>
              </div>

              <div class="panel">
                <div class="panel-head">
                  <h3>${esc(t('savedDataHeading', lang))}</h3>
                  <span class="section-meta tabular">${activeList.length}</span>
                </div>
                <div class="admin-list" id="adminList">
                  ${activeList
                    .map((item) => {
                      const subPrice =
                        activeTab === 'destinations'
                          ? formatIDR(item.estimasiBiaya)
                          : activeTab === 'foods'
                            ? formatIDR(item.harga)
                            : activeTab === 'stays'
                              ? formatIDR(item.hargaPerMalam)
                              : formatIDR(item.estimasiBiaya);
                      return `
                        <div class="admin-row">
                          <div style="min-width:0;">
                            <div style="font-weight:600;font-size:0.9rem;">${esc(item.nama)}</div>
                            <div style="font-size:0.75rem;color:var(--ink-muted);" class="tabular">
                              ${esc(item.wilayah || '')} &middot; ${esc(subPrice)}
                            </div>
                          </div>
                          <div class="admin-row-actions">
                            <button type="button" class="btn btn-ghost btn-sm" data-admin-edit="${esc(item.id)}">
                              ${esc(t('editBtn', lang))}
                            </button>
                            ${
                              isAdmin
                                ? `<button type="button" class="btn btn-danger btn-sm" data-admin-del="${esc(item.id)}">${esc(t('deleteBtn', lang))}</button>`
                                : ''
                            }
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            </div>
          `
        }
      </div>
    </section>
  `;

  // Tab switch
  container.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setAdminType(btn.getAttribute('data-admin-tab'));
    });
  });

  // User role management handler (Admin only)
  container.querySelector('#usersRoleList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-save-user-role]');
    if (!btn) return;
    const targetUid = btn.getAttribute('data-save-user-role');
    const select = container.querySelector(`[data-user-role-select="${targetUid}"]`);
    if (!select) return;
    btn.disabled = true;
    try {
      await changeUserRoleAction(targetUid, select.value);
      showToast(t('toastRoleUpdated', state.lang));
    } finally {
      btn.disabled = false;
    }
  });

  // Preset image dropdown helper
  container.querySelector('#adminPresetImg')?.addEventListener('change', (e) => {
    const imgInput = container.querySelector('#adminImageUrl');
    if (imgInput && e.target.value) {
      imgInput.value = e.target.value;
    }
  });

  // Cancel edit
  container.querySelector('#cancelEditBtn')?.addEventListener('click', () => {
    setAdminEditId(null);
  });

  // Reset demo data via custom modal (Admin only)
  container.querySelector('#resetDemoBtn')?.addEventListener('click', (e) => {
    openConfirmModal({
      title: t('confirmResetTitle', state.lang),
      message: t('confirmResetMsg', state.lang),
      confirmLabel: t('confirmBtn', state.lang),
      cancelLabel: t('cancelBtn', state.lang),
      focusRestoreEl: e.currentTarget,
      lang: state.lang,
      onConfirm: async () => {
        await resetAllDemoData();
        showToast(t('toastReset', state.lang));
      },
    });
  });

  // Edit / Delete row actions
  container.querySelector('#adminList')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-admin-edit]');
    if (editBtn) {
      setAdminEditId(editBtn.getAttribute('data-admin-edit'));
      return;
    }
    const delBtn = e.target.closest('[data-admin-del]');
    if (delBtn && isAdmin) {
      const id = delBtn.getAttribute('data-admin-del');
      openConfirmModal({
        title: t('confirmDeleteTitle', state.lang),
        message: t('confirmDeleteMsg', state.lang),
        confirmLabel: t('deleteBtn', state.lang),
        cancelLabel: t('cancelBtn', state.lang),
        focusRestoreEl: delBtn,
        lang: state.lang,
        onConfirm: async () => {
          await deleteAdminItem(activeTab, id);
          showToast(t('toastDeleted', state.lang));
        },
      });
    }
  });

  // Form submit + validation
  container.querySelector('#adminForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = container.querySelector('#adminFormError');
    const showErr = (msg) => {
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
      }
    };
    errEl?.classList.add('hidden');

    const nama = container.querySelector('#adminName')?.value.trim() || '';
    const wilayah = container.querySelector('#adminRegion')?.value || REGIONS[0];
    const priceVal = Math.max(0, Number(container.querySelector('#adminPrice')?.value) || 0);
    const imgUrl = container.querySelector('#adminImageUrl')?.value.trim() || '';

    if (!nama) {
      showErr(t('validationRequired', state.lang));
      return;
    }
    if (activeTab !== 'packages' && !isValidImagePath(imgUrl)) {
      showErr(t('validationUrl', state.lang));
      return;
    }

    const splitCsv = (sel) =>
      (container.querySelector(sel)?.value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    if (activeTab === 'destinations') {
      const deskripsi = container.querySelector('#adminDesc')?.value.trim() || '';
      if (!deskripsi) {
        showErr(t('validationRequired', state.lang));
        return;
      }
      await upsertAdminItem('destinations', {
        nama,
        wilayah,
        kategori: container.querySelector('#adminCategory')?.value || CATEGORIES[0],
        alamat: container.querySelector('#adminAddress')?.value.trim() || `${wilayah}, Aceh`,
        estimasiBiaya: priceVal,
        imageUrl: imgUrl || '/images/illustrations/culture.svg',
        deskripsi,
        fasilitas: splitCsv('#adminFacilities'),
        fasilitasIbadah: splitCsv('#adminWorship'),
        unggulan: Boolean(container.querySelector('#adminFeatured')?.checked),
      });
    } else if (activeTab === 'foods') {
      await upsertAdminItem('foods', {
        nama,
        wilayah,
        kategori: container.querySelector('#adminFoodCat')?.value.trim() || 'Kuliner khas',
        harga: priceVal,
        kontak: container.querySelector('#adminContact')?.value.trim() || '6281234567800',
        statusSertifikasiHalal: container.querySelector('#adminHalalStatus')?.value || 'tidak_diketahui',
        sumberVerifikasi: container.querySelector('#adminHalalSource')?.value.trim() || 'Catatan katalog lokal',
        imageUrl: imgUrl || '/images/illustrations/food.svg',
      });
    } else if (activeTab === 'stays') {
      await upsertAdminItem('stays', {
        nama,
        wilayah,
        hargaPerMalam: priceVal,
        kontak: container.querySelector('#adminContact')?.value.trim() || '6281234567810',
        fasilitas: splitCsv('#adminFacilities'),
        fasilitasRamahMuslim: splitCsv('#adminWorship'),
        imageUrl: imgUrl || '/images/illustrations/stay.svg',
      });
    } else if (activeTab === 'packages' && isAdmin) {
      const deskripsi = container.querySelector('#adminDesc')?.value.trim() || '';
      if (!deskripsi) {
        showErr(t('validationRequired', state.lang));
        return;
      }
      await upsertAdminItem('packages', {
        nama,
        wilayah,
        durasi: Math.min(5, Math.max(1, Number(container.querySelector('#adminDuration')?.value) || 2)),
        estimasiBiaya: priceVal,
        minat: splitCsv('#adminInterests'),
        daftarDestinasi: splitCsv('#adminDestIds'),
        deskripsi,
      });
    }

    showToast(t('toastSaved', state.lang));
  });
}
