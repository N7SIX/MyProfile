const workerUrlInput = document.getElementById('worker-url');
const siteIdInput = document.getElementById('site-id');
const adminTokenInput = document.getElementById('admin-token');
/**
 * Usage Dashboard Script
 * Author: Sean (N7SIX)
 * Description: Handles dashboard data fetching and rendering for usage monitoring.
 * License: MIT
 */
const adminTokenGroup = document.getElementById('admin-token-group');
const loadStatsButton = document.getElementById('load-stats');
const dashboardModeNode = document.getElementById('dashboard-mode');
const dashboardSyncNode = document.getElementById('dashboard-sync');
const kpiTotal = document.getElementById('kpi-total');
const kpiIps = document.getElementById('kpi-ips');
const eventRows = document.getElementById('event-rows');
const countryRows = document.getElementById('country-rows');
const recentRows = document.getElementById('recent-rows');
const statusNode = document.getElementById('status');

const STORAGE_KEY = 'uvtools-dashboard-config-v1';
const DEFAULT_MONITOR_CONFIG = {
  workerUrl: '',
  siteId: 'uvtools-multi-firmware-web-flasher',
  adminToken: '',
  autoLoad: true,
  autoRefreshMs: 60000,
  hideAdminTokenField: true,
};
const externalMonitorConfig =
  window.USAGE_MONITOR_CONFIG && typeof window.USAGE_MONITOR_CONFIG === 'object'
    ? window.USAGE_MONITOR_CONFIG
    : {};

let autoRefreshTimer = 0;
let isLoading = false;

const setStatus = (message, isError = false) => {
  statusNode.textContent = message;
  statusNode.classList.toggle('is-error', isError);
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const createRow = (values) => {
  const row = document.createElement('tr');

  values.forEach((value) => {
    const cell = document.createElement('td');
    cell.textContent = String(value ?? '');
    row.appendChild(cell);
  });

  return row;
};

const createEmptyRow = (message, columnCount) => {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = Math.max(columnCount, 1);
  cell.textContent = message;
  row.appendChild(cell);
  return row;
};

const renderTable = (target, rows, columnCount = 2) => {
  target.innerHTML = '';

  if (!rows.length) {
    target.appendChild(createEmptyRow('No data', columnCount));
    return;
  }

  rows.forEach((row) => target.appendChild(row));
};

const updateButtonLoadingState = (loading) => {
  isLoading = loading;
  loadStatsButton.disabled = loading;
  loadStatsButton.textContent = loading ? 'Loading...' : 'Load Stats';
};

const updateLastSync = () => {
  if (!dashboardSyncNode) {
    return;
  }

  dashboardSyncNode.textContent = `Last sync: ${new Date().toLocaleString()}`;
};

const loadSavedConfig = () => {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    workerUrlInput.value = parsed.workerUrl || '';
    siteIdInput.value = parsed.siteId || '';
    adminTokenInput.value = parsed.adminToken || '';
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

const loadQueryConfig = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    workerUrl: (params.get('worker') || '').trim(),
    siteId: (params.get('site') || '').trim(),
    adminToken: (params.get('token') || '').trim(),
    showTokenField: params.get('showTokenField') === '1',
  };
};

const resolveConfig = () => {
  const saved = (() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  })();

  const query = loadQueryConfig();

  return {
    ...DEFAULT_MONITOR_CONFIG,
    ...externalMonitorConfig,
    ...saved,
    ...Object.fromEntries(
      Object.entries(query).filter(([, value]) => Boolean(value))
    ),
  };
};

const saveConfig = (workerUrl, siteId, adminToken) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      workerUrl,
      siteId,
      adminToken,
    })
  );
};

