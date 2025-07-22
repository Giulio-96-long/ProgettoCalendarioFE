document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('user-section');
  const tableBody = document.querySelector('#user-table tbody');
  const formCollapse = document.getElementById('user-form-container');
  const form = document.getElementById('user-form');
  const respDiv = document.getElementById('user-response');
  const modalEl = document.getElementById('userModal');
  const modalBody = document.getElementById('modal-body');
  const bootstrapModal = new bootstrap.Modal(modalEl);

  section.style.display = 'block';

  loadUserUnreadCount();
  loadUserList();

  setInterval(loadUserUnreadCount, 30000);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    respDiv.textContent = 'Invio in corso…';
    const subject = form.subject.value.trim();
    const body = form.body.value.trim();

    try {
      const res = await fetch(`${BASE_URL}/api/feedback/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, body })
      });
      if (!res.ok) throw new Error(res.statusText);
      const ok = await res.json();
      if (ok) {
        respDiv.textContent = 'Messaggio inviato';
        form.reset();
        bootstrap.Collapse.getInstance(formCollapse).hide();
        loadUserUnreadCount();
        await loadUserList();
      } else {
        respDiv.textContent = 'Errore invio';
      }
    } catch (err) {
      respDiv.textContent = 'Errore: ' + err.message;
    }
  });

  // carico badge
  async function loadUserUnreadCount() {
    try {
      const res = await fetch(`${BASE_URL}/api/feedback/user/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const count = await res.json();
      const badge = document.getElementById('user-unread-count');
      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    } catch {  }
  }

  // carico la lista
  async function loadUserList() {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento…</span>
      </div>
    </td></tr>`;
    try {
      const res = await fetch(`${BASE_URL}/api/feedback/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      renderTable(data);
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">
        Errore nel caricamento
      </td></tr>`;
      console.error(err);
    }
  }

  function renderTable(list) {
    if (!list.length) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Nessun messaggio</td></tr>`;
      return;
    }
    tableBody.innerHTML = list.map(f => {
      let stato = !f.reply
        ? 'In attesa'
        : (!f.reply.read ? 'Nuova risposta' : 'Letto');

      return `
      <tr>       
        <td>${f.subject}</td>
        <td>${new Date(f.createdAt).toLocaleString()}</td>
        <td class="status-cell">${stato}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-id="${f.id}">
            📧 Apri
          </button>
        </td>
      </tr>`;
    }).join('');
    document.querySelectorAll('#user-table button[data-id]')
      .forEach(b => b.addEventListener('click', () => viewDetail(b.dataset.id)));
  }


  // dettaglio
  function viewDetail(id) {
    modalBody.innerHTML = `<div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Caricamento…</span>
      </div>
    </div>`;
    bootstrapModal.show();
    fetch(`${BASE_URL}/api/feedback/my/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(f => {
        let html = `
        <h5>${f.subject}</h5>
        <p>${f.body}</p>
        <small class="text-muted">Inviato il ${new Date(f.createdAt).toLocaleString()}</small>`;
        if (f.reply) {
          html += `
          <hr>
          <h6>Risposta</h6>
          <p>${f.reply.body}</p>
          <small class="text-muted">
            Risposto il ${new Date(f.reply.createdAt).toLocaleString()}
          </small>`;
          if (!f.reply.read) markAsRead(f.reply.id);
        }
        modalBody.innerHTML = html;
      })
      .catch(err => {
        modalBody.innerHTML = `<p class="text-danger">Errore: ${err.message}</p>`;
      });
  }

  function markAsRead(replyId) {
    fetch(`${BASE_URL}/api/feedback/${replyId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(() => {
        loadUserUnreadCount();
        loadUserList();
      })
      .catch(console.error);
  }
});
