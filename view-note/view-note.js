document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const noteId = params.get('id');
  if (!noteId) {
    alert('Nota non specificata');
    return;
  }

  // campi nota
  const titleIn = document.getElementById('titleInput');
  const descIn = document.getElementById('descriptionInput');
  const impCb = document.getElementById('importantCheckbox');
  const colIn = document.getElementById('colorInput');
  const msgIn = document.getElementById('messageInput');

  const filesUl = document.getElementById('filesList');
  const fileInputGroup = document.getElementById('fileInputGroup');
  const fileInput = document.getElementById('fileInput');
  const pendingFilesList = document.getElementById('pendingFilesList');

  const shareSearchGroup = document.getElementById('shareSearchGroup');
  const shareSearch = document.getElementById('shareSearch');
  const shareSearchResults = document.getElementById('shareSearchResults');
  const currentSharedList = document.getElementById('currentSharedList');
  const sharedLabel = document.getElementById('sharedLabel');

  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  let sharedUsers = [];
  const addedShared = new Set();
  const removedShared = new Set();
  let pendingFiles = [];
  let original = {};
  let isOwner = false;

  const currentUserId = parseJwt(token)?.id;

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch (e) {
      return null;
    }
  }

  function debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function renderSharedList() {
    currentSharedList.innerHTML = sharedUsers.map(u => `
      <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${u.id}">
        <span>${u.email}</span>
        ${isOwner ? `<button class="btn btn-sm btn-outline-danger remove-shared-btn">✕</button>` : ''}
      </li>
    `).join('');
  }

  currentSharedList.addEventListener('click', e => {
    const btn = e.target.closest('.remove-shared-btn');
    if (!btn) return;
    const li = btn.closest('li');
    const userId = +li.dataset.id;
    if (!confirm('Rimuovere questa persona dalla condivisione?')) return;

    fetch(`${BASE_URL}/api/share/${noteId}/removeForMe`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      sharedUsers = sharedUsers.filter(u => u.id !== userId);
      removedShared.add(userId);
      addedShared.delete(userId);
      renderSharedList();
    })
    .catch(err => alert('Errore: ' + err.message));
  });

  function doSearch(q) {
    if (!q) {
      shareSearchResults.innerHTML = '';
      return;
    }
    fetch(`${BASE_URL}/api/user/search?query=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(users => {
      shareSearchResults.innerHTML = users.map(u => `
        <li class="list-group-item list-group-item-action" data-id="${u.id}" data-email="${u.email}">
          ${u.email} (${u.username})
        </li>
      `).join('');
      shareSearchResults.querySelectorAll('li').forEach(li =>
        li.addEventListener('click', () => {
          const id = +li.dataset.id;
          const email = li.dataset.email;
          if (!sharedUsers.some(u => u.id === id)) {
            sharedUsers.push({ id, email });
            addedShared.add(id);
            removedShared.delete(id);
            renderSharedList();
          }
          shareSearch.value = '';
          shareSearchResults.innerHTML = '';
        })
      );
    })
    .catch(console.error);
  }
  shareSearch.addEventListener('input', debounce(e => doSearch(e.target.value), 300));

  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(f => pendingFiles.push(f));
    fileInput.value = '';
    renderPendingFiles();
  });

  function renderPendingFiles() {
    pendingFilesList.innerHTML = pendingFiles.map((f, idx) => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${f.name}</span>
        <button type="button" class="btn btn-sm btn-outline-danger" data-idx="${idx}">🗑️</button>
      </li>
    `).join('');
    pendingFilesList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingFiles.splice(+btn.dataset.idx, 1);
        renderPendingFiles();
      });
    });
  }

  function loadNote() {
    fetch(`${BASE_URL}/api/note/getById/${noteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) {
        window.location.href = '../error/error.html';
        throw new Error('Redirect');
      }
      return res.json();
    })
    .then(n => {
      isOwner = n.ownerId === currentUserId;

      titleIn.value = n.title || '';
      descIn.value = n.description || '';
      impCb.checked = !!n.important;
      if (n.personalizated) {
        colIn.value = n.personalizated.color || '#000000';
        msgIn.value = n.personalizated.customMessage || '';
      } else {
        colIn.value = '#000000';
        msgIn.value = '';
      }
      original = {
        title: titleIn.value,
        desc: descIn.value,
        imp: impCb.checked,
        col: colIn.value,
        msg: msgIn.value
      };

      filesUl.innerHTML = n.files.map(f => `
        <li data-file-id="${f.id}" class="list-group-item d-flex justify-content-between align-items-center">
          <span>${f.nome}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary btn-file-download" data-id="${f.id}" title="Scarica">⬇️</button>
            ${isOwner ? `<button class="btn btn-sm btn-outline-danger btn-file-delete" title="Elimina allegato">🗑️</button>` : ''}
          </div>
        </li>
      `).join('');

      filesUl.querySelectorAll('.btn-file-download').forEach(btn => {
        btn.addEventListener('click', () => {
          const fileId = btn.dataset.id;
          fetch(`${BASE_URL}/api/file/download/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.blob().then(blob => ({ blob, headers: r.headers }));
          })
          .then(({ blob, headers }) => {
            const disp = headers.get('Content-Disposition') || '';
            const match = /filename="?([^";]+)"?/.exec(disp);
            const name = match ? match[1] : 'download';
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
          })
          .catch(err => alert('Errore download: ' + err.message));
        });
      });

      if (isOwner) {
        filesUl.querySelectorAll('.btn-file-delete').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const li = btn.closest('li');
            const fileId = li.dataset.fileId;
            if (!confirm('Eliminare questo allegato?')) return;
            fetch(`${BASE_URL}/api/file/delete/${fileId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(r => {
              if (!r.ok) throw new Error(r.statusText);
              li.remove();
            })
            .catch(() => alert('Errore eliminazione file'));
          });
        });
      }

      if (isOwner) {
        sharedUsers = n.sharedTo || [];
        shareSearchGroup.classList.remove('d-none');
        sharedLabel.textContent = 'Condiviso con:';
      } else {
        sharedUsers = n.sharedBy || [];
        shareSearchGroup.classList.add('d-none');
        sharedLabel.textContent = 'Condiviso da:';
      }
      renderSharedList();
      setEditMode(false);
    })
    .catch(err => alert(err.message));
  }

  function setEditMode(on) {
    [titleIn, descIn, impCb, colIn, msgIn].forEach(el => el.disabled = !on);
    fileInput.disabled = !on;
    fileInputGroup.classList.toggle('d-none', !on);
    editBtn.classList.toggle('d-none', on);
    saveBtn.classList.toggle('d-none', !on);
    cancelBtn.classList.toggle('d-none', !on);
  }

  editBtn.addEventListener('click', () => setEditMode(true));
  cancelBtn.addEventListener('click', () => {
    titleIn.value = original.title;
    descIn.value = original.desc;
    impCb.checked = original.imp;
    colIn.value = original.col;
    msgIn.value = original.msg;
    pendingFiles = [];
    renderPendingFiles();
    addedShared.clear();
    removedShared.clear();
    loadNote();
    setEditMode(false);
  });

  saveBtn.addEventListener('click', () => {
    if (!titleIn.value.trim()) {
      alert('Il titolo è obbligatorio');
      titleIn.focus();
      return;
    }
    const formData = new FormData();
    formData.append('idDateNote', noteId);
    formData.append('title', titleIn.value.trim());
    formData.append('description', descIn.value.trim());
    formData.append('isImportant', impCb.checked);
    formData.append('color', colIn.value);
    formData.append('customMessage', msgIn.value.trim());
    pendingFiles.forEach(f => formData.append('files', f));

    fetch(`${BASE_URL}/api/note/update`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error('Update failed');
      if (addedShared.size) {
        return fetch(`${BASE_URL}/api/share/${noteId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(Array.from(addedShared).map(id => ({ userId: id })))
        });
      }
    })
    .then(res => {
      if (res && !res.ok) throw new Error('Errore aggiunta condivisione');
      const deletes = Array.from(removedShared).map(id =>
        fetch(`${BASE_URL}/api/share/${noteId}/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );
      return Promise.all(deletes);
    })
    .then(results => {
      if (results && results.some(r => !r.ok)) {
        throw new Error('Errore rimozione condivisione');
      }
      alert('Nota e condivisioni aggiornate!');
      addedShared.clear();
      removedShared.clear();
      pendingFiles = [];
      loadNote();
    })
    .catch(err => alert('Fallito aggiornamento: ' + err.message));
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });

  loadNote();
});
