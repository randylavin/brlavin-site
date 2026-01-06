const storageKey = 'customShortcuts';
let shortcuts = [];
let deleteMode = false;
let editMode = false;

/* ---------------------- */
/* CLOCK */
/* ---------------------- */
function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;

  clock.textContent = `${hours}:${minutes}${ampm}`;
}

/* ---------------------- */
/* DATE */
/* ---------------------- */
function updateDate() {
  const dateEl = document.getElementById('dateDisplay');
  const now = new Date();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

/* ---------------------- */
/* TEMPERATURE */
/* ---------------------- */
function updateTemperature() {
  const tempEl = document.getElementById('tempDisplay');

  const fallbackLat = 44.2653;
  const fallbackLon = -72.5015;

  function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        let tempF = "--";
        if (data && data.current_weather) {
          tempF = Math.round((data.current_weather.temperature * 9/5) + 32);
        }

        tempEl.innerHTML = `
          <div class="tempValue">${tempF}°F</div>
          <div class="tempLocation">Local Temp</div>
        `;
      })
      .catch(() => {
        tempEl.innerHTML = `
          <div class="tempValue">--°F</div>
          <div class="tempLocation">Local Temp</div>
        `;
      });
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(fallbackLat, fallbackLon),
      { timeout: 5000 }
    );
  } else {
    fetchWeather(fallbackLat, fallbackLon);
  }
}

document.getElementById('searchButton').addEventListener('click', () => {
  const query = document.getElementById('searchBar').value.trim();
  if (query) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  }
});

/* ---------------------- */
/* SORTING */
/* ---------------------- */
function sortShortcuts() {
  shortcuts.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}

/* ---------------------- */
/* LOAD / SAVE */
/* ---------------------- */
function loadShortcuts() {
  const saved = localStorage.getItem(storageKey);

  if (saved) {
    shortcuts = JSON.parse(saved);
  } else {
    shortcuts = [
      { name: "Amazon", url: "https://www.amazon.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=amazon.com" },
      { name: "Co-Pilot", url: "https://copilot.microsoft.com/chats/G2Ujy9vDzVNegQ4U5ZnSm", icon: "https://www.google.com/s2/favicons?sz=128&domain=copilot.microsoft.com" },
      { name: "YouTube", url: "https://www.youtube.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com" }
    ];
    saveShortcuts();
  }

  sortShortcuts();
}

function saveShortcuts() {
  localStorage.setItem(storageKey, JSON.stringify(shortcuts));
}

/* ---------------------- */
/* RENDER SHORTCUTS */
/* ---------------------- */
function renderShortcuts() {
  const container = document.getElementById('shortcutContainer');
  container.innerHTML = '';

  shortcuts.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'shortcut';
    div.style.position = "relative";

    /* ---------------------- */
    /* EDIT MODE */
    /* ---------------------- */
    if (editMode) {
      div.addEventListener("click", () => openEditIconModal(index));

      div.innerHTML = `
        <div class="edit-pencil">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
          </svg>
        </div>
        <div class="shortcut-link">
          <div class="shortcut-icon">
            <img src="${item.icon}" alt="${item.name}">
          </div>
          <div class="shortcut-label">${item.name}</div>
        </div>
      `;
      container.appendChild(div);
      return;
    }

    /* ---------------------- */
    /* DELETE MODE */
    /* ---------------------- */
    if (deleteMode) {
      div.addEventListener("click", () => {
        shortcuts.splice(index, 1);
        sortShortcuts();
        saveShortcuts();
        renderShortcuts();
      });

      div.innerHTML = `
        <div class="delete-x">X</div>
        <div class="shortcut-link">
          <div class="shortcut-icon">
            <img src="${item.icon}" alt="${item.name}">
          </div>
          <div class="shortcut-label">${item.name}</div>
        </div>
      `;
      container.appendChild(div);
      return;
    }

    /* ---------------------- */
    /* NORMAL MODE */
    /* ---------------------- */
    div.innerHTML = `
      <a href="${item.url}" class="shortcut-link" onclick="event.stopPropagation()">
        <div class="shortcut-icon">
          <img src="${item.icon}" alt="${item.name}">
        </div>
        <div class="shortcut-label">${item.name}</div>
      </a>
    `;

    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openEditModal(index);
    });

    container.appendChild(div);
  });
}

