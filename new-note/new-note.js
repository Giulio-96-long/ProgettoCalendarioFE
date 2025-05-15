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

  const form = document.getElementById('newNoteForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const isImportant = form.isImportant.checked;
    const color = form.color.value || '';
    const message = form.message.value.trim();
    const filesInput = form.files;

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

    for (let file of filesInput.files) {
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

    for (let f of filesInput.files) {
      formData.append('files', f);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/note/new`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const txt = await res.text();
        window.location.href = `../error/error.html`;
        throw new Error('Redirect to error page');
      }

      const noteId = await res.json();
      alert('Nota creata con successo!');
      window.location.href = `../day-detail/day-detail.html?id=${noteId}`;

    } catch (err) {
      alert('Errore nel salvataggio: ' + err.message);
      window.location.href = `../error/error.html`;
       
    }
  });
});