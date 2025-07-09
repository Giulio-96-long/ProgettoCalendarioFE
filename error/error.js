(function () {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || 'ERRORE';
  const message = params.get('message') || 'Si è verificato un errore imprevisto.';

  document.getElementById('errorCode').innerText = code;
  document.getElementById('errorMessage').innerText = message;
})();