document.addEventListener('DOMContentLoaded', function () {
  const placeholder = document.getElementById('navbar-placeholder');

  const nav = document.createElement('nav');
  nav.className = 'navbar navbar-expand-lg bg-primary navbar-dark';

  nav.innerHTML = `
    <div class="container-fluid">     
      <button class="navbar-toggler" type="button"
              data-bs-toggle="collapse" data-bs-target="#mainNav"
              aria-controls="mainNav" aria-expanded="false"
              aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0" id="nav-left"></ul>
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0" id="nav-right"></ul>
      </div>
    </div>
  `;
  placeholder.appendChild(nav);

  const leftUl = document.getElementById('nav-left');
  const rightUl = document.getElementById('nav-right');
 
  // Carica il profilo utente
  fetch(`${BASE_URL}/api/user/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {     
      if (!res.ok) throw new Error('not-auth');
      return res.json();
    })
    .then(me => {
      window.profile = me;
      const isAdmin = me.role === 'ADMIN' || me.role === 'ROLE_ADMIN';

      // Link statici
      const links = [
        { href: '/calendar/calendar.html', text: 'Calendario' },
        { href: '/archived/archived.html', text: 'Archivio' },
        { href: '/profile/profile.html', text: 'Profilo' },
        {
          href: isAdmin
            ? '/admin-feedback/feedback-admin.html'
            : '/user-feedback/feedback-user.html',
          text: 'Feedback',
          badgeId: isAdmin ? 'admin-unread-count' : 'user-unread-count',
          badgeApi: isAdmin
            ? '/api/feedback/admin/unread/count'
            : '/api/feedback/user/unread/count'
        },
        {
          href: isAdmin
            ? '/NoteChangeHistory/NoteChangeHistory.html'
            : null,
          text: 'Storico Note'
        }
      ];

      // Popola nav-left
      links.forEach(l => {
        if (!l.href) return;
        const li = document.createElement('li');
        li.className = 'nav-item me-3';

        if (l.badgeId) {
          li.innerHTML = `
          <a class="nav-link d-flex align-items-center" href="${l.href}">
            ${l.text}
            <span id="${l.badgeId}"
                  class="badge bg-danger ms-1 p-1"
                  style="display:none"></span>
          </a>`;
          // carico il count (loadCount aggiunge BASE_URL)
          loadCount(l.badgeApi, l.badgeId);
          setInterval(() => loadCount(l.badgeApi, l.badgeId), 30000);
        } else {
          li.innerHTML = `<a class="nav-link" href="${l.href}">${l.text}</a>`;
        }

        leftUl.appendChild(li);
      });

      // Se ADMIN, aggiungo Dashboard Errori
      if (isAdmin) {
        const li = document.createElement('li');
        li.className = 'nav-item me-3';
        li.innerHTML = `<a class="nav-link" href="/error-log/error-log.html">Dashboard Errori</a>`;
        leftUl.appendChild(li);
      }

      const liUser = document.createElement('li');
      liUser.className = 'nav-item d-flex align-items-center';
      liUser.innerHTML = `
        <span class="nav-link text-white disabled">
          ${me.username} (${me.role})
        </span>`;
      rightUl.appendChild(liUser);

      // Bottone logout
      const liLogout = document.createElement('li');
      liLogout.className = 'nav-item d-flex align-items-center ms-3';
      liLogout.innerHTML = `
        <a id="logoutBtn" href="/login/index.html"
          class="btn btn-outline-light btn-sm">
          Logout
        </a>`;
      rightUl.appendChild(liLogout);


      document.getElementById('logoutBtn')
        .addEventListener('click', function (e) {
          e.preventDefault();
          localStorage.removeItem('jwtToken');
          window.location.replace('/login/index.html');
        });

      // Badges (feedback unread / reply)
      if (isAdmin) { 
        loadCount('/api/feedback/admin/unread/count', 'admin-unread-count');
        loadCount('/api/feedback/admin/reply/count', 'admin-reply-count');
        setInterval(() => loadCount('/api/feedback/admin/unread/count', 'admin-unread-count'), 30000);
        setInterval(() => loadCount('/api/feedback/admin/reply/count', 'admin-reply-count'), 30000);
      } else {      
        loadCount('/api/feedback/user/unread/count', 'user-unread-count');
        setInterval(() => loadCount('/api/feedback/user/unread/count', 'user-unread-count'), 30000);
      }
    })
    .catch(err => {
      // se non autenticato, mostra solo “Login”
      leftUl.innerHTML = '';
      rightUl.innerHTML = `
      <li class="nav-item">
        <a class="nav-link text-white" href="/login/index.html">Login</a>
      </li>`;
    });  

  function loadCount(url, badgeId) {
    fetch(`${BASE_URL}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(count => {
        const b = document.getElementById(badgeId);
        b.textContent = count > 0 ? count : '';
        b.style.display = count > 0 ? 'inline-block' : 'none';
      })
      .catch(() => { });
  }

  if (window.location.pathname.includes('/login/')) {
    return;
  }
});
