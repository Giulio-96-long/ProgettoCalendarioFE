document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const dateStr = params.get('date');
  const detailDateEl = document.getElementById('detailDate');
  const notesList = document.getElementById('notesList');
  const noteForm = document.getElementById('noteForm');
  const formResponse = document.getElementById('formResponse');
  const noteModalEl = document.getElementById('noteModal');
  const noteModal = new bootstrap.Modal(noteModalEl);

  // Imposta data preliminare
  if (dateStr) {
    const d = new Date(dateStr);
    detailDateEl.textContent = d.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // Se manca l'id disabilita tutto
  if (!id) {
    notesList.innerHTML = '<p class="text-center">Nessuna nota da mostrare.</p>';
    return;
  }

  const newNoteBtn = document.getElementById('newNoteBtn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => {
      if (id) {
        window.location.href =
          `../new-note/new-note.html?dateNoteId=${id}&date=${encodeURIComponent(dateStr)}`;
      } else if (dateStr) {
        window.location.href =
          `../new-note/new-note.html?date=${encodeURIComponent(dateStr)}`;
      } else {
        alert('Manca l\'id o la data per creare la nota!');
      }
    });
  }

  // Carica e renderizza le note
  fetch(`${BASE_URL}/api/dateNote/getById/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => {
      if (!r.ok) {
        window.location.href = '../error/error.html';
        throw new Error('Redirect');
      }
      return r.json();
    })
    .then(dto => {
      // Imposta data definitiva
      const d = new Date(dto.eventDate);
      detailDateEl.textContent = d.toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      // Se non ci sono note
      if (!dto.notes.length) {
        notesList.innerHTML = '<p class="text-center">Nessuna nota per questa data.</p>';
        return;
      }

      // Genera le card
      notesList.innerHTML = dto.notes.map(n => {

        const toList   = Array.isArray(n.sharedTo) ? n.sharedTo : [];
        const byList   = Array.isArray(n.sharedBy) ? n.sharedBy : []; 

        const users    = n.owner ? toList : byList;     
        const label    = n.owner ? 'Condivisa a:' : 'Condivisa da:';

        const emails = [...new Set(users.map(u => u.email))];
        const listText = emails.join(', ');              

        const sharedInfo = `
          <p class="mb-2 fs-6 ${emails.length ? '' : 'invisible'}">
            <strong>${label}</strong> ${listText}
          </p>`;
         

        // Bottoni per il proprietario
        const ownerBtns = `
          <button class="btn btn-outline-primary btn-sm view-btn" data-id="${n.id}">🔍</button>
          <button class="btn btn-outline-secondary btn-sm archive-btn" data-id="${n.id}">📦</button>
          <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${n.id}">🗑️</button>
        `;

        // Bottoni per il destinatario condiviso
        const sharedBtns = `
          <button class="btn btn-outline-primary btn-sm view-btn" data-id="${n.id}">🔍</button>
          <button class="btn btn-outline-warning btn-sm remove-for-me-btn" data-id="${n.id}">✂️ Rimuovi per me</button> 
        `;

        // Scegli quali bottoni mostrare in base al flag isOwner
        const actionBtns = n.owner ? ownerBtns : sharedBtns;

        return `
        <div class="col-sm-6 col-lg-3" id="note-card-${n.id}">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h3 class="mb-1">Titolo</h3>
              <h5 class="card-title mb-3">${n.title || '(senza titolo)'}</h5>          
              <hr class="my-2"/>
              <h3 class="mb-1 mt-3">Descrizione</h3>
              <p class="card-text mb-3">${n.description || '(vuota)'}</p>           
              ${sharedInfo}
              <h5 class="text-muted mb-2 p-1">
                Importante: ${n.important ? 'Sì' : 'No'}
              </h5>
              <div class="btn-group mt-auto" role="group">
                ${actionBtns}
              </div>
            </div>
          </div>
        </div>
      `;
      }).join('');

      // Azioni sui bottoni
      document.querySelectorAll('.view-btn').forEach(b =>
        b.addEventListener('click', () => {
          window.location.href = `../view-note/view-note.html?id=${b.dataset.id}`;
        })
      );

      document.querySelectorAll('.archive-btn').forEach(b =>
        b.addEventListener('click', async () => {
          if (!confirm('Archiviare questa nota?')) return;
          try {
            const r = await fetch(`${BASE_URL}/api/note/archived`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(+b.dataset.id)
            });
            if (!r.ok) throw new Error(r.statusText);
            b.closest('.col-sm-6').remove();
          } catch {
            window.location.href = '../error/error.html';
          }
        })
      );

      document.querySelectorAll('.delete-btn').forEach(b =>
        b.addEventListener('click', async () => {
          if (!confirm('Eliminare questa nota?')) return;
          try {
            const r = await fetch(`${BASE_URL}/api/note/delete/${b.dataset.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!r.ok) throw new Error(r.statusText);
            b.closest('.col-sm-6').remove();
          } catch {
            window.location.href = '../error/error.html';
          }
        })
      );
    })
    .catch(e => {
      notesList.innerHTML = `<p class="text-danger text-center">Errore: ${e.message}</p>`;
    });

  // handler per “Rimuovi per me”
  notesList.addEventListener('click', async e => {
    const btn = e.target.closest('.remove-for-me-btn');
    if (!btn) return;

    if (!confirm('Annullare la condivisione per te?')) return;
    const noteId = btn.dataset.id;

    try {
      const res = await fetch(
        `${BASE_URL}/api/share/${noteId}/removeForMe`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(res.statusText);
      document.getElementById(`note-card-${noteId}`)?.remove();
    } catch (err) {
      alert('Errore: ' + err.message);
    }
  });

  // Gestione form “Nuova Nota”
  noteForm.addEventListener('submit', async e => {
    e.preventDefault();
    formResponse.textContent = 'Salvataggio in corso…';

    const payload = {
      dateNoteId: +id,
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      important: document.getElementById('isImportant').checked
    };

    try {
      const r = await fetch(`${BASE_URL}/api/note/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(r.statusText);
      formResponse.textContent = 'Nota salvata!';
      setTimeout(() => {
        noteModal.hide();
        location.reload();
      }, 800);
    } catch (err) {
      formResponse.textContent = `Errore: ${err.message}`;
    }
  });
});
