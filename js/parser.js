/**
 * Precision parser for Instagram official exports (JSON 2022-2026, HTML, Manual).
 * Supports:
 * - followers_*.json/html
 * - following.json/html (title + /_u/ href or string_list_data.value)
 * - pending_follow_requests.json/html & recent_follow_requests.json/html (incl. label_values)
 * - recently_unfollowed_profiles.json/html (incl. label_values)
 * Strictly excludes Threads and Facebook folders inside Meta ZIP archives.
 */
(function (global) {
  'use strict';

  function normalizeUsername(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let str = raw.trim();

    if (str.includes('instagram.com/')) {
      try {
        const url = new URL(str.startsWith('http') ? str : 'https://' + str);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === '_u') {
          str = parts[1];
        } else if (parts.length >= 1) {
          str = parts[0];
        }
      } catch (_) {
        const match = str.match(/instagram\.com\/(?:_u\/)?([A-Za-z0-9._]+)/i);
        if (match) str = match[1];
      }
    }

    str = str.replace(/^@+/, '').replace(/\/+$/, '').trim().toLowerCase();

    if (!/^[a-z0-9._]{1,64}$/.test(str)) {
      return '';
    }

    const reserved = new Set([
      'explore', 'accounts', 'direct', 'reels', 'stories', 'p', 'tv', 'about', 'legal', 'privacy'
    ]);
    if (reserved.has(str)) return '';

    return str;
  }

  function isDeletedAccount(username) {
    return username.startsWith('__deleted__');
  }

  function parseInstagramJSON(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error('Invalid JSON format.');
    }

    const map = new Map();

    function addEntry(username, href, timestamp, displayName) {
      const clean = normalizeUsername(username || href);
      if (!clean) return;
      const ts = typeof timestamp === 'number' && timestamp > 0 ? timestamp : null;
      const existing = map.get(clean);
      if (!existing || (ts && (!existing.timestamp || ts > existing.timestamp))) {
        map.set(clean, {
          username: clean,
          displayName: displayName || (existing ? existing.displayName : ''),
          href: `https://www.instagram.com/${clean}/`,
          timestamp: ts,
          isDeleted: isDeletedAccount(clean)
        });
      }
    }

    function walk(node) {
      if (!node || typeof node !== 'object') return;

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          walk(node[i]);
        }
        return;
      }

      // Format A: Instagram string_list_data (followers, following, classic pending)
      if (Array.isArray(node.string_list_data)) {
        const titleCandidate = typeof node.title === 'string' ? node.title.trim() : '';
        for (const item of node.string_list_data) {
          if (!item || typeof item !== 'object') continue;
          const val = item.value || titleCandidate || item.href || '';
          addEntry(val, item.href, item.timestamp, '');
        }
        return;
      }

      // Format B: Newer Meta label_values schema (recent_follow_requests, recently_unfollowed_profiles)
      if (Array.isArray(node.label_values)) {
        let usernameVal = '';
        let nameVal = '';
        for (const lv of node.label_values) {
          if (!lv || typeof lv !== 'object') continue;
          const lbl = String(lv.label || '').toLowerCase().trim();
          const val = typeof lv.value === 'string' ? lv.value.trim() : '';
          if (lbl === 'username' || lbl === 'nama pengguna' || lbl === 'handle') {
            usernameVal = val;
          } else if (lbl === 'name' || lbl === 'nama') {
            nameVal = val;
          }
        }
        if (usernameVal) {
          addEntry(usernameVal, '', node.timestamp, nameVal);
        }
        return;
      }

      // Format C: Flat object { username: "...", timestamp: ... }
      if (typeof node.username === 'string') {
        addEntry(node.username, node.href, node.timestamp, node.name || '');
        return;
      }

      // Recurse into wrapper keys
      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);
    return Array.from(map.values());
  }

  function parseInstagramHTML(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = doc.querySelectorAll('a[href*="instagram.com/"]');
    const map = new Map();

    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const textVal = (a.textContent || '').trim();
      const clean = normalizeUsername(textVal) || normalizeUsername(href);
      if (!clean) continue;

      let timestamp = null;
      const parent = a.closest('div');
      if (parent && parent.parentElement) {
        const siblingText = parent.parentElement.textContent || '';
        const dateMatch = siblingText.match(
          /([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}(?:,?\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))?)/
        );
        if (dateMatch) {
          const parsed = Date.parse(dateMatch[1]);
          if (!Number.isNaN(parsed)) {
            timestamp = Math.floor(parsed / 1000);
          }
        }
      }

      if (!map.has(clean)) {
        map.set(clean, {
          username: clean,
          displayName: '',
          href: `https://www.instagram.com/${clean}/`,
          timestamp,
          isDeleted: isDeletedAccount(clean)
        });
      }
    }

    return Array.from(map.values());
  }

  function parseManualText(text) {
    const lines = (text || '').split(/[\r\n,;]+/);
    const map = new Map();
    for (const line of lines) {
      const clean = normalizeUsername(line);
      if (clean && !map.has(clean)) {
        map.set(clean, {
          username: clean,
          displayName: '',
          href: `https://www.instagram.com/${clean}/`,
          timestamp: null,
          isDeleted: isDeletedAccount(clean)
        });
      }
    }
    return Array.from(map.values());
  }

  function parseExportFile(filename, content) {
    const lower = (filename || '').toLowerCase();
    const trimmed = (content || '').trim();

    if (lower.endsWith('.html') || lower.endsWith('.htm') || trimmed.startsWith('<')) {
      return parseInstagramHTML(content);
    }
    return parseInstagramJSON(content);
  }

  function mergeAccountLists(lists) {
    const map = new Map();
    for (const list of lists) {
      for (const acc of list) {
        const existing = map.get(acc.username);
        if (!existing || (acc.timestamp && (!existing.timestamp || acc.timestamp > existing.timestamp))) {
          map.set(acc.username, acc);
        }
      }
    }
    return Array.from(map.values());
  }

  /**
   * Classifies Instagram export files into:
   * 'followers' | 'following' | 'pending' | 'unfollowedHistory' | null
   */
  function classifyFileName(path) {
    const normalized = path.replace(/\\/g, '/').toLowerCase();

    if (
      normalized.startsWith('__macosx/') ||
      normalized.includes('/threads/') ||
      normalized.startsWith('threads/') ||
      normalized.includes('threads_and_replies') ||
      normalized.includes('/facebook/')
    ) {
      return null;
    }

    const base = normalized.split('/').pop() || '';
    if (!base.endsWith('.json') && !base.endsWith('.html') && !base.endsWith('.htm')) {
      return null;
    }

    if (/^followers(_\d+)?\.(json|html?)$/.test(base)) {
      return 'followers';
    }
    if (/^following(_\d+)?\.(json|html?)$/.test(base)) {
      return 'following';
    }
    if (/^(pending_follow_requests|recent_follow_requests)(_\d+)?\.(json|html?)$/.test(base)) {
      return 'pending';
    }
    if (/^recently_unfollowed_(profiles|accounts)(_\d+)?\.(json|html?)$/.test(base)) {
      return 'unfollowedHistory';
    }
    return null;
  }

  function filterPreferredZipEntries(entries) {
    const inOfficialFolder = entries.filter((e) =>
      e.name.replace(/\\/g, '/').toLowerCase().includes('followers_and_following/')
    );
    return inOfficialFolder.length > 0 ? inOfficialFolder : entries;
  }

  global.IGParser = {
    normalizeUsername,
    parseInstagramJSON,
    parseInstagramHTML,
    parseManualText,
    parseExportFile,
    mergeAccountLists,
    classifyZipEntry: classifyFileName,
    classifyFileName,
    filterPreferredZipEntries
  };
})(window);
