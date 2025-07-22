document.addEventListener('DOMContentLoaded', () => {
  const section   = document.getElementById('admin-section');
  const tableBody = document.querySelector('#admin-table tbody');
  const modalEl   = document.getElementById('adminModal');
  const modal     = new bootstrap.Modal(modalEl);
  const modalBody = document.getElementById('admin-modal-body');

  section.style.display = 'block';

  loadAdminUnreadCount();
  loadAdminReplyCount();
  loadAdminList();

  function updateBadge(id, count) {
    const b = document.getElementById(id);
    if (!b) return;
    b.textContent   = count > 0 ? count : '';
    b.style.display = count > 0 ? 'inline-block' : 'none';
  }

  function loadAdminUnreadCount() {
    fetch(`${BASE_URL}/api/feedback/admin/unread/count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(c => updateBadge('admin-unread-count', c))
    .catch(err => console.error(err));
  }

  function loadAdminReplyCount() {
    fetch(`${BASE_URL}/api/feedback/admin/reply/count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(c => updateBadge('admin-reply-count', c))
    .catch(err => console.error(err));
  }

  async function loadAdminList() {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento…</span>
      </div>
    </td></tr>`;

    try {
      const res  = await fetch(`${BASE_URL}/api/feedback/admin/all-with-replies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Nessun messaggio</td></tr>`;
        return;
      }

      tableBody.innerHTML = data.map(f => `
        <tr>
          <td>${f.id}</td>
          <td>${f.subject}</td>
          <td>${f.senderName || '—'}</td>
          <td>${new Date(f.createdAt).toLocaleString()}</td>
          <td>${f.read ? 'Letta' : 'Nuovo'}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary btn-admin-detail"
                    data-id="${f.id}">
              ${f.reply ? 'Vedi' : 'Rispondi'}
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-admin-detail')
        .forEach(btn => btn.addEventListener('click', () => viewAdminDetail(btn.dataset.id)));

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">
        Errore nel caricamento
      </td></tr>`;
      console.error(err);
    }
  }

  function viewAdminDetail(id) {
    modalBody.innerHTML = `<div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento…</span>
      </div>
    </div>`;
    modal.show();

    fetch(`${BASE_URL}/api/feedback/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(f => {
      let html = `
        <h5>#${f.id} – ${f.subject}</h5>
        <p><strong>Da:</strong> ${f.senderName || '—'}</p>
        <p><em>Il ${new Date(f.createdAt).toLocaleString()}</em></p>
        <hr>
        <p>${f.body}</p>`;

      if (f.reply) {
        html += `
          <hr>
          <h6>Risposta già inviata</h6>
          <p>${f.reply.body}</p>
          <small class="text-muted">
            Risposto il ${new Date(f.reply.createdAt).toLocaleString()}
          </small>`;
      } else {
        html += `
          <hr>
          <h6>Rispondi</h6>
          <form id="admin-reply-form">
            <div class="mb-3">
              <textarea id="reply-body" class="form-control" rows="4"
                placeholder="Testo risposta" required></textarea>
            </div>
            <button type="submit" class="btn btn-success w-100">
              Invia risposta
            </button>
          </form>
          <div id="admin-response" class="mt-3"></div>`;
      }

      modalBody.innerHTML = html;

      const form = document.getElementById('admin-reply-form');
      if (form) form.addEventListener('submit', handleReply(id));
    })
    .catch(err => {
      modalBody.innerHTML = `<p class="text-danger">Errore: ${err.message}</p>`;
    });
  }

 function handleReply(id) {
  return function(e) {
    e.preventDefault();
    const body    = document.getElementById('reply-body').value.trim();
    const respDiv = document.getElementById('admin-response');
    respDiv.innerHTML = `<div class="text-center text-info">Invio risposta…</div>`;

    // Invia la risposta
    fetch(`${BASE_URL}/api/feedback/${id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ body })
    })
    .then(r => {
      if (!r.ok) throw new Error('Errore nell\'invio della risposta');
      return r.json(); 
    })
    .then(success => {
      if (!success) throw new Error('Risposta non registrata');
      respDiv.innerHTML = `<div class="text-success text-center">Risposta inviata!</div>`;

      // Mark as read
      return fetch(`${BASE_URL}/api/feedback/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    })
    .then(r => {
      if (!r.ok) throw new Error('Impossibile marcare come letto');
      // Ricarica badge e lista
      loadAdminUnreadCount();
      loadAdminReplyCount();
      loadAdminList();

      // dopo un attimo riapri il dettaglio con stato aggiornato
      setTimeout(() => viewAdminDetail(id), 1000);
    })
    .catch(err => {
      respDiv.innerHTML = `<div class="text-danger text-center">Errore: ${err.message}</div>`;
    });
  };
}
});

const modalElement = document.getElementById('adminModal');
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', () => {
      if (document.activeElement && modalElement.contains(document.activeElement)) {
        document.activeElement.blur();
      }
    });
  }
