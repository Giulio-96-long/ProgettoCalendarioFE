document.addEventListener('DOMContentLoaded', () => {
  let userId;
  const photoImg = document.getElementById('photo');
  const photoFileInput = document.getElementById('photo-file');
  const msgPhoto = document.getElementById('photo-msg');

  const usernameInput = document.getElementById('username-input');
  const emailInput    = document.getElementById('email-input');
  const lastnameInput = document.getElementById('lastname-input');
  const currentPass   = document.getElementById('current-password-input');
  const newPass       = document.getElementById('new-password-input');
  const msgPass       = document.getElementById('pass-msg');

  const btnEdit    = document.getElementById('btn-edit');
  const btnSave    = document.getElementById('btn-save');
  const btnCancel  = document.getElementById('btn-cancel');
  const btnDelete  = document.getElementById('btn-delete');
  const msgEdit    = document.getElementById('edit-msg');
  const btnChange  = document.getElementById('btn-change-password');

  // Carica dati profilo
  function loadProfile() {
    fetch(`${BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) {
        window.location.href = `../error/error.html`;
        throw new Error('Redirect to error page');
      }
      return res.json();
    })
    .then(user => {
      userId = user.id;
      usernameInput.value = user.username    || '';
      emailInput.value    = user.email       || '';
      lastnameInput.value = user.lastName    || '';
      if (user.photo) {
        photoImg.src = `data:${user.photoContentType};base64,${user.photo}`;
      }
    })
    .catch(err => {
      msgEdit.textContent   = err.message;
      msgEdit.className     = 'text-danger';
    });
  }

  // Upload foto
  photoFileInput.addEventListener('change', () => {
    if (!photoFileInput.files[0]) return;
    const fd = new FormData();
    fd.append('file', photoFileInput.files[0]);
    fetch(`${BASE_URL}/api/user/getOrUpdatephoto`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    })
    .then(res => {
      if (!res.ok) {       
        throw new Error('Impossibile Aggiungere foto');
      }
      return res.json();
    })
    .then(r => {
      photoImg.src = `data:${r.contentType};base64,${r.data}`;
      msgPhoto.textContent = 'Foto aggiornata!';
      msgPhoto.className   = 'text-success';
    })
    .catch(err => {
      msgPhoto.textContent = err.message;
      msgPhoto.className   = 'text-danger';
    });
  });

  // Cambio password
  btnChange.addEventListener('click', () => {
    const curr = currentPass.value.trim();
    const neu  = newPass.value.trim();
    msgPass.textContent = '';
    if (!curr || !neu) {
      msgPass.textContent = 'Entrambi i campi password sono obbligatori.';
      msgPass.className   = 'text-danger';
      return;
    }
    if (neu.length < 6 || neu.length > 20) {
      msgPass.textContent = 'La nuova password deve avere tra 6 e 20 caratteri.';
      msgPass.className   = 'text-danger';
      return;
    }
    fetch(`${BASE_URL}/api/user/changePassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: curr, newPassword: neu })
    })
    .then(res => {
      if (!res.ok) {
        window.location.href = `../error/error.html`;
        throw new Error('Redirect to error page');
      }
      return res.json();
    })
    .then(ok => {
      if (ok) {
        msgPass.textContent = 'Password cambiata!';
        msgPass.className   = 'text-success';
        currentPass.value = newPass.value = '';
      } else {
        throw new Error('Password corrente non corretta');
      }
    })
    .catch(err => {
      msgPass.textContent = err.message;
      msgPass.className   = 'text-danger';
    });
  });

  // Modifica dati
  btnEdit.addEventListener('click', () => {
    [usernameInput, emailInput, lastnameInput].forEach(i => i.disabled = false);
    btnEdit.classList.add('d-none');
    btnSave.classList.remove('d-none');
    btnCancel.classList.remove('d-none');
    msgEdit.textContent = '';
  });
  btnCancel.addEventListener('click', () => {
    loadProfile();
    [usernameInput, emailInput, lastnameInput].forEach(i => i.disabled = true);
    btnEdit.classList.remove('d-none');
    btnSave.classList.add('d-none');
    btnCancel.classList.add('d-none');
    msgEdit.textContent = '';
  });
  btnSave.addEventListener('click', () => {
    if (!usernameInput.value.trim() || !emailInput.value.trim() || !lastnameInput.value.trim()) {
      msgEdit.textContent = 'Tutti i campi devono essere compilati.';
      msgEdit.className   = 'text-danger';
      return;
    }
    const dto = {
      username: usernameInput.value,
      email:    emailInput.value,
      lastName: lastnameInput.value
    };
    fetch(`${BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dto)
    })
    .then(res => {
      if (!res.ok) return res.text().then(txt => Promise.reject(txt));
      msgEdit.textContent = 'Dati aggiornati!';
      msgEdit.className   = 'text-success';
      [usernameInput, emailInput, lastnameInput].forEach(i => i.disabled = true);
      btnEdit.classList.remove('d-none');
      btnSave.classList.add('d-none');
      btnCancel.classList.add('d-none');
    })
    .catch(err => {
      msgEdit.textContent = err;
      msgEdit.className   = 'text-danger';
    });
  });

  // Elimina account
  btnDelete.addEventListener('click', () => {
    if (!confirm('Sei sicuro di voler eliminare il tuo account?')) return;
    fetch(`${BASE_URL}/api/user/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      window.location.href = '../login/index.html';
    })
    .catch(err => alert('Errore: ' + err.message));
  });

  // Inizializzo
  loadProfile();
});
