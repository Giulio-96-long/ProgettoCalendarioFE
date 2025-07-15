const BASE_URL    = 'http://localhost:8080';          
const LOGIN_URL   = `${BASE_URL}/login/index.html`;
const ERROR_PAGE  = `../error/error.html`;

const PUBLIC_PATHS = [
  '/login',
  '/login/index.html',
  '/register',
  '/error',
  '/error/index.html'
];

const token = localStorage.getItem('jwtToken');

;(function() {
  const { pathname } = window.location;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (!token && !isPublic) {
    window.location.replace(LOGIN_URL);
  }
})();

// override di fetch 
;(function() {
  const _fetch = window.fetch.bind(window);

 window.fetch = async function(input, init = {}) {
  let res;
  try {
    res = await _fetch(input, init);
  } catch (err) {
    console.error('Fetch error:', err);
    window.location.replace(
      `${ERROR_PAGE}?code=NETWORK_ERROR&message=${encodeURIComponent('Errore di rete.')}`
    );
    return Promise.reject(err);
  }

  const isLoginRequest = typeof input === 'string' && input.includes('/auth/login');

  if ((res.status === 401 || res.status === 403) && !isLoginRequest) {
    const code    = res.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN';
    const message = res.status === 401
      ? 'Sessione scaduta. Effettua nuovamente il login.'
      : 'Non hai i permessi per questa operazione.';
    window.location.replace(
      `${ERROR_PAGE}?code=${code}&message=${encodeURIComponent(message)}`
    );
    return Promise.reject({ code, message });
  }

  if (res.status >= 400) {
    let payload, code, message;
    try {
      payload = await res.clone().json();
      code    = payload.code    || res.status;
      message = payload.message || res.statusText;
    } catch {
      code    = res.status;
      message = res.statusText;
    }

    // NON redirezionare se sei nel login
    if (!isLoginRequest) {
      window.location.replace(
        `${ERROR_PAGE}?code=${code}&message=${encodeURIComponent(message)}`
      );
    }

    return Promise.reject({ code, message });
  }

  return res;
};
})();
