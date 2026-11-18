/**
 * CekIG — Main Application Controller
 * Features: Unfollowers, Mutuals, Fans, Pending Follow Requests, Recently Unfollowed,
 * Whitelist, Auto Date-Range Mismatch Detection, Bulk Open/Mark, Auto Region i18n (ID/EN).
 */
(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'follcheck_theme',
    WHITELIST: 'follcheck_whitelist_v1',
    UNFOLLOWED: 'follcheck_unfollowed_v1'
  };

  const PAGE_SIZE = 50;

  const state = {
    followers: [],
    following: [],
    notBackAll: [],
    mutuals: [],
    fans: [],
    pendingRequests: [],
    unfollowedHistory: [],

    sourceMeta: { type: '', count: 0 },
    loadedFiles: [],

    followersMinTs: null,
    followingMinTs: null,
    hasDateMismatch: false,
    olderFollowingCount: 0,
    matchPeriodActive: false,

    whitelist: new Set(loadJsonArray(STORAGE_KEYS.WHITELIST)),
    unfollowed: new Set(loadJsonArray(STORAGE_KEYS.UNFOLLOWED)),

    activeTab: 'notBack',
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'date_desc',
    currentPage: 1,

    pendingFollowersFiles: [],
    pendingFollowingFiles: [],
    pendingExtraFiles: []
  };

  const el = {
    html: document.documentElement,
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    langBtns: document.querySelectorAll('.lang-btn'),
    btnOpenGuide: document.getElementById('btnOpenGuide'),
    btnCloseGuide: document.getElementById('btnCloseGuide'),
    btnCloseGuideBottom: document.getElementById('btnCloseGuideBottom'),
    btnGuideFromWarning: document.getElementById('btnGuideFromWarning'),
    guideModal: document.getElementById('guideModal'),
    btnLoadDemo: document.getElementById('btnLoadDemo'),

    modeTabs: document.querySelectorAll('.mode-tab'),
    modePanes: {
      zip: document.getElementById('pane-zip'),
      files: document.getElementById('pane-files'),
      manual: document.getElementById('pane-manual')
    },

    zipDropzone: document.getElementById('zipDropzone'),
    zipFileInput: document.getElementById('zipFileInput'),

    followersBox: document.getElementById('followersBox'),
    followingBox: document.getElementById('followingBox'),
    extraBox: document.getElementById('extraBox'),
    followersFileInput: document.getElementById('followersFileInput'),
    followingFileInput: document.getElementById('followingFileInput'),
    extraFileInput: document.getElementById('extraFileInput'),
    followersStatus: document.getElementById('followersStatus'),
    followingStatus: document.getElementById('followingStatus'),
    extraStatus: document.getElementById('extraStatus'),
    btnPickFollowers: document.getElementById('btnPickFollowers'),
    btnPickFollowing: document.getElementById('btnPickFollowing'),
    btnPickExtra: document.getElementById('btnPickExtra'),
    btnAnalyzeFiles: document.getElementById('btnAnalyzeFiles'),

    manualFollowers: document.getElementById('manualFollowers'),
    manualFollowing: document.getElementById('manualFollowing'),
    btnAnalyzeManual: document.getElementById('btnAnalyzeManual'),

    errorBanner: document.getElementById('errorBanner'),
    errorText: document.getElementById('errorText'),

    resultsSection: document.getElementById('resultsSection'),
    dateMismatchBanner: document.getElementById('dateMismatchBanner'),
    dateMismatchText: document.getElementById('dateMismatchText'),
    toggleMatchPeriod: document.getElementById('toggleMatchPeriod'),

    statFollowers: document.getElementById('statFollowers'),
    statFollowing: document.getElementById('statFollowing'),
    statNotFollowingBack: document.getElementById('statNotFollowingBack'),
    statMutuals: document.getElementById('statMutuals'),
    statRatio: document.getElementById('statRatio'),
    statSourceInfo: document.getElementById('statSourceInfo'),
    statFollowersRange: document.getElementById('statFollowersRange'),
    statFollowingRange: document.getElementById('statFollowingRange'),
    statNotBackPct: document.getElementById('statNotBackPct'),
    statUnfollowedProgress: document.getElementById('statUnfollowedProgress'),
    unfollowProgressBar: document.getElementById('unfollowProgressBar'),
    statMutualRate: document.getElementById('statMutualRate'),
    statFansMeta: document.getElementById('statFansMeta'),

    catTabs: document.querySelectorAll('.cat-tab'),
    countNotBack: document.getElementById('countNotBack'),
    countMutuals: document.getElementById('countMutuals'),
    countFans: document.getElementById('countFans'),
    countPending: document.getElementById('countPending'),
    countUnfollowedHistory: document.getElementById('countUnfollowedHistory'),
    countWhitelist: document.getElementById('countWhitelist'),

    btnCopyList: document.getElementById('btnCopyList'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnResetSession: document.getElementById('btnResetSession'),

    bulkBar: document.getElementById('bulkBar'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    bulkBatchSize: document.getElementById('bulkBatchSize'),
    btnBulkOpen: document.getElementById('btnBulkOpen'),
    btnBulkMarkDone: document.getElementById('btnBulkMarkDone'),

    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    statusFilter: document.getElementById('statusFilter'),
    sortSelect: document.getElementById('sortSelect'),

    thCheck: document.getElementById('thCheck'),
    accountsTableBody: document.getElementById('accountsTableBody'),
    emptyState: document.getElementById('emptyState'),
    emptyTitle: document.getElementById('emptyTitle'),
    emptyDesc: document.getElementById('emptyDesc'),

    tableFooter: document.getElementById('tableFooter'),
    paginationInfo: document.getElementById('paginationInfo'),
    pageIndicator: document.getElementById('pageIndicator'),
    btnPrevPage: document.getElementById('btnPrevPage'),
    btnNextPage: document.getElementById('btnNextPage'),

    filesAuditBar: document.getElementById('filesAuditBar'),
    filesAuditList: document.getElementById('filesAuditList'),
    toast: document.getElementById('toast')
  };

  let toastTimer = null;

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  function t(key, vars) {
    return window.I18n.t(key, vars);
  }

  function loadJsonArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveSet(key, setObj) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(setObj)));
    } catch (_) {}
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2800);
  }

  function showError(message) {
    el.errorText.textContent = message;
    el.errorBanner.hidden = false;
  }

  function clearError() {
    el.errorBanner.hidden = true;
    el.errorText.textContent = '';
  }

  function formatNumber(num) {
    return new Intl.NumberFormat(window.I18n.getLocale()).format(num);
  }

  function formatTimestamp(ts) {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(window.I18n.getLocale(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }

  function getTimestampBounds(list) {
    let min = null;
    let max = null;
    for (const acc of list) {
      if (typeof acc.timestamp === 'number' && acc.timestamp > 0) {
        if (min === null || acc.timestamp < min) min = acc.timestamp;
        if (max === null || acc.timestamp > max) max = acc.timestamp;
      }
    }
    return { min, max };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
      reader.readAsText(file);
    });
  }

  function getSourceLabel() {
    if (state.matchPeriodActive) return t('statPeriodMatched');
    switch (state.sourceMeta.type) {
      case 'zip':
        return t('sourceZip', { n: state.sourceMeta.count });
      case 'files':
        return t('sourceFiles');
      case 'manual':
        return t('sourceManual');
      case 'demo':
        return t('sourceDemo');
      default:
        return '—';
    }
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------
  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const preferred =
      saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    el.html.setAttribute('data-theme', preferred);
  }

  function toggleTheme() {
    const current = el.html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    el.html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
  }

  // ---------------------------------------------------------------------------
  // Core Comparison Engine
  // ---------------------------------------------------------------------------
  function computeLists() {
    const followerSet = new Set(state.followers.map((a) => a.username));
    const followingSet = new Set(state.following.map((a) => a.username));

    const effectiveFollowing =
      state.matchPeriodActive && state.followersMinTs
        ? state.following.filter((a) => !a.timestamp || a.timestamp >= state.followersMinTs)
        : state.following;

    state.notBackAll = effectiveFollowing.filter((a) => !followerSet.has(a.username));
    state.mutuals = effectiveFollowing.filter((a) => followerSet.has(a.username));
    state.fans = state.followers.filter((a) => !followingSet.has(a.username));
  }

  function renderMismatchBanner() {
    if (!state.hasDateMismatch) {
      el.dateMismatchBanner.hidden = true;
      return;
    }
    el.dateMismatchText.innerHTML = t('mismatchBody', {
      fStart: formatTimestamp(state.followersMinTs),
      gStart: formatTimestamp(state.followingMinTs),
      olderCount: formatNumber(state.olderFollowingCount)
    });
    el.dateMismatchBanner.hidden = false;
  }

  function processComparison(payload) {
    clearError();
    const {
      followers = [],
      following = [],
      pendingRequests = [],
      unfollowedHistory = [],
      sourceMeta = { type: '', count: 0 },
      loadedFiles = []
    } = payload;

    if (followers.length === 0 && following.length === 0 && pendingRequests.length === 0) {
      showError(t('errNoValidUsers'));
      return;
    }

    state.followers = followers;
    state.following = following;
    state.pendingRequests = pendingRequests;
    state.unfollowedHistory = unfollowedHistory;
    state.sourceMeta = sourceMeta;
    state.loadedFiles = loadedFiles;

    const fBounds = getTimestampBounds(followers);
    const gBounds = getTimestampBounds(following);
    state.followersMinTs = fBounds.min;
    state.followingMinTs = gBounds.min;

    const NINETY_DAYS = 90 * 86400;
    state.hasDateMismatch = Boolean(
      fBounds.min && gBounds.min && fBounds.min - gBounds.min > NINETY_DAYS
    );
    state.olderFollowingCount = state.hasDateMismatch
      ? following.filter((a) => a.timestamp && a.timestamp < fBounds.min).length
      : 0;

    state.matchPeriodActive = false;
    el.toggleMatchPeriod.checked = false;
    renderMismatchBanner();

    computeLists();

    state.activeTab = 'notBack';
    state.searchQuery = '';
    state.statusFilter = 'all';
    state.currentPage = 1;

    el.searchInput.value = '';
    el.btnClearSearch.hidden = true;
    el.statusFilter.value = 'all';

    if (state.loadedFiles.length > 0) {
      el.filesAuditList.textContent = state.loadedFiles.join(' • ');
      el.filesAuditBar.hidden = false;
    } else {
      el.filesAuditBar.hidden = true;
    }

    el.resultsSection.hidden = false;
    updateAllViews();

    el.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(t('toastDone', { n: formatNumber(state.notBackAll.length) }));
  }

  function getActiveRawList() {
    switch (state.activeTab) {
      case 'notBack':
        return state.notBackAll.filter((a) => !state.whitelist.has(a.username));
      case 'mutuals':
        return state.mutuals;
      case 'fans':
        return state.fans;
      case 'pending':
        return state.pendingRequests;
      case 'unfollowedHistory':
        return state.unfollowedHistory;
      case 'whitelist':
        return state.notBackAll.filter((a) => state.whitelist.has(a.username));
      default:
        return [];
    }
  }

  function getFilteredAndSortedList() {
    let list = getActiveRawList().slice();

    const q = state.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.username.includes(q) ||
          (a.displayName && a.displayName.toLowerCase().includes(q))
      );
    }

    if (state.activeTab === 'notBack') {
      if (state.statusFilter === 'pending') {
        list = list.filter((a) => !state.unfollowed.has(a.username));
      } else if (state.statusFilter === 'done') {
        list = list.filter((a) => state.unfollowed.has(a.username));
      }
    }

    list.sort((a, b) => {
      switch (state.sortBy) {
        case 'alpha_asc':
          return a.username.localeCompare(b.username);
        case 'alpha_desc':
          return b.username.localeCompare(a.username);
        case 'date_asc':
          return (a.timestamp || Number.MAX_SAFE_INTEGER) - (b.timestamp || Number.MAX_SAFE_INTEGER);
        case 'date_desc':
        default:
          return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });

    return list;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function updateStats() {
    const followersCount = state.followers.length;
    const effectiveFollowingCount = state.notBackAll.length + state.mutuals.length;
    const activeNotBack = state.notBackAll.filter((a) => !state.whitelist.has(a.username));
    const whitelistedInSession = state.notBackAll.filter((a) => state.whitelist.has(a.username));
    const markedUnfollowed = activeNotBack.filter((a) => state.unfollowed.has(a.username)).length;

    const ratio = state.following.length > 0 ? (followersCount / state.following.length).toFixed(2) : '0.00';
    const notBackPct = effectiveFollowingCount > 0 ? Math.round((activeNotBack.length / effectiveFollowingCount) * 100) : 0;
    const mutualRate = effectiveFollowingCount > 0 ? Math.round((state.mutuals.length / effectiveFollowingCount) * 100) : 0;
    const unfollowProgressPct = activeNotBack.length > 0 ? Math.round((markedUnfollowed / activeNotBack.length) * 100) : 0;

    el.statFollowers.textContent = formatNumber(followersCount);
    el.statFollowing.textContent = formatNumber(effectiveFollowingCount);
    el.statNotFollowingBack.textContent = formatNumber(activeNotBack.length);
    el.statMutuals.textContent = formatNumber(state.mutuals.length);

    el.statRatio.textContent = t('statRatio', { r: ratio });
    el.statSourceInfo.textContent = getSourceLabel();

    el.statFollowersRange.textContent = state.followersMinTs
      ? t('statSince', { d: formatTimestamp(state.followersMinTs) })
      : t('statLocalData');
    el.statFollowingRange.textContent = state.matchPeriodActive && state.followersMinTs
      ? t('statFilteredSince', { d: formatTimestamp(state.followersMinTs) })
      : state.followingMinTs
        ? t('statSince', { d: formatTimestamp(state.followingMinTs) })
        : t('statLocalData');

    el.statNotBackPct.textContent = `${notBackPct}%`;
    el.statUnfollowedProgress.textContent = t('statProgress', {
      done: formatNumber(markedUnfollowed),
      total: formatNumber(activeNotBack.length)
    });
    el.unfollowProgressBar.style.width = `${unfollowProgressPct}%`;

    el.statMutualRate.textContent = `${mutualRate}%`;
    el.statFansMeta.textContent = t('statFansMeta', { n: formatNumber(state.fans.length) });

    el.countNotBack.textContent = formatNumber(activeNotBack.length);
    el.countMutuals.textContent = formatNumber(state.mutuals.length);
    el.countFans.textContent = formatNumber(state.fans.length);
    el.countPending.textContent = formatNumber(state.pendingRequests.length);
    el.countUnfollowedHistory.textContent = formatNumber(state.unfollowedHistory.length);
    el.countWhitelist.textContent = formatNumber(whitelistedInSession.length);
  }

  function updateTabUI() {
    el.catTabs.forEach((btn) => {
      const isActive = btn.dataset.tab === state.activeTab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    const isNotBack = state.activeTab === 'notBack';
    el.statusFilter.hidden = !isNotBack;
    el.thCheck.hidden = !isNotBack;
    el.bulkBar.hidden = !isNotBack;
  }

  function renderTable() {
    const filtered = getFilteredAndSortedList();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIdx = (state.currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);
    const pageItems = filtered.slice(startIdx, endIdx);

    const isNotBack = state.activeTab === 'notBack';
    const isWhitelist = state.activeTab === 'whitelist';

    if (total === 0) {
      el.accountsTableBody.innerHTML = '';
      el.emptyState.hidden = false;
      el.tableFooter.hidden = true;
      if (el.selectAllCheckbox) {
        el.selectAllCheckbox.checked = false;
        el.selectAllCheckbox.indeterminate = false;
      }

      if (state.searchQuery.trim()) {
        el.emptyTitle.textContent = t('emptySearchTitle');
        el.emptyDesc.textContent = t('emptySearchDesc', { q: state.searchQuery.trim() });
      } else if (isNotBack) {
        el.emptyTitle.textContent = t('emptyNotBackTitle');
        el.emptyDesc.textContent = t('emptyNotBackDesc');
      } else if (isWhitelist) {
        el.emptyTitle.textContent = t('emptyWhitelistTitle');
        el.emptyDesc.textContent = t('emptyWhitelistDesc');
      } else if (state.activeTab === 'pending') {
        el.emptyTitle.textContent = t('emptyPendingTitle');
        el.emptyDesc.textContent = t('emptyPendingDesc');
      } else if (state.activeTab === 'unfollowedHistory') {
        el.emptyTitle.textContent = t('emptyUnfollowedTitle');
        el.emptyDesc.textContent = t('emptyUnfollowedDesc');
      } else {
        el.emptyTitle.textContent = t('emptyDefaultTitle');
        el.emptyDesc.textContent = t('emptyDefaultDesc');
      }
      return;
    }

    el.emptyState.hidden = true;
    el.tableFooter.hidden = false;

    const rowsHtml = pageItems
      .map((acc) => {
        const u = escapeHtml(acc.username);
        const initials = escapeHtml(acc.username.replace(/^_+/, '').slice(0, 2) || 'IG');
        const dateStr = formatTimestamp(acc.timestamp);
        const isDone = state.unfollowed.has(acc.username);
        const subName = acc.displayName ? `<span class="display-name">${escapeHtml(acc.displayName)}</span>` : '';

        const deletedBadge = acc.isDeleted
          ? `<span class="badge-deleted">${escapeHtml(t('badgeDeleted'))}</span>`
          : '';

        const checkCell = isNotBack
          ? `<td class="col-check">
              <label class="check-toggle">
                <input type="checkbox" class="js-toggle-unfollow" data-username="${u}" ${isDone ? 'checked' : ''} />
                <span>${escapeHtml(isDone ? t('statusDone') : t('statusPending'))}</span>
              </label>
            </td>`
          : '';

        let secondaryActionBtn = '';
        if (isNotBack) {
          secondaryActionBtn = `<button type="button" class="btn btn-ghost btn-xs js-toggle-whitelist" data-username="${u}">${escapeHtml(t('btnExclude'))}</button>`;
        } else if (isWhitelist) {
          secondaryActionBtn = `<button type="button" class="btn btn-ghost btn-xs js-toggle-whitelist" data-username="${u}">${escapeHtml(t('btnRemoveWhitelist'))}</button>`;
        }

        return `
          <tr class="${isNotBack && isDone ? 'row-unfollowed' : ''}">
            ${checkCell}
            <td class="col-user">
              <div class="user-cell">
                <span class="avatar-mono" aria-hidden="true">${initials}</span>
                <div class="user-meta">
                  <div class="username-row">
                    <a class="username-link" href="${escapeHtml(acc.href)}" target="_blank" rel="noopener noreferrer">@${u}</a>
                    ${deletedBadge}
                  </div>
                  ${subName}
                  <span class="mobile-date">${dateStr !== '—' ? escapeHtml(t('mobileDatePrefix', { d: dateStr })) : ''}</span>
                </div>
              </div>
            </td>
            <td class="col-date">${dateStr}</td>
            <td class="col-actions">
              <div class="row-actions">
                ${secondaryActionBtn}
                <a class="btn btn-secondary btn-xs" href="${escapeHtml(acc.href)}" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(t('btnOpenIg'))} &nearr;
                </a>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    el.accountsTableBody.innerHTML = rowsHtml;

    if (isNotBack && el.selectAllCheckbox) {
      const pageUsernames = pageItems.map((a) => a.username);
      const allDone = pageUsernames.length > 0 && pageUsernames.every((u) => state.unfollowed.has(u));
      const someDone = pageUsernames.some((u) => state.unfollowed.has(u));
      el.selectAllCheckbox.checked = allDone;
      el.selectAllCheckbox.indeterminate = someDone && !allDone;
    }

    el.paginationInfo.textContent = t('paginationInfo', {
      start: formatNumber(startIdx + 1),
      end: formatNumber(endIdx),
      total: formatNumber(total)
    });
    el.pageIndicator.textContent = `${state.currentPage} / ${totalPages}`;
    el.btnPrevPage.disabled = state.currentPage <= 1;
    el.btnNextPage.disabled = state.currentPage >= totalPages;
  }

  function updateFileStatusLabels() {
    const fCount = state.pendingFollowersFiles.length;
    el.followersStatus.textContent = fCount > 0 ? t('statusFilesSelected', { n: fCount }) : t('statusNone');
    const gCount = state.pendingFollowingFiles.length;
    el.followingStatus.textContent = gCount > 0 ? t('statusFilesSelected', { n: gCount }) : t('statusNone');
    const eCount = state.pendingExtraFiles.length;
    el.extraStatus.textContent = eCount > 0 ? t('statusFilesSelected', { n: eCount }) : t('statusOptional');
  }

  function updateAllViews() {
    renderMismatchBanner();
    updateStats();
    updateTabUI();
    renderTable();
  }

  // ---------------------------------------------------------------------------
  // Input Handlers
  // ---------------------------------------------------------------------------
  async function handleZipFile(file) {
    clearError();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showError(t('errNotZip'));
      return;
    }

    try {
      showToast(t('toastReadingZip'));
      const buffer = await file.arrayBuffer();
      const rawMatched = await window.ZipReader.extractMatchingTextFiles(
        buffer,
        (path) => window.IGParser.classifyZipEntry(path) !== null
      );

      const matchedEntries = window.IGParser.filterPreferredZipEntries(rawMatched);

      if (matchedEntries.length === 0) {
        showError(t('errNoFilesInZip'));
        return;
      }

      const followerLists = [];
      const followingLists = [];
      const pendingLists = [];
      const unfollowedLists = [];
      const loadedNames = [];

      for (const entry of matchedEntries) {
        const type = window.IGParser.classifyZipEntry(entry.name);
        const parsed = window.IGParser.parseExportFile(entry.name, entry.text);
        loadedNames.push(`${entry.name.split('/').pop()} (${formatNumber(parsed.length)})`);
        if (type === 'followers') followerLists.push(parsed);
        else if (type === 'following') followingLists.push(parsed);
        else if (type === 'pending') pendingLists.push(parsed);
        else if (type === 'unfollowedHistory') unfollowedLists.push(parsed);
      }

      const followers = window.IGParser.mergeAccountLists(followerLists);
      const following = window.IGParser.mergeAccountLists(followingLists);
      const pendingRequests = window.IGParser.mergeAccountLists(pendingLists);
      const unfollowedHistory = window.IGParser.mergeAccountLists(unfollowedLists);

      if (following.length === 0 && pendingRequests.length === 0) {
        showError(t('errNoFollowing'));
        return;
      }

      processComparison({
        followers,
        following,
        pendingRequests,
        unfollowedHistory,
        sourceMeta: { type: 'zip', count: matchedEntries.length },
        loadedFiles: loadedNames
      });
    } catch (err) {
      showError(err.message || 'ZIP error');
    }
  }

  async function handleSeparateFilesAnalyze() {
    clearError();
    try {
      const followerLists = [];
      const followingLists = [];
      const pendingLists = [];
      const unfollowedLists = [];
      const loadedNames = [];

      for (const f of state.pendingFollowersFiles) {
        const text = await readFileAsText(f);
        const parsed = window.IGParser.parseExportFile(f.name, text);
        followerLists.push(parsed);
        loadedNames.push(`${f.name} (${formatNumber(parsed.length)})`);
      }

      for (const f of state.pendingFollowingFiles) {
        const text = await readFileAsText(f);
        const parsed = window.IGParser.parseExportFile(f.name, text);
        followingLists.push(parsed);
        loadedNames.push(`${f.name} (${formatNumber(parsed.length)})`);
      }

      for (const f of state.pendingExtraFiles) {
        const text = await readFileAsText(f);
        const parsed = window.IGParser.parseExportFile(f.name, text);
        const type = window.IGParser.classifyFileName(f.name);
        loadedNames.push(`${f.name} (${formatNumber(parsed.length)})`);
        if (type === 'unfollowedHistory') unfollowedLists.push(parsed);
        else pendingLists.push(parsed);
      }

      processComparison({
        followers: window.IGParser.mergeAccountLists(followerLists),
        following: window.IGParser.mergeAccountLists(followingLists),
        pendingRequests: window.IGParser.mergeAccountLists(pendingLists),
        unfollowedHistory: window.IGParser.mergeAccountLists(unfollowedLists),
        sourceMeta: { type: 'files', count: loadedNames.length },
        loadedFiles: loadedNames
      });
    } catch (err) {
      showError(err.message || 'File read error');
    }
  }

  function handleManualAnalyze() {
    clearError();
    const followers = window.IGParser.parseManualText(el.manualFollowers.value);
    const following = window.IGParser.parseManualText(el.manualFollowing.value);

    if (following.length === 0) {
      showError(t('errManualEmpty'));
      return;
    }
    processComparison({
      followers,
      following,
      pendingRequests: [],
      unfollowedHistory: [],
      sourceMeta: { type: 'manual', count: 2 },
      loadedFiles: []
    });
  }

  function loadDemoData() {
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;

    const demoMutuals = [
      'dimas.pratama', 'nadia_putri', 'rizky.hidayat', 'clara_wijaya',
      'fajar.nugroho', 'salsa.amalia', 'bagas_kurniawan', 'dewi.lestari',
      'kevin.santoso', 'tiara_melati', 'rendi.saputra', 'ayu_rahmawati'
    ];

    const demoNotBack = [
      'studio.minimalis', 'kopi.senja.jkt', 'arsitektur.id', 'bintang_film99',
      'gadget.review.id', 'fotografi.jalan', 'desain.grafis.harian',
      'akbar.official', 'toko.sneakers.ori', 'travel.nusantara',
      '__deleted__sample99210'
    ];

    const demoFans = ['penggemar_01', 'hendra.setiawan', 'maya_kusuma', 'farhan.alwi'];

    const demoPending = [
      { username: 'private.diary99', displayName: 'Nabila', timestamp: now - 14 * day },
      { username: 'karya.rahasia', displayName: 'Raka Studio', timestamp: now - 39 * day },
      { username: 'second.account.id', displayName: '', timestamp: now - 62 * day }
    ].map((x) => ({
      ...x,
      href: `https://www.instagram.com/${x.username}/`,
      isDeleted: false
    }));

    const demoUnfollowed = [
      { username: 'promo_spam_01', displayName: 'Promo Harian', timestamp: now - 3 * day },
      { username: 'old_brand_store', displayName: 'Brand Store', timestamp: now - 12 * day }
    ].map((x) => ({
      ...x,
      href: `https://www.instagram.com/${x.username}/`,
      isDeleted: false
    }));

    const followers = [
      ...demoMutuals.map((u, i) => ({
        username: u,
        displayName: '',
        href: `https://www.instagram.com/${u}/`,
        timestamp: now - (i + 5) * 7 * day,
        isDeleted: false
      })),
      ...demoFans.map((u, i) => ({
        username: u,
        displayName: '',
        href: `https://www.instagram.com/${u}/`,
        timestamp: now - (i + 2) * 4 * day,
        isDeleted: false
      }))
    ];

    const following = [
      ...demoMutuals.map((u, i) => ({
        username: u,
        displayName: '',
        href: `https://www.instagram.com/${u}/`,
        timestamp: now - (i + 4) * 6 * day,
        isDeleted: false
      })),
      ...demoNotBack.map((u, i) => ({
        username: u,
        displayName: '',
        href: `https://www.instagram.com/${u}/`,
        timestamp: now - (i + 1) * 11 * day,
        isDeleted: u.startsWith('__deleted__')
      }))
    ];

    processComparison({
      followers,
      following,
      pendingRequests: demoPending,
      unfollowedHistory: demoUnfollowed,
      sourceMeta: { type: 'demo', count: 4 },
      loadedFiles: [
        'followers_1.json (16)',
        'following.json (23)',
        'pending_follow_requests.json (3)',
        'recently_unfollowed_profiles.json (2)'
      ]
    });
  }

  // ---------------------------------------------------------------------------
  // Export & Copy
  // ---------------------------------------------------------------------------
  async function copyActiveList() {
    const list = getFilteredAndSortedList();
    if (list.length === 0) {
      showToast(t('toastNoData'));
      return;
    }
    const text = list.map((a) => `@${a.username}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toastCopied', { n: formatNumber(list.length) }));
    } catch (_) {
      showToast(t('toastCopyFail'));
    }
  }

  function exportActiveCsv() {
    const list = getFilteredAndSortedList();
    if (list.length === 0) {
      showToast(t('toastNoData'));
      return;
    }

    const header = ['username', 'display_name', 'profile_url', 'date_iso', 'marked_unfollowed'];
    const rows = list.map((a) => [
      a.username,
      a.displayName || '',
      a.href,
      a.timestamp ? new Date(a.timestamp * 1000).toISOString() : '',
      state.unfollowed.has(a.username) ? 'yes' : 'no'
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `CekIG-${state.activeTab}-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('toastCsvDone'));
  }

  // ---------------------------------------------------------------------------
  // Event Binding
  // ---------------------------------------------------------------------------
  function bindEvents() {
    el.btnThemeToggle.addEventListener('click', toggleTheme);

    // Language Switcher
    el.langBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        window.I18n.setLang(btn.dataset.lang);
        updateFileStatusLabels();
        if (!el.resultsSection.hidden) {
          updateAllViews();
        }
      });
    });

    // Guide Modal
    const openModal = () => {
      el.guideModal.hidden = false;
      document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      el.guideModal.hidden = true;
      document.body.style.overflow = '';
    };
    el.btnOpenGuide.addEventListener('click', openModal);
    el.btnGuideFromWarning.addEventListener('click', openModal);
    el.btnCloseGuide.addEventListener('click', closeModal);
    el.btnCloseGuideBottom.addEventListener('click', closeModal);
    el.guideModal.addEventListener('click', (e) => {
      if (e.target === el.guideModal) closeModal();
    });

    el.btnLoadDemo.addEventListener('click', loadDemoData);

    // Date-range match toggle
    el.toggleMatchPeriod.addEventListener('change', (e) => {
      state.matchPeriodActive = e.target.checked;
      state.currentPage = 1;
      computeLists();
      updateAllViews();
      showToast(state.matchPeriodActive ? t('toastPeriodOn') : t('toastPeriodOff'));
    });

    // Mode Tabs
    el.modeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        clearError();
        el.modeTabs.forEach((tBtn) => {
          const active = tBtn === tab;
          tBtn.classList.toggle('active', active);
          tBtn.setAttribute('aria-selected', String(active));
        });
        Object.keys(el.modePanes).forEach((key) => {
          el.modePanes[key].hidden = key !== mode;
        });
      });
    });

    // ZIP Dropzone
    el.zipDropzone.addEventListener('click', () => el.zipFileInput.click());
    el.zipDropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.zipFileInput.click();
      }
    });
    el.zipDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.zipDropzone.classList.add('drag-over');
    });
    el.zipDropzone.addEventListener('dragleave', () => {
      el.zipDropzone.classList.remove('drag-over');
    });
    el.zipDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.zipDropzone.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleZipFile(file);
    });
    el.zipFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleZipFile(file);
      e.target.value = '';
    });

    // Separate Files
    el.btnPickFollowers.addEventListener('click', () => el.followersFileInput.click());
    el.btnPickFollowing.addEventListener('click', () => el.followingFileInput.click());
    el.btnPickExtra.addEventListener('click', () => el.extraFileInput.click());

    el.followersFileInput.addEventListener('change', (e) => {
      state.pendingFollowersFiles = Array.from(e.target.files || []);
      el.followersBox.classList.toggle('has-file', state.pendingFollowersFiles.length > 0);
      updateFileStatusLabels();
      el.btnAnalyzeFiles.disabled =
        state.pendingFollowersFiles.length === 0 || state.pendingFollowingFiles.length === 0;
    });

    el.followingFileInput.addEventListener('change', (e) => {
      state.pendingFollowingFiles = Array.from(e.target.files || []);
      el.followingBox.classList.toggle('has-file', state.pendingFollowingFiles.length > 0);
      updateFileStatusLabels();
      el.btnAnalyzeFiles.disabled =
        state.pendingFollowersFiles.length === 0 || state.pendingFollowingFiles.length === 0;
    });

    el.extraFileInput.addEventListener('change', (e) => {
      state.pendingExtraFiles = Array.from(e.target.files || []);
      el.extraBox.classList.toggle('has-file', state.pendingExtraFiles.length > 0);
      updateFileStatusLabels();
    });

    el.btnAnalyzeFiles.addEventListener('click', handleSeparateFilesAnalyze);
    el.btnAnalyzeManual.addEventListener('click', handleManualAnalyze);

    // Category Tabs
    el.catTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.dataset.tab;
        state.currentPage = 1;
        updateAllViews();
      });
    });

    // Search, Filter, Sort
    el.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      el.btnClearSearch.hidden = state.searchQuery.length === 0;
      renderTable();
    });

    el.btnClearSearch.addEventListener('click', () => {
      state.searchQuery = '';
      el.searchInput.value = '';
      el.btnClearSearch.hidden = true;
      state.currentPage = 1;
      renderTable();
      el.searchInput.focus();
    });

    el.statusFilter.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      renderTable();
    });

    el.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.currentPage = 1;
      renderTable();
    });

    // Row actions delegation
    el.accountsTableBody.addEventListener('change', (e) => {
      const target = e.target;
      if (target.classList.contains('js-toggle-unfollow')) {
        const username = target.dataset.username;
        if (target.checked) state.unfollowed.add(username);
        else state.unfollowed.delete(username);
        saveSet(STORAGE_KEYS.UNFOLLOWED, state.unfollowed);
        updateStats();
        renderTable();
      }
    });

    el.accountsTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.js-toggle-whitelist');
      if (!btn) return;
      const username = btn.dataset.username;
      if (state.whitelist.has(username)) {
        state.whitelist.delete(username);
        showToast(t('toastWhitelistRemove', { u: username }));
      } else {
        state.whitelist.add(username);
        showToast(t('toastWhitelistAdd', { u: username }));
      }
      saveSet(STORAGE_KEYS.WHITELIST, state.whitelist);
      updateAllViews();
    });

    // Bulk Actions
    el.selectAllCheckbox.addEventListener('change', (e) => {
      const filtered = getFilteredAndSortedList();
      const startIdx = (state.currentPage - 1) * PAGE_SIZE;
      const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
      const checked = e.target.checked;

      for (const acc of pageItems) {
        if (checked) state.unfollowed.add(acc.username);
        else state.unfollowed.delete(acc.username);
      }
      saveSet(STORAGE_KEYS.UNFOLLOWED, state.unfollowed);
      updateStats();
      renderTable();
      showToast(checked ? t('toastPageMarked') : t('toastPageUnmarked'));
    });

    el.btnBulkMarkDone.addEventListener('click', () => {
      const filtered = getFilteredAndSortedList();
      const startIdx = (state.currentPage - 1) * PAGE_SIZE;
      const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
      if (pageItems.length === 0) return;

      let addedCount = 0;
      for (const acc of pageItems) {
        if (!state.unfollowed.has(acc.username)) {
          state.unfollowed.add(acc.username);
          addedCount++;
        }
      }
      saveSet(STORAGE_KEYS.UNFOLLOWED, state.unfollowed);
      updateStats();
      renderTable();
      showToast(t('toastBulkMarked', { n: formatNumber(addedCount) }));
    });

    el.btnBulkOpen.addEventListener('click', () => {
      const filtered = getFilteredAndSortedList();
      const pending = filtered.filter((a) => !state.unfollowed.has(a.username) && !a.isDeleted);
      if (pending.length === 0) {
        showToast(t('toastNoPending'));
        return;
      }

      const batchCount = parseInt(el.bulkBatchSize.value, 10) || 10;
      const batch = pending.slice(0, batchCount);
      let opened = 0;
      for (const acc of batch) {
        const win = window.open(acc.href, '_blank', 'noopener,noreferrer');
        if (win) opened++;
      }
      if (opened < batch.length) {
        showToast(t('toastPopupBlocked', { opened, total: batch.length }));
      } else {
        showToast(t('toastOpenedTabs', { n: opened }));
      }
    });

    // Pagination
    el.btnPrevPage.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderTable();
      }
    });
    el.btnNextPage.addEventListener('click', () => {
      state.currentPage++;
      renderTable();
    });

    // Export, Copy, Reset
    el.btnCopyList.addEventListener('click', copyActiveList);
    el.btnExportCsv.addEventListener('click', exportActiveCsv);
    el.btnResetSession.addEventListener('click', () => {
      state.followers = [];
      state.following = [];
      state.notBackAll = [];
      state.mutuals = [];
      state.fans = [];
      state.pendingRequests = [];
      state.unfollowedHistory = [];
      el.resultsSection.hidden = true;
      showToast(t('toastReset'));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.guideModal.hidden) closeModal();
        else if (document.activeElement === el.searchInput && state.searchQuery) {
          el.btnClearSearch.click();
        }
      }
      if (
        e.key === '/' &&
        !el.resultsSection.hidden &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        el.searchInput.focus();
      }
    });
  }

  initTheme();
  window.I18n.applyDomTranslations();
  bindEvents();
})();