const fetchStats = async () => {
  if (isLoading) {
    return;
  }

  const workerUrl = workerUrlInput.value.trim().replace(/\/$/, '');
  const siteId = siteIdInput.value.trim();
  const adminToken = adminTokenInput.value.trim();

  if (!workerUrl || !siteId || !adminToken) {
    setStatus('Enter Worker URL, Site ID, and Admin Token.', true);
    return;
  }

  saveConfig(workerUrl, siteId, adminToken);

  setStatus('Loading stats...');
  updateButtonLoadingState(true);

  const endpoint = `${workerUrl}/stats?site=${encodeURIComponent(siteId)}&token=${encodeURIComponent(adminToken)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorText = errorBody.error || `Request failed (${response.status}).`;
      throw new Error(errorText);
    }

    const data = await response.json();
    kpiTotal.textContent = formatNumber(data.totals?.total_events);
    kpiIps.textContent = formatNumber(data.totals?.unique_ips);

    renderTable(
      eventRows,
      (data.events || []).map((row) => createRow([row.event, formatNumber(row.count)])),
      2
    );

    renderTable(
      countryRows,
      (data.countries || []).map((row) => createRow([row.country, formatNumber(row.count)])),
      2
    );

    renderTable(
      recentRows,
      (data.recent || []).map((row) =>
        createRow([
          row.created_at ? new Date(row.created_at).toLocaleString() : '',
          row.event || '',
          row.country || '',
          row.ip_address || '',
          row.path || '',
        ])
      ),
      5
    );

    updateLastSync();
    setStatus('Stats loaded successfully.');
  } catch (error) {
    setStatus(`Failed to load stats: ${error.message}`, true);
  } finally {
    updateButtonLoadingState(false);
  }
};

const applyConfigToInputs = (config) => {
  workerUrlInput.value = config.workerUrl || '';
  siteIdInput.value = config.siteId || '';
  adminTokenInput.value = config.adminToken || '';
};

const applyAutoVisibility = (config) => {
  if (!adminTokenGroup) {
    return;
  }

  const shouldHide =
    Boolean(config.hideAdminTokenField) &&
    Boolean((config.adminToken || '').trim()) &&
    !Boolean(config.showTokenField);

  adminTokenGroup.classList.toggle('is-hidden', shouldHide);
};

const applyModeMeta = (config) => {
  if (!dashboardModeNode) {
    return;
  }

  const secureAutoMode =
    Boolean(config.autoLoad) &&
    Boolean((config.adminToken || '').trim()) &&
    Boolean(config.hideAdminTokenField) &&
    !Boolean(config.showTokenField);

  if (secureAutoMode) {
    dashboardModeNode.textContent = 'Mode: Secure Auto';
    dashboardModeNode.classList.add('is-secure');
    return;
  }

  if (Boolean(config.autoLoad)) {
    dashboardModeNode.textContent = 'Mode: Auto';
    dashboardModeNode.classList.remove('is-secure');
    return;
  }

  dashboardModeNode.textContent = 'Mode: Manual';
  dashboardModeNode.classList.remove('is-secure');
};

const maybeAutoLoad = (config) => {
  if (!config.autoLoad) {
    return;
  }

  if (!workerUrlInput.value.trim() || !siteIdInput.value.trim() || !adminTokenInput.value.trim()) {
    return;
  }

  fetchStats();
};

const setupAutoRefresh = (config) => {
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = 0;
  }

  const intervalMs = Number(config.autoRefreshMs || 0);

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return;
  }

  autoRefreshTimer = window.setInterval(fetchStats, intervalMs);
};

const resolvedConfig = resolveConfig();
applyConfigToInputs(resolvedConfig);
applyAutoVisibility(resolvedConfig);
applyModeMeta(resolvedConfig);
saveConfig(
  (resolvedConfig.workerUrl || '').trim().replace(/\/$/, ''),
  (resolvedConfig.siteId || '').trim(),
  (resolvedConfig.adminToken || '').trim()
);
setupAutoRefresh(resolvedConfig);
maybeAutoLoad(resolvedConfig);

loadStatsButton.addEventListener('click', fetchStats);