/* ---------------------- */
/* BOTTOM BAR */
/* ---------------------- */
function renderBottomBar() {
  const bar = document.getElementById('bottomBar');

  if (deleteMode || editMode) {
    bar.innerHTML = `<button id="doneButton" onclick="exitModes()">DONE</button>`;
    return;
  }

  bar.innerHTML = `
    <button class="add-shortcut-button" onclick="openNewShortcutModal()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>
      </svg>
    </button>

    <button class="edit-shortcut-button" onclick="enterEditMode()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </button>

    <button class="delete-shortcut-button" onclick="enterDeleteMode()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v9h2v-9H8zm4 0v9h2v-9h-2zM9 4V2h6v2h5v2H4V4h5z"/>
      </svg>
    </button>
  `;
}

/* ---------------------- */
/* DELETE MODE */
/* ---------------------- */
function enterDeleteMode() {
  deleteMode = true;
  editMode = false;
  renderShortcuts();
  renderBottomBar();
}

/* ---------------------- */
/* EDIT MODE */
/* ---------------------- */
function enterEditMode() {
  editMode = true;
  deleteMode = false;
  renderShortcuts();
  renderBottomBar();
}

function exitModes() {
  editMode = false;
  deleteMode = false;
  renderShortcuts();
  renderBottomBar();
}

/* ---------------------- */
/* MODAL HELPERS */
/* ---------------------- */
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
}

