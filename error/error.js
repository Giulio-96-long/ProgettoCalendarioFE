(function() {
  const params = new URLSearchParams(window.location.search);

  const code = params.get('code') || 'Sconosciuto';
  const message = params.get('message') || 'Si è verificato un errore imprevisto.';
  const stack = params.get('stack') ? decodeURIComponent(params.get('stack')) : '';

  document.getElementById('errorCode').innerText = code;
  document.getElementById('errorMessage').innerText = message;

  if (stack) {
    document.getElementById('errorStack').innerText = stack;
  } else {
    document.getElementById('errorStack').style.display = 'none';
  }
})();
