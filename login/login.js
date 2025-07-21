document.addEventListener('DOMContentLoaded', () => {
  // Se arrivo da OAuth2 con ?token=…
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('jwtToken', token);
    history.replaceState({}, document.title, window.location.pathname);
    window.location.href = '../calendar/calendar.html';
  }

  // Gestione REGISTER
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', event => {
      event.preventDefault();
      const username = document.getElementById('username').value.trim();
      const lastname = document.getElementById('lastname').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      if (!username || !lastname || !email || !password) {
        alert('Tutti i campi sono obbligatori.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        alert('Inserisci un indirizzo email valido.');
        return;
      }
      if (password.length < 6 || password.length > 20) {
        alert('La password deve avere tra 6 e 20 caratteri.');
        return;
      }
      registerUser(username, email, password, lastname);
    });
  }

  // Gestione LOGIN
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const loginEmail = document.getElementById('loginEmail').value.trim();
      const loginPassword = document.getElementById('loginPassword').value;
      if (!loginEmail || !loginPassword) {
        alert('Email e password sono obbligatorie.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(loginEmail)) {
        alert('Inserisci un indirizzo email valido.');
        return;
      }
      loginUser(loginEmail, loginPassword);
    });
  }
});

function registerUser(username, email, password, lastname) {
  fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, lastname })
  })
  .then(res => res.json()) // solo se status 200
  .then(data => {
    alert(data.message || 'Registrazione riuscita');
    document.querySelector('#login-tab').click();
  })
  .catch(err => {
    if (err.code === 409 || err.message === 'Email già esistente') {
      alert('Email già registrata');
    } else if (err.code === 400 || err.message === 'Dati di registrazione non validi') {
      alert('Dati non validi');
    } else {
      alert('Registrazione fallita. Riprova più tardi.');
      console.error(err);
    }
  });
}



function loginUser(email, password) {
  fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      localStorage.setItem('jwtToken', data.token);
      window.location.href = '../calendar/calendar.html';
    })
    .catch(() => {
      alert('Login fallito. Controlla le credenziali.');
    });
}
