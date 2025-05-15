document.addEventListener('DOMContentLoaded', function() {
  const form      = document.getElementById('filterForm');
  const tableBody = document.querySelector('#logsTable tbody');
  const prevBtn   = document.getElementById('prevPageBtn');
  const nextBtn   = document.getElementById('nextPageBtn');

  const mdlTs    = document.getElementById('mdlTimestamp');
  const mdlUser  = document.getElementById('mdlUser');
  const mdlEndp  = document.getElementById('mdlEndpoint');
  const mdlMsg   = document.getElementById('mdlMessage');
  const mdlStack = document.getElementById('mdlStack');
  const bsModal  = new bootstrap.Modal(document.getElementById('detailModal'));

  let currentPage = 0, pageSize = 10, totalPages = 0;

  form.addEventListener('submit', e => {
    e.preventDefault();
    currentPage = 0;
    fetchLogs();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage>0) { currentPage--; fetchLogs(); }
  });
  nextBtn.addEventListener('click', () => {
    if (currentPage<totalPages-1) { currentPage++; fetchLogs(); }
  });

  function fetchLogs() {
    const payload = {
      user: document.getElementById('userFilter').value.trim() || null,
      endpoint: document.getElementById('endpointFilter').value.trim() || null,
      startDate: document.getElementById('startDate').value || null,
      endDate:   document.getElementById('endDate').value   || null,
      page: currentPage, size: pageSize,
      sortBy: document.getElementById('sortBy').value,
      order:  document.getElementById('order').value
    };

    fetch(`${BASE_URL}/api/logError/filter`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(data => {
      totalPages = data.totalPages;
      renderTable(data.content);
      prevBtn.disabled = currentPage<=0;
      nextBtn.disabled = currentPage>=totalPages-1;
    })
    .catch(err => {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Errore: ${err.message}</td></tr>`;
    });
  }

  function renderTable(logs) {
    if (!logs.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun log trovato</td></tr>';
      return;
    }
    tableBody.innerHTML = logs.map(l => `
      <tr>
        <td>${new Date(l.timestamp).toLocaleString()}</td>
        <td>${l.user || '-'}</td>
        <td>${l.endpoint}</td>
        <td class="text-truncate" style="max-width:200px;">${l.errorMessage}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-id="${l.id}">
            <i class="bi bi-eye-fill"></i>
          </button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('#logsTable button[data-id]')
      .forEach(btn => btn.addEventListener('click', () => showDetail(btn.dataset.id)));
  }

  function showDetail(id) {
    fetch(`${BASE_URL}/api/logError/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(log => {
      mdlTs.textContent    = new Date(log.timestamp).toLocaleString();
      mdlUser.textContent  = log.user || '-';
      mdlEndp.textContent  = log.endpoint;
      mdlMsg.textContent   = log.errorMessage;
      mdlStack.textContent = log.stackTrace;
      bsModal.show();
    })
    .catch(err => alert('Impossibile caricare il dettaglio: ' + err.message));
  }

  // inizializza
  fetchLogs();
});
