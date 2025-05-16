document.addEventListener('DOMContentLoaded', () => {

  const params = new URLSearchParams(window.location.search);
  const noteId = params.get('id');
  if (!noteId) {
    alert('Nota non specificata');
    return;
  }

  const titleIn = document.getElementById('titleInput');
  const descIn = document.getElementById('descriptionInput');
  const impCb = document.getElementById('importantCheckbox');
  const colIn = document.getElementById('colorInput');
  const msgIn = document.getElementById('messageInput');
  const filesUl = document.getElementById('filesList');

  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const fileInputGroup = document.getElementById('fileInputGroup');
  const fileInput = document.getElementById('fileInput');

  let original = {};

  function loadNote() {
    fetch(`${BASE_URL}/api/note/getById/${noteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          window.location.href = `../error/error.html`;
          throw new Error('Redirect to error page');
        }
        return res.json();
      })
      .then(n => {
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

        filesUl.innerHTML = n.files.map(f => `
          <li data-file-id="${f.id}">
            <span>${f.nome}</span>
            <button class="btn-file-download" data-id="${f.id}" title="Scarica">⬇️</button>
            <button class="btn-file-delete" title="Elimina allegato">🗑️</button>
          </li>
        `).join('');

        document.querySelectorAll('.btn-file-download').forEach(btn => {
          btn.addEventListener('click', async () => {
            const fileId = btn.dataset.id;
            const token = localStorage.getItem('jwtToken');

            try {
              const res = await fetch(`${BASE_URL}/api/file/download/${fileId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!res.ok) {
                window.location.href = `../error/error.html`;
                throw new Error('Redirect to error page');
              }

              const blob = await res.blob();
              const contentDisposition = res.headers.get('Content-Disposition');
              let filename = 'download';
              const match = /filename="(.+)"/.exec(contentDisposition);
              if (match) filename = match[1];

              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = filename;
              document.body.appendChild(link); // assicurati che sia nel DOM
              link.click();
              link.remove();
              URL.revokeObjectURL(link.href);
            } catch (err) {
              alert('Errore durante il download: ' + err.message);
            }
          });
        });

        original = {
          title: titleIn.value,
          desc: descIn.value,
          imp: impCb.checked,
          col: colIn.value,
          msg: msgIn.value
        };

        document.querySelectorAll('.btn-file-delete').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const li = btn.closest('li');
            const fileId = li.dataset.fileId;
            if (!confirm('Eliminare questo allegato?')) return;
            fetch(`${BASE_URL}/api/file/delete/${fileId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(d => {
                if (!d.ok) alert('Errore eliminazione file');
                else li.remove();
              });
          });
        });
      })
      .catch(err => alert(err.message));
  }
  function setEditMode(on) {
    [titleIn, descIn, impCb, colIn, msgIn].forEach(el => el.disabled = !on);
    fileInput.disabled = !on;
    // toggle class d-none su bottoni e gruppo file input
    editBtn.classList.toggle('d-none', on);
    saveBtn.classList.toggle('d-none', !on);
    cancelBtn.classList.toggle('d-none', !on);
    fileInputGroup.classList.toggle('d-none', !on);
  }

  editBtn.addEventListener('click', () => setEditMode(true));
  cancelBtn.addEventListener('click', () => {
    titleIn.value = original.title;
    descIn.value = original.desc;
    impCb.checked = original.imp;
    colIn.value = original.col;
    msgIn.value = original.msg;
    setEditMode(false);
  });

  saveBtn.addEventListener('click', () => {
    const title = titleIn.value.trim();
    const description = descIn.value.trim();
    const customMessage = msgIn.value.trim();
    const color = colIn.value;

    if (!title) {
      alert('Il titolo è obbligatorio.');
      titleIn.focus();
      return;
    }

    if (title.length > 100) {
      alert('Il titolo non può superare i 100 caratteri.');
      titleIn.focus();
      return;
    }

    if (description.length > 1000) {
      alert('La descrizione non può superare i 1000 caratteri.');
      descIn.focus();
      return;
    }

    if (customMessage.length > 200) {
      alert('Il messaggio personalizzato non può superare 200 caratteri.');
      msgIn.focus();
      return;
    }

    for (let f of fileInput.files) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`Il file "${f.name}" supera i 5MB.`);
        return;
      }
    }

    const formData = new FormData();
    formData.append('idDateNote', noteId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isImportant', impCb.checked);
    formData.append('color', color);
    formData.append('customMessage', customMessage);

    for (let f of fileInput.files) {
      formData.append('files', f);
    }

    fetch(`${BASE_URL}/api/note/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(upd => {
        if (!upd.ok) {
          window.location.href = `../error/error.html`;
          throw new Error('Redirect to error page');
        }
        return upd.json();
      })
      .then(() => {
        alert('Nota aggiornata con allegati!');
        loadNote();
        setEditMode(false);
      })
      .catch(e => {
        alert('Fallito aggiornamento: ' + e.message);
      });
  });

  loadNote();
  fileInput.value = '';
  setEditMode(false);
});