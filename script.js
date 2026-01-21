// --------------------------------------------------
// STATE
// --------------------------------------------------

const STORAGE_KEY = 'customShortcuts';
let shortcuts = [];
let mode = 'normal'; // "normal" | "edit" | "delete"
let activeCategory = 'All';
let currentSortMode = 'alpha'; // "alpha" | "freq"



// --------------------------------------------------
// CLOCK, DATE, TEMPERATURE
// --------------------------------------------------

function updateClock() {
  const clock = document.getElementById('clock');
  if (!clock) return;

  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12;
  clock.textContent = `${hours}:${minutes}${ampm}`;
}

function updateDate() {
  const dateEl = document.getElementById('dateDisplay');
  if (!dateEl) return;

  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function updateTemperature() {
  const tempEl = document.getElementById('tempDisplay');
  if (!tempEl) return;

  tempEl.innerHTML = `
    <div class="temp-value">
      <div class="spinner"></div>
    </div>
    <div class="temp-location">East Montpelier, VT</div>
  `;

  const lat = 44.2812;
  const lon = -72.5020;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      let tempF = "--";
      if (data && data.current_weather && typeof data.current_weather.temperature === 'number') {
        tempF = Math.round((data.current_weather.temperature * 9 / 5) + 32);
      }

      tempEl.innerHTML = `
        <div class="temp-value">${tempF}°F</div>
        <div class="temp-location">East Montpelier, VT</div>
      `;
    })
    .catch(() => {
      tempEl.innerHTML = `
        <div class="temp-value">--°F</div>
        <div class="temp-location">--</div>
      `;
    });
}



// --------------------------------------------------
// STORAGE: LOAD, SAVE
// --------------------------------------------------

function loadShortcuts() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      shortcuts = JSON.parse(saved) || [];
    } catch {
      shortcuts = [];
    }
  }

  if (!shortcuts || shortcuts.length === 0) {
    shortcuts = [
      { name: "Amazon", url: "https://www.amazon.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=amazon.com", category: "Shopping", clicks: 0 },
      { name: "Co-Pilot", url: "https://copilot.microsoft.com/chats/G2Ujy9vDzVNegQ4U5ZnSm", icon: "https://www.google.com/s2/favicons?sz=128&domain=copilot.microsoft.com", category: "AI", clicks: 0 },
      { name: "YouTube", url: "https://www.youtube.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com", category: "Entertainment", clicks: 0 }
    ];
    saveShortcuts();
  }

  shortcuts.forEach(s => {
    if (typeof s.clicks !== 'number') s.clicks = 0;
  });
}

function saveShortcuts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}



// --------------------------------------------------
// URL VALIDATION & FAVICON
// --------------------------------------------------

function validateAndPrepareUrl(rawUrl) {
  let url = rawUrl.trim();

  if (!url) {
    return { success: false, message: "Please enter a URL." };
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    return {
      success: false,
      message: "The URL you entered doesn't seem valid. Please check it."
    };
  }

  if (domain !== "localhost" && !domain.includes(".")) {
    return {
      success: false,
      message: "That URL doesn't appear to be valid. Please enter a full website address like example.com."
    };
  }

  return { success: true, url, domain };
}

function buildFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}



// --------------------------------------------------
// GENERIC SAVE HANDLER FOR SHORTCUTS
// --------------------------------------------------

function saveShortcutFromInputs(index, titleInputId, urlInputId, categoryInputId) {
  const nameInput = document.getElementById(titleInputId);
  const urlInput = document.getElementById(urlInputId);
  const categoryInput = document.getElementById(categoryInputId);

  if (!nameInput || !urlInput || !categoryInput) {
    alert("Something went wrong — the input fields weren't found.");
    return;
  }

  const name = nameInput.value.trim();
  const rawUrl = urlInput.value.trim();
  let category = categoryInput.value.trim();

  if (!name || !rawUrl) {
    alert("Please enter both a Title and a URL.");
    return;
  }

  const result = validateAndPrepareUrl(rawUrl);
  if (!result.success) {
    alert(result.message);
    return;
  }

  const { url, domain } = result;
  const icon = buildFaviconUrl(domain);

  if (index === null || index === undefined) {
    shortcuts.push({ name, url, icon, category, clicks: 0 });
  } else {
    shortcuts[index].name = name;
    shortcuts[index].url = url;
    shortcuts[index].icon = icon;
    shortcuts[index].category = category;
    // Preservation of clicks happens here as we only update specific fields
  }

  saveShortcuts();
  
  renderCategoryPills();
  renderShortcuts();
  closeAllModals();
}



// --------------------------------------------------
// RENDER CATEGORY PILLS
// --------------------------------------------------

