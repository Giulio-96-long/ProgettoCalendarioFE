document.addEventListener('DOMContentLoaded', () => {
  const params     = new URLSearchParams(window.location.search);
  const code       = params.get('code')    || 'ERRORE';
  const message    = params.get('message') || 'Si è verificato un errore imprevisto.';
  const stack      = params.get('stack');

  document.getElementById('errorCode').innerText    = code;
  document.getElementById('errorMessage').innerText = message;

  const loginBtn    = document.getElementById('loginBtn');
  const calendarBtn = document.getElementById('calendarBtn');

  if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
    loginBtn.style.display = 'inline-block';
    calendarBtn.style.display = 'none';
  } else {
    loginBtn.style.display = 'none';
    calendarBtn.style.display = 'inline-block';
  }

  if (stack) {
    const pre = document.getElementById('errorStack');
    pre.textContent = decodeURIComponent(stack);
    pre.classList.remove('d-none');
  }
});