/* ---------------------- */
/* EDIT ICON MODAL */
/* ---------------------- */
function openEditIconModal(index) {
  const item = shortcuts[index];

  const backdrop = document.createElement('div');
  backdrop.className = "modal-backdrop";
  backdrop.addEventListener("click", () => backdrop.remove());

  const modal = document.createElement('div');
  modal.className = "modal";
  modal.addEventListener("click", e => e.stopPropagation());

  modal.innerHTML = `
    <h3>Edit Shortcut</h3>
    <label>Title:</label><br>
    <input type="text" id="editIconTitle" value="${item.name}" style="width:100%; margin-bottom:10px;"><br>
    <label>URL:</label><br>
    <input type="text" id="editIconURL" value="${item.url}" style="width:100%; margin-bottom:20px;"><br>

    <div style="display:flex; justify-content:space-between;">
      <button onclick="saveEditIcon(${index})">Save</button>
      <button onclick="closeAllModals()">Cancel</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

/* ---------------------- */
/* RIGHT-CLICK EDIT MODAL */
/* ---------------------- */
function openEditModal(index) {
  const item = shortcuts[index];

  const backdrop = document.createElement('div');
  backdrop.className = "modal-backdrop";
  backdrop.addEventListener("click", () => backdrop.remove());

  const modal = document.createElement('div');
  modal.className = "modal";
  modal.addEventListener("click", e => e.stopPropagation());

  modal.innerHTML = `
    <h3>Edit Shortcut</h3>
    <label>Title:</label><br>
    <input type="text" id="editTitle" value="${item.name}" style="width:100%; margin-bottom:10px;"><br>
    <label>URL:</label><br>
    <input type="text" id="editURL" value="${item.url}" style="width:100%; margin-bottom:20px;"><br>

    <div style="display:flex; justify-content:space-between;">
      <button onclick="saveEdit(${index})">Save</button>
      <button onclick="deleteShortcut(${index})" style="color:red;">Delete</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

/* ---------------------- */
/* DELETE SHORTCUT */
/* ---------------------- */
function deleteShortcut(index) {
  shortcuts.splice(index, 1);
  sortShortcuts();
  saveShortcuts();
  renderShortcuts();
  closeAllModals();
}

/* ---------------------- */
/* NEW SHORTCUT MODAL */
/* ---------------------- */
function openNewShortcutModal() {
  const backdrop = document.createElement('div');
  backdrop.className = "modal-backdrop";
  backdrop.addEventListener("click", () => backdrop.remove());

  const modal = document.createElement('div');
  modal.className = "modal";
  modal.addEventListener("click", e => e.stopPropagation());

  modal.innerHTML = `
    <h3>New Shortcut</h3>
    <label>Title:</label><br>
    <input type="text" id="newTitle" style="width:100%; margin-bottom:10px;"><br>
    <label>URL:</label><br>
    <input type="text" id="newURL" style="width:100%; margin-bottom:20px;"><br>

    <div style="display:flex; justify-content:space-between;">
      <button onclick="saveNewShortcut()">Save</button>
      <button onclick="closeAllModals()">Cancel</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

/* ---------------------- */
/* NEW SHORTCUT SAVE (with validation) */
/* ---------------------- */
function saveNewShortcut() {
  const nameInput = document.getElementById('newTitle');
  const urlInput  = document.getElementById('newURL');

  if (!nameInput || !urlInput) {
    alert("Something went wrong — the input fields weren't found.");
    return;
  }

  const name = nameInput.value.trim();
  let url    = urlInput.value.trim();

  if (!name || !url) {
    alert("Please enter both a Title and a URL.");
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    alert("The URL you entered doesn't seem valid. Please check it.");
    return;
  }

  if (domain !== "localhost" && !domain.includes(".")) {
    alert("That URL doesn't appear to be valid. Please enter a full website address like example.com.");
    return;
  }

  const icon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  shortcuts.push({ name, url, icon });

  sortShortcuts();
  saveShortcuts();
  renderShortcuts();
  closeAllModals();
}

/* ---------------------- */
/* EDIT SHORTCUT SAVE (right‑click modal) */
/* ---------------------- */
function saveEdit(index) {
  const newTitle = document.getElementById('editTitle').value.trim();
  let newURL     = document.getElementById('editURL').value.trim();

  if (!newTitle || !newURL) {
    alert("Please enter both a Title and a URL.");
    return;
  }

  if (!/^https?:\/\//i.test(newURL)) {
    newURL = "https://" + newURL;
  }

  let domain = "";
  try {
    domain = new URL(newURL).hostname;
  } catch (e) {
    alert("The URL you entered doesn't seem valid. Please check it.");
    return;
  }

  if (domain !== "localhost" && !domain.includes(".")) {
    alert("That URL doesn't appear to be valid. Please enter a full website address like example.com.");
    return;
  }

  const icon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  shortcuts[index].name = newTitle;
  shortcuts[index].url  = newURL;
  shortcuts[index].icon = icon;

  sortShortcuts();
  saveShortcuts();
  renderShortcuts();
  closeAllModals();
}

/* ---------------------- */
/* EDIT ICON SAVE (edit‑mode pencil modal) */
/* ---------------------- */
function saveEditIcon(index) {
  const newTitle = document.getElementById('editIconTitle').value.trim();
  let newURL     = document.getElementById('editIconURL').value.trim();

  if (!newTitle || !newURL) {
    alert("Please enter both a Title and a URL.");
    return;
  }

  if (!/^https?:\/\//i.test(newURL)) {
    newURL = "https://" + newURL;
  }

  let domain = "";
  try {
    domain = new URL(newURL).hostname;
  } catch (e) {
    alert("The URL you entered doesn't seem valid. Please check it.");
    return;
  }

  if (domain !== "localhost" && !domain.includes(".")) {
    alert("That URL doesn't appear to be valid. Please enter a full website address like example.com.");
    return;
  }

  const icon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  shortcuts[index].name = newTitle;
  shortcuts[index].url  = newURL;
  shortcuts[index].icon = icon;

  sortShortcuts();
  saveShortcuts();
  renderShortcuts();
  closeAllModals();
}

/* ---------------------- */
/* INITIALIZE */
/* ---------------------- */
updateClock();
setInterval(updateClock, 1000);

updateDate();
setInterval(updateDate, 60000);

updateTemperature();
setInterval(updateTemperature, 600000);

loadShortcuts();
renderShortcuts();
renderBottomBar();
