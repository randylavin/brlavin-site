const storageKey = 'customShortcuts';
let shortcuts = [];

function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  clock.textContent = `${hours}:${minutes}${ampm}`;
}

// Update immediately, then every second
updateClock();
setInterval(updateClock, 1000);

function updateDate() {
  const dateEl = document.getElementById('dateDisplay');
  const now = new Date();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const day = now.getDate();

  dateEl.textContent = `${dayName}, ${monthName} ${day}`;
}

// Update immediately, then once per minute
updateDate();
setInterval(updateDate, 60000);

function updateTemperature() {
  const tempEl = document.getElementById('tempDisplay');

  // Fallback ZIP coordinates (05651 - East Montpelier, VT)
  const fallbackLat = 44.2653;
  const fallbackLon = -72.5015;

  function fetchWeather(lat, lon) {
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const reverseGeoURL = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`;

    // Fetch weather
    fetch(weatherURL)
      .then(response => response.json())
      .then(weatherData => {
        let tempF = "--";
        if (weatherData && weatherData.current_weather) {
          tempF = Math.round((weatherData.current_weather.temperature * 9/5) + 32);
        }

        // Fetch location name
        fetch(reverseGeoURL)
          .then(response => response.json())
          .then(geoData => {
            let locationName = "Unknown";

if (geoData && geoData.results && geoData.results.length > 0) {
  const place = geoData.results[0];

  locationName =
    place.name ||
    place.city ||
    place.town ||
    place.village ||
    place.locality ||
    place.municipality ||
    place.county ||
    place.region ||
    place.state ||
    place.postcode ||
    "Unknown";
}


            tempEl.innerHTML = `
              <div class="tempValue">${tempF}°F</div>
              <div class="tempLocation">${locationName}</div>
            `;
          })
          .catch(() => {
            tempEl.innerHTML = `
              <div class="tempValue">${tempF}°F</div>
              <div class="tempLocation">Unknown</div>
            `;
          });
      })
      .catch(() => {
        tempEl.innerHTML = `
          <div class="tempValue">--°F</div>
          <div class="tempLocation">Unknown</div>
        `;
      });
  }

  // Try real-time location first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeather(lat, lon);
      },
      () => {
        // Permission denied or unavailable → fallback
        fetchWeather(fallbackLat, fallbackLon);
      },
      { timeout: 5000 }
    );
  } else {
    // Geolocation not supported → fallback
    fetchWeather(fallbackLat, fallbackLon);
  }
}

// Update immediately, then every 10 minutes
updateTemperature();
setInterval(updateTemperature, 600000);


// Update immediately, then every 10 minutes
updateTemperature();
setInterval(updateTemperature, 600000);


function loadShortcuts() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      shortcuts = JSON.parse(saved);
    } catch {
      shortcuts = [];
    }
  } else {
    shortcuts = [
      { name: "Amazon", url: "https://www.amazon.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=amazon.com" },
      { name: "Amtrak", url: "https://www.amtrak.com/track-your-train.html", icon: "https://www.google.com/s2/favicons?sz=128&domain=amtrak.com" },
      { name: "Bubble Shooter", url: "https://www.bubbleshooter.net/", icon: "https://www.google.com/s2/favicons?sz=128&domain=bubbleshooter.net" },
      { name: "East Rise", url: "https://www.eastrise.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=eastrise.com" },
      { name: "E-Bay", url: "https://www.ebay.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=ebay.com" },
      { name: "Escape Games", url: "https://www.crazygames.com/t/escape", icon: "https://www.google.com/s2/favicons?sz=128&domain=crazygames.com" },
      { name: "NCFCU", url: "https://www.northcountry.org/", icon: "https://www.google.com/s2/favicons?sz=128&domain=northcountry.org" },
      { name: "Rob's Shares", url: "https://onedrive.live.com/?authkey=%21AvSZMVUefKbWWBA&id=root&cid=B0F830816A5AE0B8&qt=sharedby", icon: "https://www.google.com/s2/favicons?sz=128&domain=onedrive.live.com" },
      { name: "Sudoku", url: "https://sudoku.game/", icon: "https://www.google.com/s2/favicons?sz=128&domain=sudoku.game" },
      { name: "YouTube", url: "https://www.youtube.com/", icon: "https://www.google.com/s2/favicons?sz=128&domain=youtube.com" },
      { name: "Co-Pilot", url: "https://copilot.microsoft.com/chats/G2Ujy9vDzVNegQ4U5ZnSm", icon: "https://www.google.com/s2/favicons?sz=128&domain=copilot.microsoft.com" }
    ];
    saveShortcuts();
  }
}

function saveShortcuts() {
  localStorage.setItem(storageKey, JSON.stringify(shortcuts));
}

function renderShortcuts() {
  const container = document.getElementById('shortcutContainer');
  container.innerHTML = '';

  shortcuts.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'shortcut';
    div.innerHTML = `
      <a href="${item.url}" class="shortcut-link">
        <div class="shortcut-icon">
          <img src="${item.icon}" alt="${item.name}" />
        </div>
        <div class="shortcut-label">${item.name}</div>
        <button class="shortcut-edit-button" onclick="openEditModal(${index}); event.preventDefault(); event.stopPropagation();">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </button>
      </a>
    `;
    container.appendChild(div);
  });
}

function openEditModal(index) {
  const item = shortcuts[index];

  const backdrop = document.createElement('div');
  backdrop.style.position = "fixed";
  backdrop.style.top = "0";
  backdrop.style.left = "0";
  backdrop.style.width = "100%";
  backdrop.style.height = "100%";
  backdrop.style.background = "rgba(0,0,0,0.4)";
  backdrop.style.zIndex = "9998";

  // Clicking the backdrop closes the modal
  backdrop.addEventListener("click", () => backdrop.remove());

  const modal = document.createElement('div');
  modal.className = "modal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.background = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.zIndex = "9999";
  modal.style.color = "#000";
  modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  modal.style.width = "300px";



  modal.innerHTML = `
    <h3>Edit Shortcut</h3>
    <label>Title:</label><br/>
    <input type="text" id="editTitle" value="${item.name}" style="width:100%; margin-bottom:10px;"><br/>
    <label>URL:</label><br/>
    <input type="text" id="editURL" value="${item.url}" style="width:100%; margin-bottom:20px;"><br/>

    <div style="display:flex; justify-content:space-between;">
      <button onclick="saveEdit(${index})">Save</button>
      <button onclick="deleteShortcut(${index})" style="color:red;">Delete</button>
    </div>
  `;

  // Prevent clicks inside the modal from closing it
  modal.addEventListener("click", (event) => event.stopPropagation());

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

function saveEdit(index) {
  const newTitle = document.getElementById('editTitle').value;
  const newURL = document.getElementById('editURL').value;
  if (newTitle && newURL) {
    const domain = new URL(newURL).hostname;
    const icon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

    shortcuts[index].name = newTitle;
    shortcuts[index].url = newURL;
    shortcuts[index].icon = icon;

    saveShortcuts();
    location.reload();
  }
}

function deleteShortcut(index) {
  if (confirm("Are you sure you want to delete this shortcut?")) {
    shortcuts.splice(index, 1);
    saveShortcuts();
    location.reload();
  }
}

function openNewShortcutModal() {
  // Create the backdrop (covers entire screen)
  const backdrop = document.createElement('div');
  backdrop.style.position = "fixed";
  backdrop.style.top = "0";
  backdrop.style.left = "0";
  backdrop.style.width = "100%";
  backdrop.style.height = "100%";
  backdrop.style.background = "rgba(0,0,0,0.4)";
  backdrop.style.zIndex = "9998";
  backdrop.style.display = "flex";
  backdrop.style.alignItems = "center";
  backdrop.style.justifyContent = "center";

  // Clicking the backdrop closes EVERYTHING
  backdrop.addEventListener("click", () => {
    backdrop.remove();
  });

  // Create the modal
  const modal = document.createElement('div');
  modal.className = "modal";
  modal.style.background = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.zIndex = "9999";
  modal.style.color = "#000";
  modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  modal.style.width = "300px";

  // Prevent clicks inside the modal from closing it
  modal.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  modal.innerHTML = `
    <h3>New Shortcut</h3>
    <label>Title:</label><br/>
    <input type="text" id="newTitle" style="width:100%; margin-bottom:10px;"><br/>
    <label>URL:</label><br/>
    <input type="text" id="newURL" style="width:100%; margin-bottom:20px;"><br/>

    <div style="display:flex; justify-content:space-between;">
      <button id="newShortcutSaveButton">Save</button>
      <button id="newShortcutCancelButton">Cancel</button>
    </div>
  `;

  // Wire up buttons
  const saveButton = modal.querySelector('#newShortcutSaveButton');
  const cancelButton = modal.querySelector('#newShortcutCancelButton');

  saveButton.addEventListener('click', () => {
    saveNewShortcut();    // existing function
    backdrop.remove();    // close modal/backdrop after successful save (optional; you can remove this line if you prefer it stays open on invalid input)
  });

  cancelButton.addEventListener('click', () => {
    backdrop.remove();
  });

  // Add modal to backdrop, then backdrop to body
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}


function saveNewShortcut() {
  const name = document.getElementById('newTitle').value;
  const url = document.getElementById('newURL').value;

  if (name && url) {
    const domain = new URL(url).hostname;
    const icon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

    shortcuts.push({ name, url, icon });
    saveShortcuts();
    location.reload();
  }
}

loadShortcuts();
renderShortcuts();

new Sortable(document.getElementById('shortcutContainer'), {
  animation: 150,
  ghostClass: 'dragging',
  draggable: ".shortcut",
  onEnd: function () {
    const newOrder = Array.from(document.querySelectorAll('.shortcut-link')).map(link => {
      const name = link.querySelector('.shortcut-label').textContent;
      const url = link.getAttribute('href');
      const icon = link.querySelector('img').getAttribute('src');
      return { name, url, icon };
    });
    shortcuts = newOrder;
    saveShortcuts();
  }
});
