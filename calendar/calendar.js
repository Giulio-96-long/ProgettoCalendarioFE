(async function() {

  const monthNames = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre"
];

  const monthSelect  = document.getElementById('monthSelect');
  const yearSelect   = document.getElementById('yearSelect');
  const prevBtn      = document.getElementById('prevMonth');
  const nextBtn      = document.getElementById('nextMonth');
  const searchBtn    = document.getElementById('searchButton');
  const monthYear    = document.getElementById('monthYear');
  const calendarGrid = document.getElementById('calendarGrid');

  // Stato
  let today = new Date();
  let year  = today.getFullYear();
  let month = today.getMonth() + 1; // 1–12

  // Popola anni e setta correnti
  for (let y = year - 4; y <= year + 6; y++) {
    yearSelect.add(new Option(y, y));
  }
  monthSelect.value = month;
  yearSelect.value  = year;

  // Primo render + fetch
  renderCalendar();
  await fetchMonthNotes();

  // Handlers
  prevBtn .addEventListener('click', () => changeMonth(-1));
  nextBtn .addEventListener('click', () => changeMonth(+1));
  monthSelect.addEventListener('change', onFilterChange);
  yearSelect .addEventListener('change', onFilterChange);
  searchBtn .addEventListener('click', onFilterChange);

  function changeMonth(delta) {
    month += delta;
    if (month < 1)  { month = 12; year--; }
    if (month > 12) { month = 1;  year++; }
    // aggiorno la select in modo che lʼutente veda il mese giusto
    monthSelect.value = month;
    yearSelect.value  = year;
    // rendo e carico direttamente, senza rilettura dai select
    renderCalendar();
    fetchMonthNotes();
  }

  function onFilterChange() {
    // solo qui rileggo dai select
    month = +monthSelect.value;
    year  = +yearSelect.value;
    renderCalendar();
    fetchMonthNotes();
  }

  function renderCalendar() {
    calendarGrid.innerHTML = '';

    monthYear.textContent = `${monthNames[month - 1]} ${year}`;

    // intestazione giorni
    ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(dn => {
      const el = document.createElement('div');
      el.className = 'day-name';
      el.textContent = dn;
      calendarGrid.appendChild(el);
    });

    // celle vuote
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement('div');
      blank.className = 'day';
      calendarGrid.appendChild(blank);
    }

    // giorni del mese
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'day';
      cell.style.position = 'relative';
      cell.dataset.date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cell.innerHTML = `<span class="day-number">${d}</span>`;


      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        const id = cell.dataset.idDataNote;
        if (id) {
          window.location.href =
           `../day-detail/day-detail.html?id=${id}&date=${date}`;
        } else {      
          window.location.href = `../new-note/new-note.html?date=${date}`;
        }
      });
      
      calendarGrid.appendChild(cell);
    }
  }

  async function fetchMonthNotes() {
    const res = await fetch(`${BASE_URL}/api/note/searchByMonth`, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${token}`
      },
      body: JSON.stringify({ month, year, order:'asc' })
    });
    if (!res.ok){
      window.location.href = `../error/error.html`;
      throw new Error('Redirect to error page');
    } 
    const events = await res.json();
    populateMonthNotes(events);
  }

  function populateMonthNotes(events) {
    // ripulisci eventuali vecchi titoli/badge
    calendarGrid
      .querySelectorAll('.note-count, .note-title, .important-dot')
      .forEach(el => el.remove());

    events.forEach(ev => {
      const dt   = new Date(ev.eventDate);
      const day  = dt.getDate();
      const cell = Array.from(calendarGrid.querySelectorAll('.day'))
        .find(c => {
          const span = c.querySelector('.day-number');
          return span && parseInt(span.textContent, 10) === day;
        });
      if (!cell) return;

      // memorizzo l'id per il click
      cell.dataset.idDataNote = ev.idDataNote;

      if (ev.notes.some(n => n.important)) {
        const lbl = document.createElement('div');
        lbl.className = 'important-label';
        lbl.textContent = 'IMP';
        cell.appendChild(lbl);
      }

      // disegno tutti i titoli
      ev.notes.forEach(n => {
        const td = document.createElement('div');
        td.className = 'note-title';
        td.textContent = n.title;      
    
        if (n.color) {
          td.style.setProperty('color', n.color, 'important');
        }         
              
        cell.appendChild(td);
      });

      // badge con numero di note
      const b = document.createElement('div');
      b.className = 'note-count';
      b.textContent = ev.notes.length;
      cell.appendChild(b);
    });
  }

  const backToTop = document.getElementById('backToTop');

		// Mostra il bottone dopo aver scrollato di 200px
		window.addEventListener('scroll', () => {
			if (window.pageYOffset > 200) {
				backToTop.style.display = 'block';
			} else {
				backToTop.style.display = 'none';
			}
		});

		// Scroll dolce verso l'alto al click
		backToTop.addEventListener('click', () => {
			window.scrollTo({top: 0, behavior: 'smooth'});
		});
})();
