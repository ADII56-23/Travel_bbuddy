// ===== Travel Recommendation App =====

// State variables for saving trips
let currentPkgInfo = null;
let currentPkgImage = '';
let savedTrips = JSON.parse(localStorage.getItem('travelBuddySavedTrips')) || [];

const selectedInterests = new Set();

// Interest tag toggle
document.addEventListener('click', (e) => {
  const tag = e.target.closest('.interest-tag');
  if (!tag) return;

  const value = tag.dataset.value;
  if (selectedInterests.has(value)) {
    selectedInterests.delete(value);
    tag.classList.remove('selected');
  } else {
    selectedInterests.add(value);
    tag.classList.add('selected');
  }
});

// Mobile Menu Toggle
function toggleMobileMenu() {
  const nav = document.getElementById('header-nav');
  const toggle = document.getElementById('mobile-toggle');
  if (nav && toggle) {
    nav.classList.toggle('active');
    toggle.classList.toggle('open');

    // Disable scrolling when menu is open
    if (nav.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

// Close menu when clicking on a link
document.addEventListener('click', (e) => {
  if (e.target.closest('#header-nav a')) {
    const nav = document.getElementById('header-nav');
    const toggle = document.getElementById('mobile-toggle');
    if (nav && nav.classList.contains('active')) {
      nav.classList.remove('active');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // Close menu when clicking outside
  const nav = document.getElementById('header-nav');
  const toggle = document.getElementById('mobile-toggle');
  if (nav && nav.classList.contains('active') && !e.target.closest('#header-nav') && !e.target.closest('#mobile-toggle')) {
    nav.classList.remove('active');
    toggle.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Update the initial saved counter and header scroll
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('saved-count')) {
    updateSavedCount();
  }

  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  // Handle URL parameters for search (dest=...)
  const urlParams = new URLSearchParams(window.location.search);
  const urlDest = urlParams.get('dest');
  if (urlDest && document.getElementById('dest')) {
    document.getElementById('dest').value = urlDest;
    // Delay slightly to ensure everything is ready
    setTimeout(() => {
      quickSearch(urlDest);
    }, 500);
  }
});

// Form submission
const searchForm = document.getElementById('search-form');
if (searchForm) {
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dest = document.getElementById('dest').value.trim();
    const duration = parseInt(document.getElementById('duration').value) || 7;
    const budget = parseFloat(document.getElementById('budget').value) || 100000;

    if (!dest) return;

    const btn = document.getElementById('btn-search');
    const container = document.getElementById('cards');
    const spinner = document.getElementById('spinner');

    // Show loading
    btn.disabled = true;
    btn.textContent = 'Searching…';
    container.innerHTML = '';
    spinner.classList.add('visible');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          duration: duration,
          budget: budget,
          interests: Array.from(selectedInterests).join(' '),
          top_n: 6
        })
      });

      const data = await res.json();
      spinner.classList.remove('visible');

      if (data.error) {
        showMessage('error', 'Something went wrong', data.error);
      } else if (data.length === 0) {
        showMessage('empty', 'No packages found', 'Try increasing your budget or changing the destination.');
      } else {
        renderCards(data);
      }
    } catch (err) {
      spinner.classList.remove('visible');
      showMessage('error', 'Connection failed', 'Please check if the server is running.');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 Find Trips';
    }
  });
}

// Quick Search from trending tags
window.quickSearch = (dest) => {
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    document.getElementById('dest').value = dest;
    const destOption = Array.from(document.getElementById('dest-list').options).find(opt => opt.value.toLowerCase() === dest.toLowerCase());
    const event = new Event('submit', { cancelable: true, bubbles: true });
    searchForm.dispatchEvent(event);
  }
};