function renderCategoryPills() {
  const nav = document.getElementById('categoryNav');
  if (!nav) return;

  const uniqueCategories = [...new Set(shortcuts.map(s => s.category))].sort((a, b) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  
  const allCategories = ['All', ...uniqueCategories];

  nav.innerHTML = '';
  allCategories.forEach(cat => {
    const pill = document.createElement('button');
    pill.className = `category-pill ${activeCategory === cat ? 'active' : ''}`;
    pill.textContent = cat;
    pill.onclick = () => {
      activeCategory = cat;
      renderCategoryPills();
      renderShortcuts();
    };
    nav.appendChild(pill);
  });
}



// --------------------------------------------------
// RENDER SHORTCUTS
// --------------------------------------------------

function handleSortChange(val) {
  currentSortMode = val;
  renderShortcuts();
}

function renderShortcuts() {
  const container = document.getElementById('shortcutContainer');
  if (!container) return;

  container.innerHTML = '';

  let itemsToRender = shortcuts.map((item, idx) => ({ ...item, originalIndex: idx }));

  if (activeCategory !== 'All') {
    itemsToRender = itemsToRender.filter(s => s.category === activeCategory);
  }

  if (currentSortMode === 'freq') {
    itemsToRender.sort((a, b) => {
      if (b.clicks !== a.clicks) {
        return (b.clicks || 0) - (a.clicks || 0);
      }
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  } else {
    itemsToRender.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }

  itemsToRender.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'shortcut';

    const badgeHtml = currentSortMode === 'freq' 
      ? `<div class="click-badge">${item.clicks || 0}</div>` 
      : '';

    if (mode === 'edit') {
      wrapper.innerHTML = `
        <div class="edit-pencil">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
          </svg>
        </div>
        <a class="shortcut-link" href="javascript:void(0);">
          <div class="shortcut-icon">
            <img src="${item.icon}" alt="${item.name}">
            ${badgeHtml}
          </div>
          <div class="shortcut-label">${item.name}</div>
        </a>
      `;

      wrapper.addEventListener('click', () => openEditIconModal(item.originalIndex));
      container.appendChild(wrapper);
      return;
    }

    if (mode === 'delete') {
      wrapper.innerHTML = `
        <div class="delete-x">X</div>
        <a class="shortcut-link" href="javascript:void(0);">
          <div class="shortcut-icon">
            <img src="${item.icon}" alt="${item.name}">
            ${badgeHtml}
          </div>
          <div class="shortcut-label">${item.name}</div>
        </a>
      `;

      const deleteBadge = wrapper.querySelector('.delete-x');
      deleteBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete(item.originalIndex);
      });

      container.appendChild(wrapper);
      return;
    }

    wrapper.innerHTML = `
      <a class="shortcut-link" href="javascript:void(0);">
        <div class="shortcut-icon">
          <img src="${item.icon}" alt="${item.name}">
          ${badgeHtml}
        </div>
        <div class="shortcut-label">${item.name}</div>
      </a>
    `;

    wrapper.addEventListener('click', () => {
      const liveItem = shortcuts[item.originalIndex];
      liveItem.clicks = (liveItem.clicks || 0) + 1;
      saveShortcuts();
      
      if (currentSortMode === 'freq') {
        renderShortcuts();
      }
      window.open(item.url, "_blank");
    });

    wrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openEditModal(item.originalIndex);
    });

    container.appendChild(wrapper);
  });
}



// --------------------------------------------------
// BOTTOM BAR
// --------------------------------------------------

function renderBottomBar() {
  const bar = document.getElementById('bottomBar');
  if (!bar) return;

  if (mode === 'edit' || mode === 'delete') {
    bar.innerHTML = `<button id="doneButton" onclick="exitModes()">DONE</button>`;
    return;
  }

  bar.innerHTML = `
    <button class="bottom-button add-button" aria-label="Add Shortcut" onclick="openNewShortcutModal()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>
      </svg>
    </button>
    <button class="bottom-button edit-button" aria-label="Edit Shortcuts" onclick="enterEditMode()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </button>
    <button class="bottom-button delete-button" aria-label="Delete Shortcuts" onclick="enterDeleteMode()">
      <svg viewBox="0 0 24 24">
        <path fill="#ffffff" d="M3 6h18v2H3V6zm2 3h14l-1.5 12.5c-.1.8-.8 1.5-1.6 1.5H8.1c-.8 0-1.5-.7-1.6-1.5L5 9zm5 2v9h2v-9H8zm4 0v9h2v-9h-2zM9 4V2h6v2h5v2H4V4h5z"/>
      </svg>
    </button>
  `;
}



// --------------------------------------------------
// MODE CONTROL
// --------------------------------------------------

function enterDeleteMode() {
  mode = 'delete';
  renderShortcuts();
  renderBottomBar();
}

function enterEditMode() {
  mode = 'edit';
  renderShortcuts();
  renderBottomBar();
}

function exitModes() {
  mode = 'normal';
  renderShortcuts();
  renderBottomBar();
}



// --------------------------------------------------
// DELETE CONFIRMATION
// --------------------------------------------------

