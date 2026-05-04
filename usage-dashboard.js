const workerUrlInput = document.getElementById('worker-url');
const siteIdInput = document.getElementById('site-id');
const adminTokenInput = document.getElementById('admin-token');
const loadStatsButton = document.getElementById('load-stats');
const kpiTotal = document.getElementById('kpi-total');
const kpiIps = document.getElementById('kpi-ips');
const eventRows = document.getElementById('event-rows');
const countryRows = document.getElementById('country-rows');
const recentRows = document.getElementById('recent-rows');
const statusNode = document.getElementById('status');

const STORAGE_KEY = 'uvtools-dashboard-config-v1';

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

const renderTable = (target, rows) => {
  target.innerHTML = '';

  if (!rows.length) {
    target.appendChild(createRow(['No data', '']));
    return;
  }

  rows.forEach((row) => target.appendChild(row));
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
  const workerUrl = workerUrlInput.value.trim().replace(/\/$/, '');
  const siteId = siteIdInput.value.trim();
  const adminToken = adminTokenInput.value.trim();

  if (!workerUrl || !siteId || !adminToken) {
    setStatus('Enter Worker URL, Site ID, and Admin Token.', true);
    return;
  }

  saveConfig(workerUrl, siteId, adminToken);

  setStatus('Loading stats...');

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
      (data.events || []).map((row) => createRow([row.event, formatNumber(row.count)]))
    );

    renderTable(
      countryRows,
      (data.countries || []).map((row) => createRow([row.country, formatNumber(row.count)]))
    );

    renderTable(
      recentRows,
      (data.recent || []).map((row) =>
        createRow([
          row.created_at || '',
          row.event || '',
          row.country || '',
          row.ip_address || '',
          row.path || '',
        ])
      )
    );

    setStatus('Stats loaded successfully.');
  } catch (error) {
    setStatus(`Failed to load stats: ${error.message}`, true);
  }
};

loadSavedConfig();
loadStatsButton.addEventListener('click', fetchStats);