// Destination theme map — gradient + emoji for each destination
const DEST_THEMES = {
  // Indian destinations
  'goa': { gradient: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', emoji: '🏖️', icon: '🌊' },
  'manali': { gradient: 'linear-gradient(135deg, #e6dada 0%, #274046 100%)', emoji: '🏔️', icon: '🎿' },
  'jaipur': { gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', emoji: '🏰', icon: '🐪' },
  'kerala': { gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', emoji: '🌴', icon: '🛶' },
  'ladakh': { gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', emoji: '🏔️', icon: '🏍️' },
  'varanasi': { gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', emoji: '🕉️', icon: '🪔' },
  'andaman': { gradient: 'linear-gradient(135deg, #0575e6 0%, #021b79 100%)', emoji: '🏝️', icon: '🤿' },
  'rishikesh': { gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', emoji: '🧘', icon: '🏞️' },
  'udaipur': { gradient: 'linear-gradient(135deg, #ec6f66 0%, #f3a183 100%)', emoji: '🏯', icon: '⛵' },
  'shimla': { gradient: 'linear-gradient(135deg, #649173 0%, #dbd5a4 100%)', emoji: '🚂', icon: '🍎' },
  // International destinations
  'japan': { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)', emoji: '🗾', icon: '⛩️' },
  'switzerland': { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', emoji: '🇨🇭', icon: '🧀' },
  'hawaii': { gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', emoji: '🌺', icon: '🏄' },
  'france': { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', emoji: '🇫🇷', icon: '🗼' },
  'kenya': { gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', emoji: '🌍', icon: '🦁' },
  'italy': { gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)', emoji: '🇮🇹', icon: '🍕' },
  'iceland': { gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', emoji: '🧊', icon: '🌋' },
  'thailand': { gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', emoji: '🇹🇭', icon: '🛕' },
  'australia': { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', emoji: '🦘', icon: '🏖️' },
  'brazil': { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', emoji: '🇧🇷', icon: '🎉' },
  'turkey': { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', emoji: '🇹🇷', icon: '🕌' },
  'bali': { gradient: 'linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)', emoji: '🇮🇩', icon: '🏝️' },
  'bhutan': { gradient: 'linear-gradient(135deg, #fec163 0%, #de4313 100%)', emoji: '🇧🇹', icon: '🕍' },
};
const DEFAULT_THEME = { gradient: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)', emoji: '🌎', icon: '✈️' };

// Destination Coordinates for Map Integration
const DEST_COORDS = {
  'goa': [15.2993, 74.1240],
  'manali': [32.2432, 77.1892],
  'jaipur': [26.9124, 75.7873],
  'kerala': [10.8505, 76.2711],
  'ladakh': [34.1526, 77.5771],
  'varanasi': [25.3176, 82.9739],
  'andaman': [11.7401, 92.6586],
  'rishikesh': [30.0869, 78.2676],
  'udaipur': [24.5854, 73.7125],
  'shimla': [31.1048, 77.1734],
  'japan': [36.2048, 138.2529],
  'switzerland': [46.8182, 8.2275],
  'hawaii': [21.3069, -157.8583],
  'france': [46.2276, 2.2137],
  'kenya': [-1.2921, 36.8219],
  'italy': [41.8719, 12.5674],
  'iceland': [64.9631, -19.0208],
  'thailand': [15.8700, 100.9925],
  'australia': [-25.2744, 133.7751],
  'brazil': [-14.2350, -51.9253],
  'turkey': [38.9637, 35.2433],
  'bali': [-8.4095, 115.1889],
  'bhutan': [27.5142, 90.4336],
  'tokyo': [35.6762, 139.6503],
  'paris': [48.8566, 2.3522],
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'dubai': [25.2048, 55.2708],
  'singapore': [1.3521, 103.8198],
  'sydney': [-33.8688, 151.2093],
  'bangkok': [13.7563, 100.5018],
  'rome': [41.9028, 12.4964],
  'amsterdam': [52.3676, 4.9041],
  'berlin': [52.5200, 13.4050],
  'madrid': [40.4168, -3.7038],
  'egypt': [26.8206, 30.8025],
  'maldives': [3.2028, 73.2207],
  'vietnam': [14.0583, 108.2772]
};

let leafletMap = null; 
let googleMap = null;
let detailMap = null; 
let mapMarkers = [];
let mapLines = [];
let placesService = null;
let currentSearchResults = [];

// Global handler for Google Maps Auth Failures
window.googleMapsFailed = false;
window.gm_authFailure = function() {
  console.warn("Google Maps Auth Failure - Switching to Leaflet Fallback");
  window.googleMapsFailed = true;
  // If we are looking at a specific view, re-render it
  if (currentPkgInfo) { window.renderDetailMap(currentPkgInfo); }
};

let editState = {
  places: [],
  dates: 'Add trip dates',
  notes: '',
  friends: [],
  budget: []
};

window.switchView = (type) => {
  const list = document.getElementById('saved-page-list');
  const mapCont = document.getElementById('map-container');
  const btns = document.querySelectorAll('.toggle-btn');

  btns.forEach(b => b.classList.remove('active'));

  if (type === 'map') {
    list.style.display = 'none';
    mapCont.style.display = 'block';

    const mapBtn = document.querySelector('button[onclick*="switchView(\'map\')"]');
    if (mapBtn) mapBtn.classList.add('active');

    renderMap(savedTrips.map(t => t.pkg));
  } else {
    list.style.display = 'block';
    mapCont.style.display = 'none';
    const listBtn = document.querySelector('button[onclick*="switchView(\'list\')"]');
    if (listBtn) listBtn.classList.add('active');
  }
};

window.switchExploreView = (type) => {
  const grid = document.getElementById('cards');
  const mapCont = document.getElementById('map-container');
  const btns = document.querySelectorAll('.toggle-btn');

  btns.forEach(b => b.classList.remove('active'));

  if (type === 'map') {
    grid.style.display = 'none';
    mapCont.style.display = 'block';
    const mapBtn = document.querySelector('button[onclick*="switchExploreView(\'map\')"]');
    if (mapBtn) mapBtn.classList.add('active');
    renderMap(currentSearchResults);
  } else {
    grid.style.display = 'grid';
    mapCont.style.display = 'none';
    const listBtn = document.querySelector('button[onclick*="switchExploreView(\'list\')"]');
    if (listBtn) listBtn.classList.add('active');
  }
};

function renderMap(data) {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;

  const isGoogleAvailable = typeof google !== 'undefined' && google.maps && google.maps.Map;

  if (isGoogleAvailable) {
    // GOOGLE MAPS ENGINE
    if (!googleMap) {
      if (leafletMap) { leafletMap.remove(); leafletMap = null; }
      googleMap = new google.maps.Map(mapDiv, {
        center: { lat: 20, lng: 50 },
        zoom: 3,
        mapTypeId: 'terrain'
      });
      placesService = google.maps.places ? new google.maps.places.PlacesService(googleMap) : null;
      
      if (placesService) {
        googleMap.addListener('click', (event) => {
          if (!event.placeId) return;
          event.stop();
          const infoWindow = new google.maps.InfoWindow({ position: event.latLng });
          placesService.getDetails({ placeId: event.placeId }, (place, status) => {
            if (status === 'OK' && place) {
              const reviews = (place.reviews || []).slice(0, 2).map(r => `
                <div style="font-size:11px; margin-top:5px; color:#444;">
                  <strong>${r.author_name} (${r.rating}★)</strong>: "${r.text.substring(0, 50)}..."
                </div>
              `).join('') || '<div style="font-size:11px; color:#999;">No reviews yet</div>';
              infoWindow.setContent(`
                <div style="font-family:Inter,sans-serif; padding:5px; max-width:200px;">
                  <h4 style="margin:0;">${place.name}</h4>
                  <div style="font-weight:700; color:#f59e0b; margin:3px 0;">${place.rating || 'N/A'} ★</div>
                  ${reviews}
                </div>
              `);
              infoWindow.open(googleMap);
            }
          });
        });
      }
    } else {
      mapMarkers.forEach(m => m.setMap && m.setMap(null));
      mapLines.forEach(l => l.setMap && l.setMap(null));
      mapMarkers = [];
      mapLines = [];
    }

    if (!data || data.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const path = [];
    data.forEach((pkg) => {
      const pos = DEST_COORDS[(pkg['Destination'] || '').toLowerCase()];
      if (pos) {
        const latLng = { lat: pos[0], lng: pos[1] };
        path.push(latLng);
        bounds.extend(latLng);
        const marker = new google.maps.Marker({
          position: latLng,
          map: googleMap,
          title: pkg['Package Name'],
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#2563eb', fillOpacity: 0.9, strokeWeight: 2, strokeColor: '#fff' }
        });
        const info = new google.maps.InfoWindow({ content: `<div style="color:#333; padding:5px;"><strong>${pkg['Package Name']}</strong><br>₹${pkg['Price']}</div>` });
        marker.addListener('click', () => info.open(googleMap, marker));
        mapMarkers.push(marker);
      }
    });
    if (path.length > 0) {
      googleMap.fitBounds(bounds);
      if (path.length > 1) {
        const poly = new google.maps.Polyline({ path, geodesic: true, strokeColor: '#0ea5e9', strokeWeight: 3, map: googleMap });
        mapLines.push(poly);
      }
    }
    setTimeout(() => google.maps.event.trigger(googleMap, 'resize'), 300);

  } else {
    // LEAFLET FALLBACK ENGINE
    if (!leafletMap) {
      if (googleMap) { googleMap = null; }
      leafletMap = L.map('map').setView([20, 50], 3);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    } else {
      mapMarkers.forEach(m => m.remove && m.remove());
      mapLines.forEach(l => l.remove && l.remove());
      mapMarkers = [];
      mapLines = [];
    }

    if (!data || data.length === 0) return;
    const latlngs = [];
    data.forEach(pkg => {
      const pos = DEST_COORDS[(pkg['Destination'] || '').toLowerCase()];
      if (pos) {
        const m = L.marker(pos).addTo(leafletMap).bindPopup(`<strong>${pkg['Package Name']}</strong>`);
        mapMarkers.push(m);
        latlngs.push(pos);
      }
    });
    if (latlngs.length > 0) {
      leafletMap.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      if (latlngs.length > 1) {
        const poly = L.polyline(latlngs, { color: '#0ea5e9', weight: 3 }).addTo(leafletMap);
        mapLines.push(poly);
      }
    }
    setTimeout(() => leafletMap.invalidateSize(), 300);
  }
}

function getDestTheme(dest) {
  return DEST_THEMES[(dest || '').toLowerCase()] || DEFAULT_THEME;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getPackageImage(pkg, interests, index) {
  const dest = (pkg['Destination'] || 'travel').toLowerCase();
  const description = (pkg['Package Description'] || '').toLowerCase();

  // Start with destination and travel as primary tags
  let tags = [dest, 'travel'];

  // Try to find a specific keyword from the package details
  const keywords = ['beach', 'mountain', 'trek', 'temple', 'food', 'market', 'nature', 'city', 'resort', 'safari'];
  for (const kw of keywords) {
    if (description.includes(kw)) {
      tags.push(kw);
      break;
    }
  }

  // Add one interest tag if available
  if (interests) {
    const interestArr = interests.split(' ');
    if (interestArr.length > 0) {
      const val = interestArr[0].toLowerCase();
      if (!tags.includes(val)) tags.push(val);
    }
  }

  // Use a unique lock based on package name, price AND its index in current results
  // This ensures variety even if two packages have identical metadata
  const lock = hash(pkg['Package Name'] + pkg['Price']) + index;

  // We'll use 2-3 tags max to avoid over-filtering
  const searchTags = tags.slice(0, 3).join(',');
  return `https://loremflickr.com/800/600/${searchTags}?lock=${lock}`;
}

function renderCards(packages) {
  currentSearchResults = packages;
  const container = document.getElementById('cards');
  const toggle = document.getElementById('explore-view-toggle');

  if (toggle) toggle.style.display = 'flex';
  container.innerHTML = '';

  packages.forEach((pkg, n) => {
    const score = Math.round((pkg['Similarity Score'] || 0) * 100);
    const matchClass = score > 60 ? 'card__match--high' : 'card__match--mid';
    const price = Number(pkg['Price']).toLocaleString('en-IN');
    const dest = pkg['Destination'] || '';
    const theme = getDestTheme(dest);
    const imageUrl = getPackageImage(pkg, Array.from(selectedInterests).join(' '), n);

    const desc = pkg['Package Description'] || '';
    let activityTags = '';
    const match = desc.match(/This package includes (.+)\./i);
    if (match && match[1]) {
      const activities = match[1].split(/, | and | & /i).filter(a => a.trim().length > 0).slice(0, 3);
      activityTags = `<div class="card__activities">${activities.map(a => `<span class="activity-pill">✓ ${a.trim()}</span>`).join('')}</div>`;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${n * 0.08}s`;

    card.innerHTML = `
      <div class="card__image" style="background: url('${imageUrl}') center/cover no-repeat, ${theme.gradient}">
        <span class="card__duration">${pkg['Duration']} Days</span>
      </div>
      <div class="card__body">
        <h3 class="card__name" title="${pkg['Package Name']}">${pkg['Package Name']}</h3>
        <div class="card__meta">
          <span class="card__match ${matchClass}">${score}% Match</span>
          <span class="card__dest">${dest}</span>
        </div>
        ${activityTags}
        <p class="card__desc">${desc}</p>
        <div class="card__footer">
          <div class="card__price-box">
            <span class="card__price-label">PRICE / PERSON</span>
            <span class="card__price">₹${price}</span>
          </div>
          <button class="btn-default" onclick='viewDeal(${JSON.stringify(pkg).replace(/'/g, "&#39;")}, "${imageUrl}")'>View Deal</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function showMessage(type, title, text) {
  const container = document.getElementById('cards');
  const iconClass = type === 'error' ? 'state-msg__icon--error' : 'state-msg__icon--empty';
  const icon = type === 'error' ? '⚠️' : '🗺️';

  container.innerHTML = `
    <div class="state-msg">
      <div class="state-msg__icon ${iconClass}">${icon}</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
}

// Modal control
window.viewDeal = (pkg, imageUrl) => {
  // Set current package state for saving/booking
  currentPkgInfo = pkg;
  currentPkgImage = imageUrl;

  const modal = document.getElementById('modal');
  if (!modal) return;

  // Populate Modal with basic info
  document.getElementById('modal-title').innerText = pkg['Package Name'];
  document.getElementById('modal-dest').innerText = `📍 ${pkg['Destination']}`;
  document.getElementById('modal-duration').innerText = `🗓️ ${pkg['Duration']} Days`;
  const desc = pkg['Package Description'] || '';
  document.getElementById('modal-desc').innerText = desc;
  document.getElementById('modal-price').innerText = `₹${Number(pkg['Price']).toLocaleString('en-IN')}`;
  
  // Activities in Modal
  const modalActs = document.getElementById('modal-activities');
  if (modalActs) {
    modalActs.innerHTML = '';
    const match = desc.match(/This package includes (.+)\./i);
    if (match && match[1]) {
      const activities = match[1].split(/, | and | & /i).filter(a => a.trim().length > 0);
      modalActs.innerHTML = activities.map(a => `<span class="activity-pill">✓ ${a.trim()}</span>`).join('');
    }
  }
  
  const imgEl = document.getElementById('modal-image');
  if (imgEl) imgEl.style.backgroundImage = `url('${imageUrl}')`;

  const scoreEl = document.getElementById('modal-match');
  if (scoreEl) {
    const score = Math.round((pkg['Similarity Score'] || 0) * 100);
    scoreEl.innerText = `${score}% Match`;
    scoreEl.className = 'card__match ' + (score > 60 ? 'card__match--high' : 'card__match--mid');
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.bookAndEdit = () => {
  // Hide basic modal
  closeModal();

  // Show transition if desired
  const loader = document.getElementById('detail-loader');
  if (loader) {
    loader.classList.add('active');
    setTimeout(() => {
      loader.classList.remove('active');
      renderDetailedView(currentPkgInfo, currentPkgImage);
    }, 200);
  } else {
    renderDetailedView(currentPkgInfo, currentPkgImage);
  }
};

window.renderDetailedView = (pkg, imageUrl) => {
  const detailView = document.getElementById('detail-view');
  if (!detailView) return;

  // Set Title & Context
  document.getElementById('detail-trip-title').innerText = `Trip to ${pkg['Destination']}`;
  document.getElementById('detail-hero-img').src = imageUrl;

  // Fetch Real Recommended Places via Google Places API
  const placesRow = document.getElementById('rec-places-row');
  if (placesRow) {
    placesRow.innerHTML = '<div style="padding:20px; color:#64748b; font-size:12px;">Discovering top-rated spots...</div>';
    
    if (placesService) {
      const request = {
        query: `top tourist attractions in ${pkg['Destination']}`,
        fields: ['name', 'photos', 'rating']
      };

      placesService.textSearch(request, (results, status) => {
        placesRow.innerHTML = '';
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          results.slice(0, 5).forEach(place => {
            let photoUrl = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400';
            if (place.photos && place.photos.length > 0) {
              photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
            }
            createRecCard(placesRow, place.name, photoUrl);
          });
        } else {
          showSimulatedPlaces(placesRow, pkg['Destination']);
        }
      });
    } else {
      // Direct fallback if placesService was never initialized
      showSimulatedPlaces(placesRow, pkg['Destination']);
    }
  }

  const desc = pkg['Package Description'] || '';

  // Reset and Sync Edit State
  editState = {
    places: [],
    dates: 'Add trip dates',
    notes: desc,
    friends: []
  };

  const notesArea = document.getElementById('detail-notes-area');
  if (notesArea) notesArea.value = desc;

  const avatars = document.getElementById('itinerary-avatars');
  if (avatars) avatars.innerHTML = '<span class="avatar-icon" title="You (Organizer)">👤</span>';

  // Initialize Budget Breakdown
  initBudgetBreakdown(pkg);

  // Show View
  detailView.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Check if saved and update button
  const alreadySaved = savedTrips.some(t => t.pkg['Package Name'] === pkg['Package Name']);
  const saveBtns = document.querySelectorAll('.btn-book, .btn-save-detail');
  saveBtns.forEach(btn => {
    if (alreadySaved) {
      btn.innerHTML = '<span style="display:flex; align-items:center; gap:8px;">✓ Saved to Itinerary</span>';
      btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      btn.style.color = "white";
    } else {
      btn.innerText = "Save This Trip";
      btn.style.background = ""; // Reset to CSS default
      btn.style.color = "";
    }
  });

  // Render Map
  renderDetailMap(pkg);

  // Initialize Autocomplete for the search box
  initPlaceAutocomplete(pkg['Destination']);
};

window.initPlaceAutocomplete = (destination) => {
  const input = document.getElementById('add-place-input');
  if (!input || !google.maps.places) return;

  const options = {
    componentRestrictions: { country: [] }, // Can restrict to specific countries if needed
    fields: ['name', 'geometry', 'photos', 'rating', 'reviews', 'place_id'],
    types: ['establishment', 'geocode']
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);
  
  // Set bounds to the destination if we have coordinates
  const coords = DEST_COORDS[destination.toLowerCase()];
  if (coords && google.maps.Circle) {
    const circle = new google.maps.Circle({ center: { lat: coords[0], lng: coords[1] }, radius: 50000 });
    autocomplete.setBounds(circle.getBounds());
  }

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      showPlacePreview(place);
      
      const activeMap = detailMap || googleMap;
      if (activeMap) {
        activeMap.setCenter(place.geometry.location);
        activeMap.setZoom(15);
      }
    }
  });
};

// Helper to create recommendation card
function createRecCard(container, name, img) {
  const card = document.createElement('div');
  card.className = 'rec-place-card';
  card.innerHTML = `
    <img src="${img}" alt="${name}">
    <span>${name}</span>
    <div class="add-btn-small" onclick="addRecommendedPlace('${name.replace(/'/g, "\\'")}')">+</div>
  `;
  container.appendChild(card);
}

// Fallback simulator for places
function showSimulatedPlaces(container, destination) {
  container.innerHTML = '';
  const sights = [
    { name: 'Historic Old Town', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400' },
    { name: 'Local Food Market', img: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400' },
    { name: 'Public Park & Garden', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' },
    { name: 'Skyline Viewpoint', img: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400' },
    { name: 'Cultural Museum', img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400' }
  ];
  
  sights.forEach(s => {
    createRecCard(container, `${destination} ${s.name}`, s.img);
  });
}

// --- ITINERARY EDITING FUNCTIONS ---

window.toggleDatePicker = () => {
  const wrap = document.getElementById('date-inputs-wrap');
  const disp = document.getElementById('detail-dates-display');
  if (wrap.style.display === 'none') {
    wrap.style.display = 'flex';
    disp.style.display = 'none';
  } else {
    wrap.style.display = 'none';
    disp.style.display = 'flex';
  }
};

window.updateTripDateRange = () => {
  const start = document.getElementById('trip-start-date').value;
  const end = document.getElementById('trip-end-date').value;
  
  if (start && end) {
    const sDate = new Date(start);
    const eDate = new Date(end);
    
    const options = { month: 'short', day: 'numeric' };
    const formattedRange = `${sDate.toLocaleDateString('en-US', options)} - ${eDate.toLocaleDateString('en-US', options)}`;
    
    editState.dates = formattedRange;
    document.getElementById('detail-dates-display').innerText = `🗓️ ${formattedRange}`;
    
    // Switch back to text view
    document.getElementById('date-inputs-wrap').style.display = 'none';
    document.getElementById('detail-dates-display').style.display = 'inline';
    
    // Update top level pills
    document.querySelectorAll('.btn-orange-pill').forEach(p => p.innerText = `🗓️ ${formattedRange}`);
  }
};

window.setTripDates = () => {
  window.toggleDatePicker();
};

window.editNotes = () => {
  const area = document.getElementById('detail-notes-area');
  if (area) area.focus();
};

window.handleAddPlace = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim();
    if (val) {
      searchAndPreviewPlace(val);
    }
  }
};

window.searchAndPreviewPlace = (query) => {
  if (!placesService) {
    // Fallback if Google Places is not available
    addPlaceToItinerary(query);
    return;
  }

  const request = {
    query: `${query} in ${currentPkgInfo['Destination']}`,
    fields: ['name', 'geometry', 'photos', 'rating', 'reviews', 'formatted_address']
  };

  placesService.textSearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
      const place = results[0];
      const similarResults = results.slice(1, 6); // Up to 5 similar ones
      
      // Get more details for reviews
      placesService.getDetails({ placeId: place.place_id, fields: ['name', 'photos', 'rating', 'reviews', 'geometry'] }, (details, statusDet) => {
         const finalPlace = (statusDet === 'OK') ? details : place;
         showPlacePreview(finalPlace, similarResults);
         
         // Pan map to location
         const activeMap = detailMap || googleMap;
         if (activeMap && finalPlace.geometry && finalPlace.geometry.location) {
           activeMap.setCenter(finalPlace.geometry.location);
           activeMap.setZoom(15);
           
           // Add a temporary marker
           const tempMarker = new google.maps.Marker({
             position: finalPlace.geometry.location,
             map: activeMap,
             animation: google.maps.Animation.BOUNCE,
             icon: {
               path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
               scale: 7,
               fillColor: '#2563eb',
               fillOpacity: 1,
               strokeWeight: 2,
               strokeColor: '#fff'
             }
           });
           setTimeout(() => tempMarker.setMap(null), 3000);
         }
      });
    } else {
      addPlaceToItinerary(query);
    }
  });
};

window.showPlacePreview = (place, similar = []) => {
  const card = document.getElementById('place-preview-card');
  if (!card) return;

  const photoUrl = (place.photos && place.photos.length > 0) 
    ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 })
    : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400';

  const reviewText = (place.reviews && place.reviews.length > 0)
    ? `"${place.reviews[0].text.substring(0, 120)}..."`
    : 'No recent reviews available for this location.';

  let similarHtml = '';
  if (similar.length > 0) {
    similarHtml = `
      <div class="similar-places-section">
        <div class="similar-places-title">Similar places nearby</div>
        <div class="similar-places-row">
          ${similar.map(s => `
            <div class="similar-place-mini" onclick="searchAndPreviewPlace('${s.name.replace(/'/g, "\\'")}')">
              <span>📍</span> ${s.name}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="preview-grid">
      <img src="${photoUrl}" class="preview-image" alt="${place.name}">
      <div class="preview-info">
        <div>
          <div class="preview-title">${place.name}</div>
          <div class="preview-rating">${place.rating || 'N.A'} ★</div>
          <div class="preview-review">${reviewText}</div>
        </div>
        <div class="preview-actions">
          <button class="btn-add-preview" onclick="confirmAddPlace('${place.name.replace(/'/g, "\\'")}')">Add to Trip</button>
          <button class="btn-cancel-preview" onclick="cancelPlacePreview()">Cancel</button>
        </div>
      </div>
    </div>
    ${similarHtml}
  `;
  card.classList.add('active');
  
  // Clear input
  const input = document.getElementById('add-place-input');
  if (input) input.value = '';
};

window.confirmAddPlace = (name) => {
  addPlaceToItinerary(name);
  cancelPlacePreview();
};

window.cancelPlacePreview = () => {
  const card = document.getElementById('place-preview-card');
  if (card) card.classList.remove('active');
};

window.addRecommendedPlace = (name) => {
  addPlaceToItinerary(name);
};

function addPlaceToItinerary(name) {
  if (editState.places.includes(name)) return;
  
  editState.places.push(name);
  
  // Update List UI
  const empty = document.getElementById('itinerary-empty');
  if (empty) empty.style.display = 'none';
  
  const list = document.getElementById('itinerary-list-container');
  const item = document.createElement('div');
  item.style = "background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0;";
  item.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <span style="width:24px; height:24px; background:#2563eb; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">${editState.places.length}</span>
      <span style="font-weight:600; color:#1e293b;">${name}</span>
    </div>
    <span style="color:#94a3b8; cursor:pointer; font-size:18px;" onclick="removePlace('${name}', this.parentElement)">×</span>
  `;
  list.appendChild(item);
  
  // Add to the 'Map' as a marker if possible
  const isGoogle = typeof google !== 'undefined' && google.maps && !window.googleMapsFailed;
  
  if (isGoogle && placesService) {
    const request = {
      query: `${name} ${currentPkgInfo['Destination']}`,
      fields: ['name', 'geometry'],
      locationBias: googleMap ? googleMap.getCenter() : null
    };
    placesService.findPlaceFromQuery(request, (results, status) => {
      if (status === 'OK' && results[0]) {
        const marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: googleMap || detailMap, // Note: detailMap might be the google instance in split view
          title: name,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#fff'
          }
        });
        mapMarkers.push(marker);
        if (googleMap) googleMap.panTo(results[0].geometry.location);
      }
    });
  } else if (detailMap && typeof L !== 'undefined') {
    // Leaflet Fallback Marker (Simulated position near center)
    const center = detailMap.getCenter();
    const lat = center.lat + (Math.random() - 0.5) * 0.02;
    const lng = center.lng + (Math.random() - 0.5) * 0.02;
    
    const marker = L.marker([lat, lng]).addTo(detailMap);
    marker.bindPopup(`<b>${name}</b>`).openPopup();
    detailMap.panTo([lat, lng]);
    mapMarkers.push(marker);
  }
}

window.addFriendToTrip = () => {
  const name = prompt("Enter your friend's name to invite them:");
  if (name && name.trim()) {
    const friendName = name.trim();
    if (editState.friends.includes(friendName)) return;
    
    editState.friends.push(friendName);
    
    // Create Avatar
    const avatars = document.getElementById('itinerary-avatars');
    const avatarImg = document.createElement('img');
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friendName)}&background=random&color=fff&rounded=true&size=32`;
    avatarImg.className = 'avatar-icon';
    avatarImg.title = friendName;
    avatarImg.style.marginLeft = "-8px"; // Overlap style
    avatarImg.style.border = "2px solid white";
    
    avatars.appendChild(avatarImg);
  }
};

window.renderDetailMap = (pkg) => {
  const mapDiv = document.getElementById('detail-map');
  if (!mapDiv) return;

  const destName = (pkg['Destination'] || '').toLowerCase();
  const pos = DEST_COORDS[destName] || [20, 77];
  const isGoogle = typeof google !== 'undefined' && google.maps && !window.googleMapsFailed;

  if (isGoogle) {
    detailMap = new google.maps.Map(mapDiv, {
      center: { lat: pos[0], lng: pos[1] },
      zoom: 12,
      mapTypeId: 'roadmap',
      disableDefaultUI: true,
      styles: [{ "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }]
    });
    // Ensure placesService uses the active detail map
    if (google.maps.places) {
      placesService = new google.maps.places.PlacesService(detailMap);
    }
    new google.maps.Marker({
      position: { lat: pos[0], lng: pos[1] },
      map: detailMap,
      title: pkg['Package Name'],
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#f59e0b', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }
    });
    setTimeout(() => google.maps.event.trigger(detailMap, 'resize'), 400);
  } else {
    // Detail Map Leaflet Fallback
    if (detailMap) { detailMap.remove(); }
    detailMap = L.map('detail-map', { zoomControl: false, attributionControl: false }).setView(pos, 11);
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(detailMap);
    L.marker(pos).addTo(detailMap);
    setTimeout(() => detailMap.invalidateSize(), 400);
  }
};

window.exitDetailView = () => {
  document.getElementById('detail-view').classList.remove('active');
  document.body.style.overflow = '';
};

window.closeModal = () => {
  document.getElementById('modal').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal or dropdown when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('modal');
  if (modal && event.target == modal) {
    closeModal();
  }

  const dropdown = document.getElementById('detail-dropdown');
  const trigger = document.querySelector('.detail-menu-trigger');
  if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(event.target) && event.target !== trigger) {
    dropdown.classList.remove('active');
  }
}

window.toggleDetailDropdown = () => {
  const dropdown = document.getElementById('detail-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
};

window.scrollToDetailSection = (id) => {
  const element = document.getElementById(id);
  const container = document.querySelector('.detail-content');
  if (element && container) {
    // Since .detail-content is the scrollable element in our split-view
    const offset = 40;
    container.scrollTo({
      top: element.offsetTop - offset,
      behavior: 'smooth'
    });
    
    // Close dropdown
    document.getElementById('detail-dropdown').classList.remove('active');
    
    // Update active state in UI
    const items = document.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('onclick').includes(id)) {
        item.classList.add('active');
      }
    });
  }
};

// --- SAVED TRIPS & PDF EXPORT LOGIC ---

window.updateSavedCount = function() {
  const countEl = document.getElementById('saved-count');
  if (countEl) {
    countEl.innerText = savedTrips.length;
  }
}

window.bookTrip = (e) => {
  if (!currentPkgInfo) return;

  // Merge edits if any
  const finalPkg = {
    ...currentPkgInfo,
    'Itinerary': editState.places.join(' | '),
    'Dates': editState.dates,
    'Notes': document.getElementById('detail-notes-area')?.value || editState.notes,
    'Friends': editState.friends.join(', '),
    'Budget': JSON.stringify(editState.budget)
  };

  // Prevent duplicate saving based on Package Name
  const alreadySaved = savedTrips.some(t => t.pkg['Package Name'] === finalPkg['Package Name']);

  if (!alreadySaved) {
    savedTrips.push({
      pkg: finalPkg,
      image: currentPkgImage,
      dateSaved: new Date().toISOString()
    });
    localStorage.setItem('travelBuddySavedTrips', JSON.stringify(savedTrips));
    if (window.updateSavedCount) window.updateSavedCount();

    // Get feedback buttons (both modal and split-view)
    const buttons = document.querySelectorAll('.btn-book, .btn-save-detail');
    buttons.forEach(btn => {
      btn.innerHTML = '<span style="display:flex; align-items:center; gap:8px;">✓ Saved to Itinerary</span>';
      btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      btn.style.color = "white";
    });

    // Provide a small visual confirmation without instant redirect
    // Instead of forcing redirect, show a small link to view saved trips
    const btnContainer = document.querySelector('.modal__price-section') || document.querySelector('.user-stack');
    if (btnContainer && !document.getElementById('view-saved-link')) {
      const link = document.createElement('a');
      link.id = 'view-saved-link';
      link.href = '/saved-trips';
      link.innerText = 'View All Saved Trips →';
      link.style.display = 'block';
      link.style.marginTop = '15px';
      link.style.fontSize = '0.9rem';
      link.style.color = '#2563eb';
      link.style.fontWeight = '700';
      link.style.textDecoration = 'none';
      btnContainer.appendChild(link);
    }

    // Still offer redirect after some time if they want, but let them explore
    // setTimeout(() => { window.location.href = '/saved-trips'; }, 1500);
  } else {
    // Already saved feedback
    const buttons = document.querySelectorAll('.btn-book, .btn-save-detail');
    buttons.forEach(btn => {
      btn.innerText = "Already Saved!";
      setTimeout(() => {
        btn.innerText = "Save This Trip";
      }, 2000);
    });
  }
};

// --- BUDGET BREAKDOWN LOGIC ---
const BUDGET_ICONS = {
  'Flights': '✈️',
  'Hotels': '🏨',
  'Activities': '🎡',
  'Transport': '🚗',
  'Food': '🍱',
  'Others': '💰'
};

window.initBudgetBreakdown = (pkg) => {
  const totalRaw = Number(pkg['Price']);
  
  // Default Breakdown percentages
  const distribution = [
    { label: 'Flights', weight: 0.35 },
    { label: 'Hotels', weight: 0.30 },
    { label: 'Activities', weight: 0.15 },
    { label: 'Transport', weight: 0.10 },
    { label: 'Others', weight: 0.10 }
  ];

  editState.budget = distribution.map(item => ({
    label: item.label,
    value: Math.round(item.weight * totalRaw),
    icon: BUDGET_ICONS[item.label] || '💸'
  }));

  renderBudget();
};

window.renderBudget = () => {
  const container = document.getElementById('budget-breakdown-container');
  if (!container) return;

  let total = 0;
  let html = '';

  editState.budget.forEach((item, index) => {
    total += item.value;
    html += `
      <div class="budget-row">
        <div class="budget-icon">${item.icon}</div>
        <div class="budget-label">${item.label}</div>
        <div class="budget-value-wrap">
          <span class="budget-currency">₹</span>
          <input type="number" class="budget-input" value="${item.value}" 
                 onchange="updateBudgetValue(${index}, this.value)" 
                 onkeyup="updateBudgetValue(${index}, this.value)">
        </div>
      </div>
    `;
  });

  // Add Total Row
  html += `
    <div class="budget-row">
      <div class="budget-icon">📊</div>
      <div class="budget-total-label">Estimated Total</div>
      <div class="budget-total-value">₹${total.toLocaleString('en-IN')}</div>
    </div>
  `;

  container.innerHTML = html;
};

window.updateBudgetValue = (index, value) => {
  const val = parseInt(value) || 0;
  editState.budget[index].value = val;
  
  // Update Total in UI without full re-render for smoothness
  let total = 0;
  editState.budget.forEach(item => total += item.value);
  const totalEl = document.querySelector('.budget-total-value');
  if (totalEl) totalEl.innerText = `₹${total.toLocaleString('en-IN')}`;
};

window.addNewBudgetItem = () => {
  const label = prompt("Enter expense name (e.g., Insurance, Visa):");
  if (label && label.trim()) {
    editState.budget.push({
      label: label.trim(),
      value: 0,
      icon: '➕'
    });
    renderBudget();
    // Focus the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.budget-input');
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    }, 100);
  }
};

window.resetBudget = () => {
  if (currentPkgInfo) {
    initBudgetBreakdown(currentPkgInfo);
  }
};

window.removeSavedTrip = (index) => {
  savedTrips.splice(index, 1);
  localStorage.setItem('travelBuddySavedTrips', JSON.stringify(savedTrips));
  updateSavedCount();
  if (document.getElementById('saved-page-list')) {
    window.renderSavedPage();
  }
};

window.renderSavedPage = () => {
  const listEl = document.getElementById('saved-page-list');
  if (!listEl) return;

  if (savedTrips.length === 0) {
    listEl.innerHTML = `
      <div class="state-msg">
        <h3>No trips saved yet!</h3>
        <p>Explore our packages and click 'Save This Trip' to keep them here.</p>
        <br>
        <a href="/" class="btn-default" style="text-decoration: none; display: inline-block;">Go Explore Flights</a>
      </div>`;
    return;
  }

  listEl.innerHTML = savedTrips.map((item, index) => {
    const totalRaw = Number(item.pkg['Price']);
    const totalStr = totalRaw.toLocaleString('en-IN');

    // Calculate Breakdown estimates
    const flightsMin = Math.floor(0.20 * totalRaw);
    const flightsMax = Math.floor(0.30 * totalRaw);

    const hotelMin = Math.floor(0.30 * totalRaw);
    const hotelMax = Math.floor(0.40 * totalRaw);

    const foodMin = Math.floor(0.25 * totalRaw);
    const foodMax = Math.floor(0.35 * totalRaw);

    const miscMin = totalRaw - flightsMax - hotelMax - foodMax;
    const miscMax = totalRaw - flightsMin - hotelMin - foodMin;

    return `
      <div class="detailed-trip-card">
        <div class="detailed-trip-card__img">
          <img src="${item.image}" alt="${item.pkg['Package Name']}">
        </div>
        <div class="detailed-trip-card__content">
          <div class="card-head">
            <h2 class="detailed-trip-card__title">${item.pkg['Package Name']}</h2>
            <div class="detailed-trip-card__meta">
              <span>📍 ${item.pkg['Destination']}</span>
              <span>🗓️ ${item.pkg['Dates'] || (item.pkg['Duration'] + ' Days')}</span>
            </div>
            <p style="color: #64748b; line-height: 1.6; font-size: 1rem; margin-bottom: 25px;">${item.pkg['Package Description']}</p>
            ${item.pkg['Itinerary'] ? `
            <div style="margin-bottom: 25px;">
              <h4 style="font-size: 0.9rem; color: #1e293b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Planned Stops</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${item.pkg['Itinerary'].split(' | ').map(stop => `<span style="background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; border: 1px solid #dbeafe;">${stop}</span>`).join('')}
              </div>
            </div>` : ''}
            ${item.pkg['Notes'] && item.pkg['Notes'] !== item.pkg['Package Description'] ? `
            <div style="margin-bottom: 25px;">
              <h4 style="font-size: 0.9rem; color: #1e293b; margin-bottom: 10px; text-transform: uppercase;">My Notes</h4>
              <p style="font-style: italic; color: #475569; padding: 10px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #cbd5e1;">${item.pkg['Notes']}</p>
            </div>` : ''}
          </div>
          
          <div class="breakdown-section">
            <div class="breakdown-header">
              <span class="breakdown-title">Expense Breakdown</span>
              <span class="breakdown-total">₹${totalStr}</span>
            </div>
            
            <div class="breakdown-list">
              ${item.pkg['Budget'] ? (() => {
                try {
                  const budget = JSON.parse(item.pkg['Budget']);
                  return budget.map(b => `
                    <div class="breakdown-item">
                      <span class="breakdown-item__label">${b.icon} ${b.label}</span>
                      <span class="breakdown-item__value">₹${Number(b.value).toLocaleString('en-IN')}</span>
                    </div>
                  `).join('');
                } catch (e) { return ''; }
              })() : `
                <div class="breakdown-item">
                  <span class="breakdown-item__label">Flights</span>
                  <span class="breakdown-item__value">₹${flightsMin.toLocaleString('en-IN')} - ${flightsMax.toLocaleString('en-IN')}</span>
                </div>
                
                <div class="breakdown-item">
                  <span class="breakdown-item__label">Hotels</span>
                  <span class="breakdown-item__value">₹${hotelMin.toLocaleString('en-IN')} - ${hotelMax.toLocaleString('en-IN')}</span>
                </div>
                
                <div class="breakdown-item">
                  <span class="breakdown-item__label">Food & Tours</span>
                  <span class="breakdown-item__value">₹${foodMin.toLocaleString('en-IN')} - ${foodMax.toLocaleString('en-IN')}</span>
                </div>
                
                <div class="breakdown-item">
                  <span class="breakdown-item__label">Misc</span>
                  <span class="breakdown-item__value">₹${miscMin > 0 ? miscMin.toLocaleString('en-IN') : 0} - ${miscMax > 0 ? miscMax.toLocaleString('en-IN') : 0}</span>
                </div>
              `}
            </div>
          </div>
          
          <div class="detailed-trip-card__actions">
            <button class="btn-download" onclick="downloadPDF(${index})">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF Itinerary
            </button>
            <button class="btn-remove--large" onclick="removeSavedTrip(${index})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.downloadPDF = (index) => {
  const item = savedTrips[index];
  const pkg = item.pkg;

  // Format highlights for PDF
  let desc = pkg['Package Description'] || '';
  let overview = desc;
  let highlightsHtml = '';

  const match = desc.match(/This package includes (.+)\./i);
  if (match && match[1]) {
    overview = desc.replace(match[0], '').trim();
    if (!overview) overview = desc;
    const activities = match[1].split(/, | and | & /i).filter(a => a.trim().length > 0);
    highlightsHtml = `
      <div style="margin-top: 15px;">
        <h4 style="color: #334155; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">What's Included</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${activities.map(act => `<div style="color: #475569; font-size: 13px;">• ${act.trim()}</div>`).join('')}
        </div>
      </div>
    `;
  }

  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.background = '#ffffff';
  element.style.fontFamily = "'Inter', sans-serif";
  
  element.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        <h1 style="margin: 0; color: #2563eb; font-size: 28px;">Travel buddy Itinerary</h1>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Official Booking Reference: #TB-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px; display: flex; justify-content: space-between;">
      <div style="flex: 1;">
        <h2 style="margin: 0 0 5px 0; color: #0f172a; font-size: 22px;">${pkg['Package Name']}</h2>
        <p style="margin: 0; color: #2563eb; font-weight: 700; font-size: 16px;">📍 ${pkg['Destination']}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Adventure Dates</p>
        <p style="margin: 3px 0 0 0; color: #1e293b; font-weight: 700; font-size: 16px;">🗓️ ${pkg['Dates'] || (pkg['Duration'] + ' Days')}</p>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Package Overview</h3>
      <p style="line-height: 1.6; color: #475569; font-size: 14px; margin: 0;">${overview}</p>
      ${highlightsHtml}
    </div>

    ${pkg['Itinerary'] ? `
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">📍 Planned Stops</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${pkg['Itinerary'].split(' | ').map((stop, i) => `
          <div style="display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #f1f5f9; padding: 12px; border-radius: 8px;">
            <span style="width: 24px; height: 24px; background: #2563eb; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${i+1}</span>
            <span style="color: #1e293b; font-weight: 600; font-size: 14px;">${stop}</span>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    ${pkg['Notes'] && pkg['Notes'] !== pkg['Package Description'] ? `
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">✍️ My Notes</h3>
      <p style="background: #fff9db; border-left: 4px solid #f59e0b; padding: 15px; margin: 0; font-size: 13px; font-style: italic; color: #856404; border-radius: 0 8px 8px 0;">${pkg['Notes']}</p>
    </div>` : ''}

    <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px;">
      <div style="text-align: right;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Estimated Total Package Value</p>
        <h2 style="margin: 5px 0 0 0; color: #0f172a; font-size: 24px;">₹${Number(pkg['Price']).toLocaleString('en-IN')}</h2>
        <p style="margin: 2px 0 0 0; color: #10b981; font-weight: 700; font-size: 11px;">PRICES INCLUDES ALL TAXES & FEES</p>
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <p style="margin: 0; color: #94a3b8; font-size: 11px;">Generated by Travel buddy AI Planner. This is a system generated document for planning purposes.</p>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: `TravelBuddy_${pkg['Destination']}_Plan.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};