function confirmDelete(index) {
  const item = shortcuts[index];
  const { modal } = createModalShell();

  modal.innerHTML = `
    <h3>Delete Shortcut</h3>
    <p>Are you sure you want to delete "<strong>${item.name}</strong>"?</p>
    <div class="modal-buttons">
      <button onclick="performDelete(${index})" class="danger">Delete</button>
      <button onclick="closeAllModals()">Cancel</button>
    </div>
  `;
}

function performDelete(index) {
  deleteShortcut(index);
  renderCategoryPills();
  renderShortcuts();
  closeAllModals();
}

function deleteShortcut(index) {
  shortcuts.splice(index, 1);
  saveShortcuts();
}



// --------------------------------------------------
// MODAL HELPERS
// --------------------------------------------------

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
}

function createModalShell() {
  closeAllModals();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('mousedown', () => backdrop.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.addEventListener('mousedown', e => e.stopPropagation());

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  return { backdrop, modal };
}

function getCategoryDataList() {
  const uniqueCategories = [...new Set(shortcuts.map(s => s.category))].sort();
  let options = '';
  uniqueCategories.forEach(cat => {
    options += `<option value="${cat}">`;
  });
  return `<datalist id="categoryList">${options}</datalist>`;
}



// --------------------------------------------------
// EDIT MODALS
// --------------------------------------------------

function openEditIconModal(index) {
  const item = shortcuts[index];
  const { modal } = createModalShell();

  modal.innerHTML = `
    <h3>Edit Shortcut</h3>
    <label>Title:</label>
    <input type="text" id="editIconTitle" value="${item.name}">
    <label>URL:</label>
    <input type="text" id="editIconURL" value="${item.url}">
    <label>Category:</label>
    <input type="text" id="editIconCategory" value="${item.category || ''}" list="categoryList">
    ${getCategoryDataList()}
    <div class="modal-buttons">
      <button onclick="saveEditIcon(${index})">Save</button>
      <button onclick="closeAllModals()">Cancel</button>
    </div>
  `;
}

function openEditModal(index) {
  const item = shortcuts[index];
  const { modal } = createModalShell();

  modal.innerHTML = `
    <h3>Edit Shortcut</h3>
    <label>Title:</label>
    <input type="text" id="editTitle" value="${item.name}">
    <label>URL:</label>
    <input type="text" id="editURL" value="${item.url}">
    <label>Category:</label>
    <input type="text" id="editCategory" value="${item.category || ''}" list="categoryList">
    ${getCategoryDataList()}
    <div class="modal-buttons">
      <button onclick="saveEdit(${index})">Save</button>
      <button onclick="deleteShortcutAndRefresh(${index})" class="danger">Delete</button>
    </div>
  `;
}

function deleteShortcutAndRefresh(index) {
  deleteShortcut(index);
  renderCategoryPills();
  renderShortcuts();
  closeAllModals();
}



// --------------------------------------------------
// NEW SHORTCUT MODAL
// --------------------------------------------------

function openNewShortcutModal() {
  const { modal } = createModalShell();

  modal.innerHTML = `
    <h3>New Shortcut</h3>
    <label>Title:</label>
    <input type="text" id="newTitle">
    <label>URL:</label>
    <input type="text" id="newURL">
    <label>Category:</label>
    <input type="text" id="newCategory" placeholder="e.g. Games, Finance" list="categoryList">
    ${getCategoryDataList()}
    <div class="modal-buttons">
      <button onclick="saveNewShortcut()">Save</button>
      <button onclick="closeAllModals()">Cancel</button>
    </div>
  `;
}



// --------------------------------------------------
// PUBLIC SAVE WRAPPERS
// --------------------------------------------------

function saveNewShortcut() {
  saveShortcutFromInputs(null, 'newTitle', 'newURL', 'newCategory');
}

function saveEdit(index) {
  saveShortcutFromInputs(index, 'editTitle', 'editURL', 'editCategory');
}

function saveEditIcon(index) {
  saveShortcutFromInputs(index, 'editIconTitle', 'editIconURL', 'editIconCategory');
}



// --------------------------------------------------
// GOOGLE SEARCH HANDLERS
// --------------------------------------------------

function setupSearchHandlers() {
  const searchButton = document.getElementById('searchButton');
  const searchBar = document.getElementById('searchBar');

  if (!searchButton || !searchBar) return;

  function runSearch() {
    const query = searchBar.value.trim();
    if (query) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  }

  searchButton.addEventListener('click', runSearch);

  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      runSearch();
    }
  });
}



// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------

function initialize() {
  updateClock();
  setInterval(updateClock, 1000);

  updateDate();
  setInterval(updateDate, 60000);

  updateTemperature();
  setInterval(updateTemperature, 600000);

  loadShortcuts();
  renderCategoryPills();
  renderShortcuts();
  renderBottomBar();
  setupSearchHandlers();
}

document.addEventListener('DOMContentLoaded', initialize);