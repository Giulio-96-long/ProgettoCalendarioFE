document.addEventListener('DOMContentLoaded', () => {

  const params = new URLSearchParams(window.location.search);
  const isoDate = params.get('date');
  const dateNoteId = params.get('dateNoteId');

  const displayDateEl = document.getElementById('displayDate');
  if (isoDate) {
    const d = new Date(isoDate);
    displayDateEl.textContent = d.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } else {
    displayDateEl.textContent = '—';
  }

  const dt = new DataTransfer();

  const form = document.getElementById('newNoteForm');
  const shareSearch       = document.getElementById('shareSearch');
  const shareSearchResults= document.getElementById('shareSearchResults');
  const fileInput = document.getElementById('files');
  const fileListUl = document.getElementById('fileList');
  const currentSharedList  = document.getElementById('usersList');
  let sharedUsers = [];

  const btnLoadUsers = document.getElementById('btnLoadUsers');
  const shareSection = document.getElementById('shareSection');

  // mostra/nascondi la sezione di condivisione
  btnLoadUsers.addEventListener('click', () => {
    shareSection.classList.toggle('d-none');
  });

   // debounce helper
  function debounce(fn, ms) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // RICERCA UTENTI 
  function doSearch(q) {
    if (!q) {
      shareSearchResults.innerHTML = '';
      return;
    }
    fetch(`${BASE_URL}/api/user/search?query=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(users => {
      shareSearchResults.innerHTML = users.map(u => `
        <li class="list-group-item list-group-item-action"
            data-id="${u.id}" data-email="${u.email}">
          ${u.email} (${u.username})
        </li>
      `).join('');
      shareSearchResults.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
          const id    = +li.dataset.id;
          const email = li.dataset.email;
          if (!sharedUsers.some(u => u.id === id)) {
            sharedUsers.push({ id, email });
            renderSharedList();
          }
          shareSearch.value = '';
          shareSearchResults.innerHTML = '';
        });
      });
    })
    .catch(console.error);
  }
  shareSearch.addEventListener('input', debounce(e => doSearch(e.target.value), 300));

  // RENDER DELLA LISTA DEGLI UTENTI SELEZIONATI 
  function renderSharedList() {
    currentSharedList.innerHTML = sharedUsers.map(u => `
      <li class="list-group-item d-flex justify-content-between align-items-center"
          data-id="${u.id}">
        <span>${u.email}</span>
        <button class="btn btn-sm btn-outline-danger remove-user-btn">✕</button>
      </li>
    `).join('');
  }
  // rimuovo al click sulla “✕”
  currentSharedList.addEventListener('click', e => {
    const btn = e.target.closest('.remove-user-btn');
    if (!btn) return;
    const li     = btn.closest('li');
    const userId = +li.dataset.id;
    sharedUsers = sharedUsers.filter(u => u.id !== userId);
    renderSharedList();
  });

  // Gestione multi-file
  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(file => {
      if (![...dt.files].some(f => f.name === file.name && f.size === file.size)) {
        dt.items.add(file);
      }
    });
    fileInput.files = dt.files;
    renderFileList();
  });

  function renderFileList() {
    fileListUl.innerHTML = '';
    Array.from(dt.files).forEach((file, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.textContent = file.name;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-link text-danger';
      btn.innerHTML = '&times;';
      btn.onclick = () => {
        dt.items.remove(idx);
        fileInput.files = dt.files;
        renderFileList();
      };
      li.appendChild(btn);
      fileListUl.appendChild(li);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const isImportant = form.isImportant.checked;
    const color = form.color.value || '';
    const message = form.message.value.trim();

    if (!title) {
      alert('Il titolo è obbligatorio.');
      form.title.focus();
      return;
    }

    if (title.length > 100) {
      alert('Il titolo deve avere massimo 100 caratteri.');
      form.title.focus();
      return;
    }

    if (description.length > 1000) {
      alert('La descrizione deve avere massimo 1000 caratteri.');
      form.description.focus();
      return;
    }

    if (message.length > 200) {
      alert('Il messaggio personalizzato non può superare 200 caratteri.');
      form.message.focus();
      return;
    }

    for (let file of fileInput.files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Il file "${file.name}" supera i 5MB consentiti.`);
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isImportant', isImportant);
    if (color) formData.append('color', color);
    if (message) formData.append('message', message);

    if (dateNoteId) {
      formData.append('dateNoteId', dateNoteId);
    } else if (isoDate) {
      formData.append('dateNote', `${isoDate}T00:00:00`);
    } else {
      alert('Data non specificata!');
      return;
    }

    Array.from(dt.files).forEach(f => formData.append('files', f));

    // Condivisione: aggiungo array paralleli shareUserIds
    sharedUsers.forEach(u => formData.append('shareUserIds', u.id));

    try {
      // Creo la nota
      const resNote = await fetch(`${BASE_URL}/api/note/new`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!resNote.ok) throw new Error(await resNote.text());
      const noteId = await resNote.json();

      // Condivido con gli utenti selezionati
      const shareData = new FormData();
      document.querySelectorAll('.share-user:checked').forEach(chk => {
        shareData.append('shareUserIds', chk.dataset.userId);
      });
      if ([...shareData.getAll('shareUserIds')].length) {
        await fetch(`${BASE_URL}/share/${noteId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: shareData
        });
      }

      alert('Nota salvata e condivisa con successo!');
      window.location.href = `../day-detail/day-detail.html?id=${noteId}`;

    } catch (err) {
      console.error(err);
      alert('Errore: ' + err.message);
    }
  });
});