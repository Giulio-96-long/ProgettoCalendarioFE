document.addEventListener('DOMContentLoaded', function() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect  = document.getElementById('yearSelect');
  const searchBtn   = document.getElementById('searchButton');
  const tableBody   = document.getElementById('tableBody');
  const resetBtn    = document.getElementById('resetButton'); 

  // Popola anni (ultimi 5 + prossimo)
  const now         = new Date();
  const currentYear = now.getFullYear();
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    yearSelect.add(new Option(y, y));
  }
  yearSelect.value = currentYear;

  // Bind filtro
  searchBtn.addEventListener('click', function(e) {
    e.preventDefault();
    fetchAndRender();
  });

  // Primo caricamento
  fetchAndRender();

  function fetchAndRender() {
    const month = +monthSelect.value;
    const year  = +yearSelect.value;

    // Spinner
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
        </td>
      </tr>`;

    fetch(`${BASE_URL}/api/note/getArchived?month=${month}&year=${year}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(res) {
      if (!res.ok) {
        window.location.href = '../error/error.html';
        throw new Error('Redirect to error page');
      }
      return res.json();
    })
    .then(renderTable)
    .catch(function(err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="text-danger text-center">
            Errore: ${err.message}
          </td>
        </tr>`;
    });
  }


 function renderTable(groups) {
  var rows = [];
  groups.forEach(function(g) {
    var date = new Date(g.eventDate)
      .toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
    g.notes.forEach(function(n) {
      rows.push({
        date:   date,
        idNota: n.idNota,
        title:  n.title || '(senza titolo)'
      });
    });
  });

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">Nessuna nota archiviata.</td>
      </tr>`;
    return;
  }

  // genero la tabella, con data-idnota
  tableBody.innerHTML = rows.map(function(r) {
    return `
      <tr>
        <td>${r.date}</td>
        <td>${r.title}</td>
        <td>
          <button class="btn btn-sm btn-outline-success btn-unarchive"
                  data-idnota="${r.idNota}">
            Ripristina
          </button>
        </td>
      </tr>`;
  }).join('');

  document.querySelectorAll('.btn-unarchive').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (!confirm('Rimuovere l\'archiviazione di questa nota?')) return;    
      var noteId = +this.dataset.idnota;
      fetch(`${BASE_URL}/api/note/archived`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteId)
      })
      .then(function(res) {
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);    
        btn.closest('tr').remove();
      })
      .catch(function(err) {
        console.error('Errore ripristino:', err);
        alert('Impossibile ripristinare la nota: ' + err.message);
      });
    });
  });

   resetBtn.addEventListener('click', function() { 
    monthSelect.value = '0';           
    yearSelect.value  = currentYear;  
    fetchAndRender();                
  });
}

});
