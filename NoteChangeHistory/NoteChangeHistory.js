let currentPage = 0;
let totalPages  = 0;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filterForm')
    .addEventListener('submit', e => {
      e.preventDefault();
      currentPage = 0;
      fetchData();
    });

  document.getElementById('prevBtn')
    .addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        fetchData();
      }
    });

  document.getElementById('nextBtn')
    .addEventListener('click', () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        fetchData();
      }
    });

  fetchData();
});

function fetchData() {
  const payload = {
    changeType: document.getElementById('changeType').value.trim() || null,
    modifiedBy: document.getElementById('modifiedBy').value.trim() || null,
    startDate:  buildDateTime('startDate', 'T00:00:00'),
    endDate:    buildDateTime('endDate',   'T23:59:59'),
    page: currentPage,
    size: parseInt(document.getElementById('pageSize').value, 10) || 10,
    sortBy: document.getElementById('sortBy').value,
    order:  document.getElementById('order').value
  };

  fetch(`${BASE_URL}/api/noteChangeHistory/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) {
      window.location.href = '../error/error.html';
      throw new Error('Redirect to error page');
    }
    return res.json();
  })
  .then(data => {
    totalPages = data.totalPages;
    updateTable(data.content);
    updatePagination();
  })
  .catch(err => console.error('Errore nel fetch:', err));
}

function buildDateTime(id, suffix) {
  const val = document.getElementById(id).value;
  return val ? `${val}${suffix}` : null;
}

function updateTable(rows) {
  const tbody = document.querySelector('#resultsTable tbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nessun risultato</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.changeType || '--'}</td>
      <td>${r.note       || '--'}</td>
      <td>${r.modifiedBy || '--'}</td>
      <td>${new Date(r.modificationDate).toLocaleString()}</td>
    </tr>
  `).join('');
}

function updatePagination() {
  document.getElementById('pageInfo').textContent =
    `Pagina ${currentPage+1} di ${totalPages}`;
  document.getElementById('prevBtn').disabled = currentPage<=0;
  document.getElementById('nextBtn').disabled = currentPage>=totalPages-1;
}
