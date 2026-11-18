/**
 * CekIG i18n — Automatic Region/Language Detection (ID / EN)
 * Detects Indonesian users via browser locale (id/ms-ID) or Indonesia timezones
 * (Asia/Jakarta, Asia/Makassar, Asia/Jayapura, Asia/Pontianak), and defaults to
 * English for international visitors. Users can override anytime.
 */
(function (global) {
  'use strict';

  const STORAGE_LANG_KEY = 'follcheck_lang_v1';

  const DICT = {
    id: {
      pageTitle: 'CekIG — Discover your Instagram Unfollowers',
      navAudit: 'Audit',
      navHow: 'Cara Kerja',
      navFaq: 'FAQ',
      privacyPill: '100% Lokal',
      privacyTooltip: 'Semua file diproses langsung di browser Anda, tidak pernah dikirim ke server',
      btnGuide: 'Panduan',
      themeTitle: 'Ganti tema terang/gelap',

      heroEyebrow: 'Tanpa Login · Tanpa Password · Aman dari Banned',
      heroTitle: 'Audit Follower, Unfollowers & Pending Requests Instagram',
      heroSubtitle:
        'Unggah file ekspor resmi Instagram (<code>.zip</code>, <code>.json</code>, atau <code>.html</code>). Cek siapa yang tidak follback, permintaan follow yang menggantung, dan riwayat unfollow—100% lokal di perangkat Anda.',
      btnDemo: 'Coba Data Contoh',

      tabZip: 'Upload ZIP Instagram',
      badgeRec: 'Terlengkap',
      tabFiles: 'File Terpisah (JSON / HTML)',
      tabManual: 'Tempel Manual',

      dropzoneTitle: 'Seret file <strong>ZIP ekspor Instagram</strong> ke sini, atau <span class="link-accent">pilih dari perangkat</span>',
      dropzoneHint:
        'Otomatis membaca <code>followers</code>, <code>following</code>, <code>pending_follow_requests</code>, dan <code>recently_unfollowed</code> (mengabaikan folder Threads).',

      labelFollowersFile: '1. File Followers (Wajib)',
      labelFollowingFile: '2. File Following (Wajib)',
      labelExtraFile: '3. File Tambahan — Opsional (Pending Requests & Riwayat Unfollow)',
      statusNone: 'Belum dipilih',
      statusOptional: 'Opsional',
      statusFilesSelected: '{n} file dipilih',
      descFollowersFile: 'Pilih <code>followers_1.json</code> (bisa pilih banyak sekaligus) atau <code>.html</code>.',
      descFollowingFile: 'Pilih <code>following.json</code> atau <code>following.html</code> dari folder <code>followers_and_following</code>.',
      descExtraFile: 'Tambahkan <code>pending_follow_requests.json</code>, <code>recent_follow_requests.json</code>, atau <code>recently_unfollowed_profiles.json</code>.',
      btnPickFollowers: 'Pilih File Followers',
      btnPickFollowing: 'Pilih File Following',
      btnPickExtra: 'Pilih File Tambahan',
      btnAnalyze: 'Analisis Data Sekarang',

      manualFollowersLabel: 'Daftar Followers (1 username per baris)',
      manualFollowingLabel: 'Daftar Following (1 username per baris)',
      btnCompare: 'Bandingkan Daftar',

      mismatchTitle: 'Rentang Waktu Ekspor Instagram Tidak Sama (Penyebab Akun Follback Salah Terbaca)',
      mismatchBody:
        'File <strong>Followers</strong> Anda hanya mencatat data mulai <strong>{fStart}</strong>, sedangkan <strong>Following</strong> mulai <strong>{gStart}</strong> ({olderCount} akun di-follow sebelum {fStart}). Akun lama yang sebenarnya sudah follback bisa ikut terbaca sebagai Tidak Follback.',
      mismatchToggle: 'Cocokkan periode otomatis (hanya cek Following dalam rentang tanggal Followers)',
      mismatchGuideBtn: 'Cara Ekspor "Sepanjang Waktu"',

      statFollowers: 'Followers',
      statFollowing: 'Following',
      statNotBack: 'Tidak Follback',
      statMutuals: 'Saling Follow',
      statRatio: 'Rasio {r}',
      statSince: 'Sejak {d}',
      statFilteredSince: 'Difilter ≥ {d}',
      statLocalData: 'Data lokal',
      statPeriodMatched: 'Periode Cocok',
      statProgress: '{done} / {total} selesai',
      statFansMeta: '{n} belum kamu follow',

      catNotBack: 'Tidak Follback',
      catMutuals: 'Saling Follow',
      catFans: 'Belum Difollow',
      catPending: 'Pending Requests',
      catUnfollowed: 'Baru Di-unfollow',
      catWhitelist: 'Whitelist',

      btnCopy: 'Salin',
      btnReset: 'Reset',
      bulkSelectPage: 'Pilih Halaman Ini',
      bulkHint: 'Klik <strong>Buka Massal</strong> untuk membuka beberapa profil sekaligus',
      btnBulkOpen: 'Buka Massal',
      btnBulkDone: '✓ Tandai Halaman Selesai',

      searchPlaceholder: 'Cari username... (tekan /)',
      filterAll: 'Semua Status',
      filterPending: 'Belum Di-unfollow',
      filterDone: 'Sudah Di-unfollow',
      sortDateDesc: 'Terbaru',
      sortDateAsc: 'Terlama',
      sortAlphaAsc: 'Username A–Z',
      sortAlphaDesc: 'Username Z–A',

      thStatus: 'Status',
      thAccount: 'Akun Instagram',
      thDate: 'Tanggal',
      thActions: 'Aksi',
      statusDone: 'Selesai',
      statusPending: 'Belum',
      badgeDeleted: 'Akun Dihapus',
      btnExclude: 'Kecualikan',
      btnRemoveWhitelist: 'Hapus Whitelist',
      btnOpenIg: 'Buka IG',
      mobileDatePrefix: 'Tgl: {d}',

      paginationInfo: 'Menampilkan {start}–{end} dari {total} akun',
      btnPrev: 'Sebelumnya',
      btnNext: 'Berikutnya',
      filesReadLabel: 'File dibaca:',

      emptySearchTitle: 'Username tidak ditemukan',
      emptySearchDesc: 'Tidak ada hasil untuk "{q}".',
      emptyNotBackTitle: 'Semua akun sudah follback!',
      emptyNotBackDesc: 'Tidak ada akun pada daftar Tidak Follback saat ini.',
      emptyWhitelistTitle: 'Daftar Whitelist kosong',
      emptyWhitelistDesc: 'Klik "Kecualikan" pada akun di tab Tidak Follback untuk menyimpannya di sini.',
      emptyPendingTitle: 'Tidak ada Pending Requests',
      emptyPendingDesc: 'File pending_follow_requests / recent_follow_requests tidak ada di arsip atau semuanya sudah diterima.',
      emptyUnfollowedTitle: 'Tidak ada riwayat Baru Di-unfollow',
      emptyUnfollowedDesc: 'File recently_unfollowed_profiles tidak ditemukan di arsip atau masih kosong.',
      emptyDefaultTitle: 'Daftar kosong',
      emptyDefaultDesc: 'Belum ada akun pada kategori ini.',

      howTitle: 'Cara Kerja dalam 3 Langkah Aman',
      howSubtitle: 'Tanpa login pihak ketiga—menggunakan arsip resmi dari Meta Accounts Center.',
      step1Title: 'Minta Data ZIP di Instagram',
      step1Desc: 'Buka <em>Pusat Akun &rarr; Unduh informasi Anda</em>, pilih <strong>Pengikut dan mengikuti</strong>, lalu ubah rentang tanggal ke <strong>Sepanjang waktu (All time)</strong>.',
      step2Title: 'Unggah Langsung ke CekIG',
      step2Desc: 'Seret file .zip langsung tanpa perlu diekstrak. Semua file diproses secara instan di memori browser perangkat Anda.',
      step3Title: 'Audit & Kelola Unfollow',
      step3Desc: 'Lihat siapa yang tidak follback, cek Pending Follow Requests yang masih menggantung, lalu buka profil secara massal atau tandai progres Anda.',

      faqTitle: 'Pertanyaan Umum (FAQ)',
      faqSubtitle: 'Jawaban singkat seputar keamanan, akurasi, dan batasan data Instagram.',
      faq1Q: 'Apakah CekIG aman dari banned atau shadowban Instagram?',
      faq1A: '100% aman. CekIG tidak pernah meminta password, cookie, atau akses login Instagram Anda. Semua analisis dilakukan dari file ekspor resmi Instagram secara lokal di browser Anda.',
      faq2Q: 'Kenapa ada akun yang sebenarnya sudah follback tapi muncul di Tidak Follback?',
      faq2A: 'Penyebab paling umum adalah saat mengunduh data dari Instagram, rentang tanggal dibiarkan di default "1 tahun terakhir". Ubah rentang tanggal ke "Sepanjang waktu (All time)" saat meminta data, atau aktifkan tombol "Cocokkan periode otomatis" di banner peringatan.',
      faq3Q: 'Apa itu tab Pending Requests dan Baru Di-unfollow?',
      faq3A: 'Pending Requests menampilkan daftar akun privat yang belum menerima permintaan follow Anda (dari file pending_follow_requests.json / recent_follow_requests.json). Baru Di-unfollow menampilkan riwayat akun yang baru saja Anda unfollow (dari recently_unfollowed_profiles.json).',
      faq4Q: 'Bisakah dipakai untuk banyak akun Instagram dan apakah gratis?',
      faq4A: 'Ya, sepenuhnya gratis tanpa batas jumlah unggahan ZIP dan bisa digunakan untuk mengaudit berbagai akun Instagram berbeda.',
      faq5Q: 'Apakah Instagram memberi notifikasi saat saya unfollow seseorang?',
      faq5A: 'Tidak. Instagram tidak mengirimkan notifikasi ketika Anda berhenti mengikuti (unfollow) suatu akun.',

      footerPrivacy: '100% lokal di browser. Tanpa server, tanpa pelacakan.',
      footerCredit: 'Kontak & Kredit:',

      guideTitle: 'Cara Unduh Data Instagram yang 100% Akurat',
      guideWarning:
        '<strong>Penting agar hasil tidak salah:</strong> Secara default Instagram memilih rentang <em>"1 tahun terakhir"</em>. Wajib ubah ke <strong>Sepanjang waktu (All time)</strong> agar seluruh daftar followers lama Anda ikut terunduh.',
      guideS1T: 'Buka Pusat Akun (Accounts Center)',
      guideS1D: 'Di aplikasi Instagram: <em>Profil &rarr; Menu (☰) &rarr; Pusat Akun &rarr; Informasi dan izin Anda &rarr; Unduh informasi Anda</em>.',
      guideS2T: 'Pilih Akun & Sebagian Informasi',
      guideS2D: 'Klik <em>Unduh atau transfer informasi</em>, pilih akun Instagram Anda, lalu pilih <strong>Sebagian informasi Anda</strong>.',
      guideS3T: 'Centang Pengikut dan Mengikuti',
      guideS3D: 'Gulir ke bagian <em>Koneksi</em>, centang hanya <strong>Pengikut dan mengikuti (Followers and following)</strong>, lalu klik Berikutnya.',
      guideS4T: 'WAJIB Ubah Rentang Tanggal ke "Sepanjang Waktu"',
      guideS4D: 'Pilih <em>Unduh ke perangkat</em>. Ketuk <strong>Rentang tanggal</strong> &rarr; <strong>Sepanjang waktu (All time)</strong>. Pilih format <strong>JSON</strong>.',
      guideS5T: 'Unduh & Unggah Langsung File ZIP',
      guideS5D: 'Tunggu 2–5 menit hingga file siap, unduh <code>.zip</code>, lalu seret langsung ke CekIG tanpa diekstrak.',
      guideClose: 'Siap, Mengerti',

      toastReadingZip: 'Membaca arsip ZIP...',
      toastDone: 'Analisis selesai: {n} akun tidak follback.',
      toastPeriodOn: 'Filter periode aktif: hanya menampilkan Following dalam rentang Followers.',
      toastPeriodOff: 'Menampilkan seluruh data Following.',
      toastCopied: '{n} username berhasil disalin.',
      toastCopyFail: 'Gagal menyalin otomatis. Gunakan tombol CSV.',
      toastNoData: 'Tidak ada data untuk diekspor.',
      toastCsvDone: 'File CSV berhasil diunduh.',
      toastReset: 'Data sesi telah direset.',
      toastPageMarked: 'Semua akun di halaman ini ditandai selesai.',
      toastPageUnmarked: 'Tanda selesai di halaman ini dibatalkan.',
      toastBulkMarked: '{n} akun di halaman ini ditandai selesai.',
      toastNoPending: 'Semua akun aktif pada filter ini sudah ditandai selesai.',
      toastOpenedTabs: 'Membuka {n} profil Instagram di tab baru.',
      toastPopupBlocked: 'Terbuka {opened} tab (izinkan pop-up browser untuk membuka {total} tab sekaligus).',
      toastWhitelistAdd: '@{u} ditambahkan ke Whitelist.',
      toastWhitelistRemove: '@{u} dikembalikan ke Tidak Follback.',

      errNotZip: 'Harap pilih file berekstensi .zip dari hasil ekspor resmi Instagram.',
      errNoFilesInZip: 'File followers atau following tidak ditemukan di dalam ZIP. Pastikan opsi "Pengikut dan mengikuti" dicentang saat ekspor.',
      errNoFollowing: 'File following tidak ditemukan atau kosong.',
      errNoValidUsers: 'Tidak ada username valid yang ditemukan dari data yang diunggah.',
      errManualEmpty: 'Masukkan minimal 1 username pada kolom Daftar Following.',
      sourceDemo: 'Data Contoh',
      sourceManual: 'Input Manual',
      sourceFiles: 'File JSON/HTML',
      sourceZip: 'ZIP ({n} file)'
    },

    en: {
      pageTitle: 'CekIG — Instagram Followers & Unfollowers Audit',
      navAudit: 'Audit',
      navHow: 'How It Works',
      navFaq: 'FAQ',
      privacyPill: '100% Local',
      privacyTooltip: 'All files are processed directly in your browser and never sent to any server',
      btnGuide: 'Guide',
      themeTitle: 'Toggle light/dark theme',

      heroEyebrow: 'No Login · No Password · Zero Ban Risk',
      heroTitle: 'Audit Instagram Unfollowers & Pending Follow Requests',
      heroSubtitle:
        'Upload your official Instagram data export (<code>.zip</code>, <code>.json</code>, or <code>.html</code>). Instantly find who doesn\'t follow back, pending follow requests, and recent unfollows—100% privately in your browser.',
      btnDemo: 'Try Sample Data',

      tabZip: 'Upload Instagram ZIP',
      badgeRec: 'Recommended',
      tabFiles: 'Separate Files (JSON / HTML)',
      tabManual: 'Manual Paste',

      dropzoneTitle: 'Drag &amp; drop your <strong>Instagram export ZIP</strong> here, or <span class="link-accent">browse device</span>',
      dropzoneHint:
        'Automatically detects <code>followers</code>, <code>following</code>, <code>pending_follow_requests</code>, and <code>recently_unfollowed</code> (excludes Threads data).',

      labelFollowersFile: '1. Followers File (Required)',
      labelFollowingFile: '2. Following File (Required)',
      labelExtraFile: '3. Extra Files — Optional (Pending Requests & Recently Unfollowed)',
      statusNone: 'Not selected',
      statusOptional: 'Optional',
      statusFilesSelected: '{n} file(s) selected',
      descFollowersFile: 'Select <code>followers_1.json</code> (multi-select supported) or <code>.html</code>.',
      descFollowingFile: 'Select <code>following.json</code> or <code>following.html</code> from <code>followers_and_following</code>.',
      descExtraFile: 'Optionally add <code>pending_follow_requests.json</code>, <code>recent_follow_requests.json</code>, or <code>recently_unfollowed_profiles.json</code>.',
      btnPickFollowers: 'Select Followers File',
      btnPickFollowing: 'Select Following File',
      btnPickExtra: 'Select Extra Files',
      btnAnalyze: 'Analyze Data Now',

      manualFollowersLabel: 'Followers List (1 username per line)',
      manualFollowingLabel: 'Following List (1 username per line)',
      btnCompare: 'Compare Lists',

      mismatchTitle: 'Instagram Export Date-Range Mismatch Detected',
      mismatchBody:
        'Your <strong>Followers</strong> file only starts from <strong>{fStart}</strong>, while <strong>Following</strong> starts from <strong>{gStart}</strong> ({olderCount} accounts followed before {fStart}). Older mutuals may falsely appear as Not Following Back.',
      mismatchToggle: 'Auto-match date period (only compare Following within Followers date range)',
      mismatchGuideBtn: 'How to Export "All Time"',

      statFollowers: 'Followers',
      statFollowing: 'Following',
      statNotBack: 'Not Following Back',
      statMutuals: 'Mutuals',
      statRatio: 'Ratio {r}',
      statSince: 'Since {d}',
      statFilteredSince: 'Filtered ≥ {d}',
      statLocalData: 'Local data',
      statPeriodMatched: 'Period Matched',
      statProgress: '{done} / {total} done',
      statFansMeta: '{n} fans you don\'t follow',

      catNotBack: 'Not Following Back',
      catMutuals: 'Mutuals',
      catFans: 'Fans',
      catPending: 'Pending Requests',
      catUnfollowed: 'Recently Unfollowed',
      catWhitelist: 'Whitelist',

      btnCopy: 'Copy',
      btnReset: 'Reset',
      bulkSelectPage: 'Select This Page',
      bulkHint: 'Click <strong>Bulk Open</strong> to open multiple profiles at once',
      btnBulkOpen: 'Bulk Open',
      btnBulkDone: '✓ Mark Page Done',

      searchPlaceholder: 'Search username... (press /)',
      filterAll: 'All Statuses',
      filterPending: 'Not Unfollowed Yet',
      filterDone: 'Marked Unfollowed',
      sortDateDesc: 'Newest first',
      sortDateAsc: 'Oldest first',
      sortAlphaAsc: 'Username A–Z',
      sortAlphaDesc: 'Username Z–A',

      thStatus: 'Status',
      thAccount: 'Instagram Account',
      thDate: 'Date',
      thActions: 'Actions',
      statusDone: 'Done',
      statusPending: 'Pending',
      badgeDeleted: 'Deleted Account',
      btnExclude: 'Whitelist',
      btnRemoveWhitelist: 'Remove',
      btnOpenIg: 'Open IG',
      mobileDatePrefix: 'Date: {d}',

      paginationInfo: 'Showing {start}–{end} of {total} accounts',
      btnPrev: 'Previous',
      btnNext: 'Next',
      filesReadLabel: 'Files parsed:',

      emptySearchTitle: 'No matching username',
      emptySearchDesc: 'No results found for "{q}".',
      emptyNotBackTitle: 'Everyone follows you back!',
      emptyNotBackDesc: 'No accounts in the Not Following Back list right now.',
      emptyWhitelistTitle: 'Whitelist is empty',
      emptyWhitelistDesc: 'Click "Whitelist" on any account in Not Following Back to keep it here.',
      emptyPendingTitle: 'No Pending Requests found',
      emptyPendingDesc: 'No pending_follow_requests / recent_follow_requests file in archive or all requests were accepted.',
      emptyUnfollowedTitle: 'No Recently Unfollowed history',
      emptyUnfollowedDesc: 'No recently_unfollowed_profiles file found in archive or list is empty.',
      emptyDefaultTitle: 'Empty list',
      emptyDefaultDesc: 'No accounts in this category.',

      howTitle: 'How It Works in 3 Safe Steps',
      howSubtitle: 'Zero third-party logins—powered solely by your official Meta Accounts Center export.',
      step1Title: 'Request Your Instagram ZIP',
      step1Desc: 'Go to <em>Accounts Center &rarr; Download your information</em>, select <strong>Followers and following</strong>, and set Date Range to <strong>All time</strong>.',
      step2Title: 'Upload Directly to CekIG',
      step2Desc: 'Drop the .zip file directly without extracting. Everything is parsed instantaneously inside your browser memory.',
      step3Title: 'Audit & Manage Unfollows',
      step3Desc: 'Spot unfollowers, check who hasn\'t accepted your pending follow requests, bulk-open profiles, or export to CSV.',

      faqTitle: 'Frequently Asked Questions',
      faqSubtitle: 'Quick answers about safety, accuracy, and Instagram export limits.',
      faq1Q: 'Is CekIG safe from Instagram bans or shadowbans?',
      faq1A: '100% safe. CekIG never asks for your password, session cookies, or Instagram login. Everything runs locally on your device using Instagram\'s official data export.',
      faq2Q: 'Why do some people who follow me back still show up as Not Following Back?',
      faq2A: 'Instagram defaults its data export date range to "Last year". Make sure to change Date Range to "All time" when requesting your ZIP, or enable the "Auto-match date period" toggle in the warning banner.',
      faq3Q: 'What are Pending Requests and Recently Unfollowed?',
      faq3A: 'Pending Requests lists private accounts that haven\'t accepted your follow request yet (from pending_follow_requests.json / recent_follow_requests.json). Recently Unfollowed shows accounts you recently unfollowed (from recently_unfollowed_profiles.json).',
      faq4Q: 'Can I audit multiple Instagram accounts and is it free?',
      faq4A: 'Yes, completely free with unlimited ZIP uploads across as many Instagram accounts as you want.',
      faq5Q: 'Does Instagram notify someone when I unfollow them?',
      faq5A: 'No. Instagram does not send notifications when you unfollow an account.',

      footerPrivacy: '100% client-side in your browser. No servers, no tracking.',
      footerCredit: 'Built by',

      guideTitle: 'How to Download 100% Accurate Instagram Data',
      guideWarning:
        '<strong>Important for accuracy:</strong> Instagram defaults to <em>"Last year"</em>. Always change Date Range to <strong>All time</strong> so older followers are included.',
      guideS1T: 'Open Accounts Center',
      guideS1D: 'In the Instagram app: <em>Profile &rarr; Menu (☰) &rarr; Accounts Center &rarr; Your information and permissions &rarr; Download your information</em>.',
      guideS2T: 'Select Account & Some Information',
      guideS2D: 'Tap <em>Download or transfer information</em>, select your Instagram account, then choose <strong>Some of your information</strong>.',
      guideS3T: 'Check Followers and Following',
      guideS3D: 'Scroll to <em>Connections</em>, check only <strong>Followers and following</strong>, then tap Next.',
      guideS4T: 'Set Date Range to "All Time"',
      guideS4D: 'Choose <em>Download to device</em>. Tap <strong>Date range</strong> &rarr; <strong>All time</strong>. Select <strong>JSON</strong> format.',
      guideS5T: 'Download & Upload ZIP Directly',
      guideS5D: 'Wait 2–5 minutes until ready, download the <code>.zip</code>, and drop it straight into CekIG.',
      guideClose: 'Got It',

      toastReadingZip: 'Reading ZIP archive...',
      toastDone: 'Analysis complete: {n} accounts not following back.',
      toastPeriodOn: 'Period filter ON: comparing Following within Followers date range.',
      toastPeriodOff: 'Showing all Following records.',
      toastCopied: 'Copied {n} usernames to clipboard.',
      toastCopyFail: 'Clipboard copy failed. Use CSV export instead.',
      toastNoData: 'No data to export.',
      toastCsvDone: 'CSV file downloaded.',
      toastReset: 'Session data cleared.',
      toastPageMarked: 'All accounts on this page marked as done.',
      toastPageUnmarked: 'Unmarked accounts on this page.',
      toastBulkMarked: 'Marked {n} accounts on this page as done.',
      toastNoPending: 'All active accounts in this filter are already marked done.',
      toastOpenedTabs: 'Opened {n} Instagram profiles in new tabs.',
      toastPopupBlocked: 'Opened {opened} tabs (allow pop-ups to open {total} tabs at once).',
      toastWhitelistAdd: '@{u} added to Whitelist.',
      toastWhitelistRemove: '@{u} moved back to Not Following Back.',

      errNotZip: 'Please select a valid .zip file from your official Instagram data export.',
      errNoFilesInZip: 'No followers or following files found in ZIP. Make sure "Followers and following" was selected during export.',
      errNoFollowing: 'Following file is missing or empty.',
      errNoValidUsers: 'No valid usernames were found in the uploaded data.',
      errManualEmpty: 'Please enter at least 1 username in the Following list.',
      sourceDemo: 'Sample Data',
      sourceManual: 'Manual Input',
      sourceFiles: 'JSON / HTML Files',
      sourceZip: 'ZIP ({n} files)'
    }
  };

  function detectInitialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'id' || saved === 'en') return saved;
    } catch (_) {}

    // 1. Check timezone (Indonesia: WIB, WITA, WIT)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (/^Asia\/(Jakarta|Makassar|Jayapura|Pontianak|Ujung_Pandang)$/i.test(tz)) {
        return 'id';
      }
    } catch (_) {}

    // 2. Check browser languages
    const langs = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    for (const l of langs) {
      const norm = String(l).toLowerCase();
      if (norm === 'id' || norm.startsWith('id-') || norm.endsWith('-id')) {
        return 'id';
      }
    }

    return 'en';
  }

  let currentLang = detectInitialLang();

  function t(key, vars) {
    const table = DICT[currentLang] || DICT.en;
    let str = table[key] !== undefined ? table[key] : (DICT.en[key] || key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  }

  function applyDomTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t('pageTitle');

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (key) node.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-html]').forEach((node) => {
      const key = node.getAttribute('data-i18n-html');
      if (key) node.innerHTML = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key) node.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      const key = node.getAttribute('data-i18n-title');
      if (key) node.setAttribute('title', t(key));
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  }

  function setLang(lang) {
    if (lang !== 'id' && lang !== 'en') return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (_) {}
    applyDomTranslations();
  }

  function getLang() {
    return currentLang;
  }

  function getLocale() {
    return currentLang === 'id' ? 'id-ID' : 'en-US';
  }

  global.I18n = {
    t,
    setLang,
    getLang,
    getLocale,
    applyDomTranslations
  };
})(window);
