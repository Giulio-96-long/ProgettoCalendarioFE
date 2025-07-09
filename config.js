// config.js
const BASE_URL = 'http://localhost:8080';          
const LOGIN_URL = `${BASE_URL}/login/index.html`;
const ERROR_PAGE = `../error/error.html`;

const PUBLIC_PATHS = [
  '/login',
  '/login/index.html',
  '/register',
  '/error',
  '/error/index.html'
];

const { pathname } = window.location;
const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

const token = localStorage.getItem('jwtToken');
if (!token && !isPublic) {
  window.location.replace(LOGIN_URL);
}

;(function() {

  // salva il fetch originale
  const _fetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {

    const res = await _fetch(input, init);

    if (res.status === 401 || res.status === 403) {
      const code    = res.status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN';
      const message = res.status === 401
        ? 'Sessione scaduta. Effettua nuovamente il login.'
        : 'Non hai i permessi per questa operazione.';
      const params = new URLSearchParams({ code, message });
      return window.location.replace(`${ERROR_PAGE}?${params.toString()}`);
    }

    if (res.status >= 400 && res.status <= 500) {
      return res;
    }

    if (!res.ok) {
      let err;
      try {
        err = await res.clone().json(); 
      } catch {
        err = { code: res.status, message: res.statusText };
      }
      const params = new URLSearchParams({
        code: err.code    || res.status,
        message: err.message || res.statusText
      });
      window.location.replace(`${ERROR_PAGE}?${params.toString()}`);
      return;
    }

    return res;
  };
})();