'use strict';

// ============================================================
//  BACKEND CONFIG & DYNAMIC DATA
// ============================================================
// REPLACE WITH YOUR FRIEND'S LAPTOP IP ADDRESS AND PORT
// Example: const API_URL = "http://192.168.1.15:3000";
const API_URL = "http://localhost:3000";

let COMPLAINTS = [
  { id: 'CMP-3847', datetime: '04 Jul 2024, 10:32 AM', district: 'Bengaluru Urban', state: 'Karnataka', fraudType: 'UPI Fraud', risk: 'High' }
];

let POLICE_ACCOUNTS = [
  { name: 'Amit Sharma', id: 'POL-1002', username: 'amit_sharma', station: 'Koramangala PS', district: 'Bengaluru Urban', status: 'Active' },
  { name: 'Priya Patel', id: 'POL-1005', username: 'priya_patel', station: 'Bandra PS', district: 'Mumbai Suburban', status: 'Active' },
  { name: 'K. Srinivasan', id: 'POL-1009', username: 'k_srini', station: 'T-Nagar PS', district: 'Chennai', status: 'Frozen' }
];

let adminComplaintsUnlocked = false;

// Fallback Mock Data (For local demo mode when backend is offline)
const MOCK_COMPLAINTS = [
  { id: 'CMP-3847', datetime: '04 Jul 2024, 10:32 AM', district: 'Bengaluru Urban', state: 'Karnataka', fraudType: 'UPI Fraud', risk: 'High' },
  { id: 'CMP-3846', datetime: '04 Jul 2024, 09:15 AM', district: 'Mumbai Suburban', state: 'Maharashtra', fraudType: 'Phishing', risk: 'High' },
  { id: 'CMP-3845', datetime: '04 Jul 2024, 08:50 AM', district: 'Hyderabad', state: 'Telangana', fraudType: 'SIM Swap', risk: 'Medium' },
  { id: 'CMP-3844', datetime: '03 Jul 2024, 11:30 PM', district: 'Chennai', state: 'Tamil Nadu', fraudType: 'OTP Theft', risk: 'Medium' },
  { id: 'CMP-3843', datetime: '03 Jul 2024, 08:20 PM', district: 'Ahmedabad', state: 'Gujarat', fraudType: 'Investment Scam', risk: 'High' },
  { id: 'CMP-3842', datetime: '03 Jul 2024, 06:45 PM', district: 'Pune', state: 'Maharashtra', fraudType: 'UPI Fraud', risk: 'Low' },
  { id: 'CMP-3841', datetime: '03 Jul 2024, 03:10 PM', district: 'Kolkata', state: 'West Bengal', fraudType: 'Phishing', risk: 'Medium' },
  { id: 'CMP-3840', datetime: '03 Jul 2024, 01:55 PM', district: 'Jaipur', state: 'Rajasthan', fraudType: 'SIM Swap', risk: 'High' },
  { id: 'CMP-3839', datetime: '03 Jul 2024, 10:20 AM', district: 'Lucknow', state: 'Uttar Pradesh', fraudType: 'UPI Fraud', risk: 'Medium' },
  { id: 'CMP-3838', datetime: '02 Jul 2024, 05:40 PM', district: 'Bhopal', state: 'Madhya Pradesh', fraudType: 'OTP Theft', risk: 'Low' },
  { id: 'CMP-3837', datetime: '02 Jul 2024, 02:00 PM', district: 'Chandigarh', state: 'Punjab', fraudType: 'Investment Scam', risk: 'High' },
  { id: 'CMP-3836', datetime: '02 Jul 2024, 09:30 AM', district: 'Patna', state: 'Bihar', fraudType: 'Phishing', risk: 'Low' },
];

// Helper to quickly select elements
const $ = id => document.getElementById(id);

// Tracks whether the privacy gate has been passed this session.
let complaintsUnlocked = false;

// ============================================================
//  PAGE ROUTING
// ============================================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = $(pageId);
  if (targetPage) targetPage.classList.add('active');
  window.scrollTo(0, 0);
}

// ============================================================
//  LANDING TABS & SCROLL ACTIONS
// ============================================================
function initLandingPage() {
  const gotoLogin = $('btn-goto-login');
  if (gotoLogin) gotoLogin.addEventListener('click', () => showPage('page-login'));

  const heroLogin = $('btn-hero-login');
  if (heroLogin) heroLogin.addEventListener('click', () => showPage('page-login'));
}

function switchLandingTab(event, tabId) {
  const tabs = document.querySelectorAll('.tab-btn-landing');
  const contents = document.querySelectorAll('.tab-content-landing');

  tabs.forEach(t => t.classList.remove('active'));
  contents.forEach(c => c.classList.remove('active'));

  event.currentTarget.classList.add('active');
  const content = $(tabId);
  if (content) content.classList.add('active');
}
window.switchLandingTab = switchLandingTab;

// ============================================================
//  PORTAL SIGN IN & ROLES
// ============================================================
let loginAttempts = 0;

function initLogin() {
  const backBtn = $('btn-back-landing');
  if (backBtn) backBtn.addEventListener('click', () => {
    const errEl = $('login-error');
    if (errEl) errEl.textContent = '';
    showPage('page-landing');
  });

  const form = $('login-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const errEl = $('login-error');
      if (errEl) errEl.textContent = '';

      // Check if this device is blocked
      if (localStorage.getItem('cybershield_blocked') === 'true') {
        const screen = $('block-screen');
        if (screen) screen.style.display = 'flex';
        return;
      }

      const username = $('login-username').value.trim();
      const password = $('login-password').value.trim();
      if (!username || !password) {
        if (errEl) errEl.textContent = "Please enter both username and password.";
        return;
      }

      const submitBtn = $('btn-login-submit');
      submitBtn.textContent = 'Verifying...';
      submitBtn.disabled = true;

      let authSuccess = false;
      let userRole = 'officer';

      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const result = await response.json();

        if (response.ok) {
          authSuccess = true;
          userRole = result.role || (username.toLowerCase().includes('admin') ? 'admin' : 'officer');
        } else {
          loginAttempts++;
          if (loginAttempts >= 3) {
            localStorage.setItem('cybershield_blocked', 'true');
            const screen = $('block-screen');
            if (screen) screen.style.display = 'flex';
          } else {
            if (errEl) errEl.textContent = `Authentication failed: ${result.message || "Invalid credentials."} (Attempts remaining: ${3 - loginAttempts})`;
          }
        }
      } catch (err) {
        console.warn("Backend offline or unreachable. Logging in with local credential verification (Hackathon Demo Mode)...");
        // Local credential check logic based on username
        const role = username.toLowerCase().includes('admin') ? 'admin' : 'officer';
        if ((role === 'officer' && username === 'officer' && password === 'admin') ||
          (role === 'admin' && username === 'admin' && password === 'admin')) {
          authSuccess = true;
          userRole = role;
        } else {
          loginAttempts++;
          if (loginAttempts >= 3) {
            localStorage.setItem('cybershield_blocked', 'true');
            const screen = $('block-screen');
            if (screen) screen.style.display = 'flex';
          } else {
            if (errEl) errEl.textContent = `Offline Login failed. (Attempts remaining: ${3 - loginAttempts})`;
          }
        }
      } finally {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;

        if (authSuccess) {
          loginAttempts = 0; // Reset counter
          sessionStorage.setItem('cfis_user', username);
          sessionStorage.setItem('cfis_role', userRole);
          complaintsUnlocked = false;
          adminComplaintsUnlocked = false;
          if (userRole === 'admin') {
            showPage('page-admin-dashboard');
            initAdminDashboard();
          } else {
            showPage('page-dashboard');
            initDashboard();
          }
          form.reset();
        } else {
          const passInput = $('login-password');
          if (passInput) passInput.value = '';
        }
      }
    });
  }
}

// ============================================================
//  DASHBOARD & DATA FEED
// ============================================================
function initDashboard() {
  const titleEl = $('dash-portal-title');
  if (titleEl) titleEl.textContent = 'Cybershield Portal';

  const user = sessionStorage.getItem('cfis_user') || 'officer';
  const profileUsernameEl = $('profile-username');
  if (profileUsernameEl) profileUsernameEl.textContent = user;

  // Reset active state to Home nav link
  const navHome = $('nav-home');
  if (navHome) {
    const container = navHome.closest('.dash-nav-links');
    if (container) {
      container.querySelectorAll('.dash-link').forEach(link => link.classList.remove('active'));
    }
    navHome.classList.add('active');
  }

  lockComplaints();
  fetchComplaints();
}

function initAdminDashboard() {
  // Populate admin profile username
  const user = sessionStorage.getItem('cfis_user') || 'admin';
  const profileUsernameEl = $('admin-profile-username');
  if (profileUsernameEl) profileUsernameEl.textContent = user;

  // Reset active state to Admin Home nav link
  const navHome = $('admin-nav-home');
  if (navHome) {
    const container = navHome.closest('.dash-nav-links');
    if (container) {
      container.querySelectorAll('.dash-link').forEach(link => link.classList.remove('active'));
    }
    navHome.classList.add('active');
  }

  // Calculate and populate admin stats
  const totalAccountsEl = $('admin-stat-total-accounts');
  const activeAccountsEl = $('admin-stat-active-accounts');
  const frozenAccountsEl = $('admin-stat-frozen-accounts');

  if (totalAccountsEl) totalAccountsEl.textContent = POLICE_ACCOUNTS.length;
  if (activeAccountsEl) activeAccountsEl.textContent = POLICE_ACCOUNTS.filter(a => a.status === 'Active').length;
  if (frozenAccountsEl) frozenAccountsEl.textContent = POLICE_ACCOUNTS.filter(a => a.status === 'Frozen').length;

  // Render accounts table
  renderAccountsTable();

  // Load complaints and calculate stats for Admin complaints panel
  lockAdminComplaints();
  fetchAdminComplaints();
}

function renderAccountsTable() {
  const container = $('admin-accounts-list-container');
  if (!container) return;

  if (POLICE_ACCOUNTS.length === 0) {
    container.innerHTML = `<div class="detail-placeholder">No police officer accounts found.</div>`;
    return;
  }

  const tableHTML = `
    <div class="accounts-table-wrapper">
      <table class="accounts-table">
        <thead>
          <tr>
            <th>Officer Name</th>
            <th>Officer ID</th>
            <th>Username</th>
            <th>Police Station</th>
            <th>District</th>
            <th>Status</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${POLICE_ACCOUNTS.map(a => `
            <tr>
              <td style="font-weight: 600; color: var(--text-primary);">${a.name}</td>
              <td style="color: var(--text-secondary);">${a.id}</td>
              <td style="color: var(--purple); font-family: monospace;">${a.username}</td>
              <td>${a.station}</td>
              <td>${a.district}</td>
              <td>
                <span class="status-badge ${a.status === 'Active' ? 'status-active' : 'status-frozen'}">
                  ${a.status}
                </span>
              </td>
              <td style="text-align: right;">
                ${a.status === 'Active'
      ? `<button class="btn btn-outline" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2); padding: 4px 10px; font-size: 11px; margin-left: auto;" onclick="toggleAccountStatus('${a.id}', 'Frozen')">Freeze</button>`
      : `<button class="btn btn-outline" style="color: #10b981; border-color: rgba(16, 185, 129, 0.2); padding: 4px 10px; font-size: 11px; margin-left: auto;" onclick="toggleAccountStatus('${a.id}', 'Active')">Unfreeze</button>`
    }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = tableHTML;
}

function toggleAccountStatus(id, newStatus) {
  const account = POLICE_ACCOUNTS.find(a => a.id === id);
  if (account) {
    account.status = newStatus;
    initAdminDashboard();
  }
}
window.toggleAccountStatus = toggleAccountStatus;

function setupCreateAccountForm() {
  const form = $('create-account-form');
  if (form) {
    form.onsubmit = e => {
      e.preventDefault();
      const name = $('create-name').value.trim();
      const id = $('create-id').value.trim();
      const username = $('create-username').value.trim();
      const password = $('create-password').value.trim();
      const station = $('create-station').value.trim();
      const district = $('create-district').value.trim();

      if (!name || !id || !username || !password || !station || !district) {
        alert("Please fill in all fields.");
        return;
      }

      if (POLICE_ACCOUNTS.some(a => a.id === id || a.username === username)) {
        alert("An account with this Officer ID or Username already exists.");
        return;
      }

      POLICE_ACCOUNTS.push({
        name,
        id,
        username,
        station,
        district,
        status: 'Active'
      });

      alert(`Account for Officer ${name} created successfully!`);
      form.reset();
      initAdminDashboard();
    };
  }
}

async function fetchAdminComplaints() {
  const totalEl = $('admin-stat-total-complaints');
  try {
    const response = await fetch(`${API_URL}/api/complaints`);
    if (!response.ok) throw new Error("Backend response error");
    COMPLAINTS = await response.json();
  } catch (err) {
    COMPLAINTS = MOCK_COMPLAINTS;
  }
  if (totalEl) totalEl.textContent = COMPLAINTS.length;
  renderAdminComplaintCards();
}

function renderAdminComplaintCards() {
  const grid = $('admin-complaint-cards-grid');
  if (!grid) return;

  if (COMPLAINTS.length === 0) {
    grid.innerHTML = `<div class="detail-placeholder">No complaints found.</div>`;
    return;
  }

  grid.innerHTML = COMPLAINTS.map(c => {
    const id = c.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const datetime = c.DateTime || c.datetime || 'N/A';
    const district = c.City || c.district || 'N/A';
    const state = c.State || c.state || 'N/A';
    const fraudType = c.Fraud_Type || c.fraudType || 'N/A';
    const risk = c.Is_Fraud == 1 || c.risk === 'High' ? 'High' : (c.risk || 'Medium');

    return `
      <div class="complaint-card" onclick="openDetailModal('${id}')" role="button" tabindex="0">
        <div class="cc-header">
          <span class="cc-id">${id}</span>
          <span class="risk-badge risk-${risk.toLowerCase()}">${risk} Risk</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">Date/Time</span>
          <span class="cc-value">${datetime}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">District</span>
          <span class="cc-value">${district}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">State</span>
          <span class="cc-value">${state}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">Fraud Type</span>
          <span class="cc-value">${fraudType}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setupAdminComplaintsGate() {
  const gateSubmit = $('btn-admin-view-complaints');
  if (gateSubmit) {
    gateSubmit.onclick = (e) => {
      if (e) e.preventDefault();

      const errEl = $('admin-complaints-gate-error');
      if (errEl) errEl.textContent = '';

      const pass = $('admin-privacy-password').value;
      if (pass === 'admin' || pass === 'admin123' || pass === 'officer') {
        adminComplaintsUnlocked = true;
        $('admin-complaints-gate').hidden = true;
        $('admin-complaints-list').hidden = false;
        $('admin-privacy-password').value = '';

        // Smooth scroll to complaints list
        setTimeout(() => {
          const list = $('admin-complaints-list');
          if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        if (errEl) errEl.textContent = "Incorrect Privacy Access Password.";
      }
    };
  }
}

async function fetchComplaints() {
  const totalEl = $('stat-total-complaints');
  const highRiskEl = $('stat-high-risk-cases');

  try {
    const response = await fetch(`${API_URL}/api/complaints`);
    if (!response.ok) throw new Error("Backend response error");

    COMPLAINTS = await response.json();
    console.log("Successfully fetched complaints from backend:", COMPLAINTS.length);
  } catch (err) {
    console.warn("Backend complaints API unreachable. Falling back to local offline dataset...");
    COMPLAINTS = MOCK_COMPLAINTS;
  }

  // Populate counters
  if (totalEl) totalEl.textContent = COMPLAINTS.length;
  if (highRiskEl) highRiskEl.textContent = COMPLAINTS.filter(c => {
    const r = c.Is_Fraud == 1 || c.risk === 'High';
    return r;
  }).length;

  // Render cards grid
  renderComplaintCards();
}

function renderComplaintCards() {
  const grid = $('complaint-cards-grid');
  if (!grid) return;

  if (COMPLAINTS.length === 0) {
    grid.innerHTML = `<div class="detail-placeholder">No complaints found.</div>`;
    return;
  }

  grid.innerHTML = COMPLAINTS.map(c => {
    const id = c.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const datetime = c.DateTime || c.datetime || 'N/A';
    const district = c.City || c.district || 'N/A';
    const state = c.State || c.state || 'N/A';
    const fraudType = c.Fraud_Type || c.fraudType || 'N/A';
    const risk = c.Is_Fraud == 1 || c.risk === 'High' ? 'High' : (c.risk || 'Medium');

    return `
      <div class="complaint-card" onclick="openDetailModal('${id}')" role="button" tabindex="0">
        <div class="cc-header">
          <span class="cc-id">${id}</span>
          <span class="risk-badge risk-${risk.toLowerCase()}">${risk} Risk</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">Date/Time</span>
          <span class="cc-value">${datetime}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">District</span>
          <span class="cc-value">${district}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">State</span>
          <span class="cc-value">${state}</span>
        </div>
        <div class="cc-row">
          <span class="cc-label">Fraud Type</span>
          <span class="cc-value">${fraudType}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
//  COMPLAINTS PRIVACY GATE
// ============================================================
function setupComplaintsGate() {
  const gateSubmit = $('btn-view-complaints');
  if (gateSubmit) {
    gateSubmit.addEventListener('click', () => {
      const errEl = $('complaints-gate-error');
      if (errEl) errEl.textContent = '';

      // Check if device is blocked
      if (localStorage.getItem('cybershield_blocked') === 'true') {
        const screen = $('block-screen');
        if (screen) screen.style.display = 'flex';
        return;
      }

      const pass = $('privacy-password').value;

      // If pass is admin/admin123/officer, let them through
      if (pass === 'admin' || pass === 'admin123' || pass === 'officer') {
        complaintsUnlocked = true;
        $('complaints-gate').hidden = true;
        $('complaints-list').hidden = false;
        $('privacy-password').value = '';

        // Smooth scroll to complaints list
        setTimeout(() => {
          const list = $('complaints-list');
          if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        if (errEl) errEl.textContent = "Incorrect Privacy Access Password.";
      }
    });
  }
}

function lockComplaints() {
  complaintsUnlocked = false;
  const gate = $('complaints-gate');
  const list = $('complaints-list');
  if (gate) gate.hidden = false;
  if (list) list.hidden = true;
  const passField = $('privacy-password');
  if (passField) passField.value = '';
}

function lockAdminComplaints() {
  adminComplaintsUnlocked = false;
  const gate = $('admin-complaints-gate');
  const list = $('admin-complaints-list');
  if (gate) gate.hidden = false;
  if (list) list.hidden = true;
  const passField = $('admin-privacy-password');
  if (passField) passField.value = '';
}

function scrollToSection(event, sectionId) {
  if (event) event.preventDefault();
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Highlight the clicked link as active
  const clickedLink = event ? event.currentTarget : null;
  if (clickedLink) {
    const container = clickedLink.closest('.dash-nav-links');
    if (container) {
      container.querySelectorAll('.dash-link').forEach(link => link.classList.remove('active'));
    }
    clickedLink.classList.add('active');
  }
}
window.scrollToSection = scrollToSection;

function initProfile() {
  const logoutPolice = $('btn-logout-police');
  if (logoutPolice) {
    logoutPolice.onclick = () => {
      sessionStorage.clear();
      showPage('page-landing');
    };
  }
  const logoutAdmin = $('btn-logout-admin');
  if (logoutAdmin) {
    logoutAdmin.onclick = () => {
      sessionStorage.clear();
      showPage('page-landing');
    };
  }
}

// ============================================================
//  DETAIL MODAL & INTERACTIVE MAP (LEAFLET.JS)
// ============================================================
const DISTRICT_COORDS = {
  'bengaluru urban': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'mumbai': [19.0760, 72.8777],
  'mumbai suburban': [19.0760, 72.8777],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'ahmedabad': [23.0225, 72.5714],
  'pune': [18.5204, 73.8567],
  'kolkata': [22.5726, 88.3639],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'bhopal': [23.2599, 77.4126],
  'chandigarh': [30.7333, 76.7794],
  'patna': [25.5941, 85.1376]
};

let leafletMap = null;
let leafletMarker = null;
let leafletCircle = null;

function openDetailModal(id) {
  const c = COMPLAINTS.find(item => {
    const cId = item.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    return cId === id;
  });
  if (!c) return;

  const datetime = c.DateTime || c.datetime || 'N/A';
  const district = c.City || c.district || 'N/A';
  const state = c.State || c.state || 'N/A';
  const fraudType = c.Fraud_Type || c.fraudType || 'N/A';
  const risk = c.Is_Fraud == 1 || c.risk === 'High' ? 'High' : (c.risk || 'Medium');

  $('d-id').textContent = id;
  $('d-datetime').textContent = datetime;
  $('d-district').textContent = district;
  $('d-state').textContent = state;
  $('d-fraud-type').textContent = fraudType;

  const riskBadge = $('d-risk-level');
  if (riskBadge) {
    riskBadge.textContent = `${risk} Risk`;
    riskBadge.className = `risk-badge badge-${risk.toLowerCase()}`;
  }

  // Update map details
  $('map-district').textContent = district;
  $('map-state').textContent = state;
  const mapRisk = $('map-risk');
  if (mapRisk) {
    mapRisk.textContent = `${risk} Risk`;
    mapRisk.className = `map-info-val map-risk risk-${risk.toLowerCase()}`;
  }

  // Set map marker pin label for fallback
  const markerLabel = $('map-marker-label');
  if (markerLabel) markerLabel.textContent = district;

  // Resolve coordinates
  const dLower = district.toLowerCase();
  let coords = [20.5937, 78.9629]; // Default India Center
  let zoomLevel = 5;

  for (const key in DISTRICT_COORDS) {
    if (dLower.includes(key)) {
      coords = DISTRICT_COORDS[key];
      zoomLevel = 13;
      break;
    }
  }

  // Position fallback pin based on district location inside map viewBox
  const pin = $('map-marker-wrap');
  if (pin) {
    let top = "44%";
    let left = "50%";

    if (dLower.includes('bengaluru') || dLower.includes('bangalore')) {
      top = "70%"; left = "38%";
    } else if (dLower.includes('mumbai') || dLower.includes('pune')) {
      top = "56%"; left = "28%";
    } else if (dLower.includes('hyderabad')) {
      top = "62%"; left = "42%";
    } else if (dLower.includes('chennai')) {
      top = "75%"; left = "44%";
    } else if (dLower.includes('ahmedabad')) {
      top = "46%"; left = "20%";
    } else if (dLower.includes('kolkata')) {
      top = "48%"; left = "68%";
    } else if (dLower.includes('jaipur')) {
      top = "36%"; left = "26%";
    } else if (dLower.includes('lucknow') || dLower.includes('patna') || dLower.includes('bhopal')) {
      top = "38%"; left = "48%";
    } else if (dLower.includes('chandigarh')) {
      top = "24%"; left = "32%";
    }

    pin.style.top = top;
    pin.style.left = left;
    pin.style.display = 'flex';
  }

  // Display modal (must be visible for Leaflet dimension calculations)
  $('complaint-modal').hidden = false;

  // Initialize or update Leaflet Map
  setTimeout(() => {
    try {
      if (typeof L !== 'undefined') {
        if (!leafletMap) {
          leafletMap = L.map('leaflet-map', {
            zoomControl: true,
            attributionControl: false
          }).setView(coords, zoomLevel);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
          }).addTo(leafletMap);

          // Glowing marker Pin (Red)
          const glowIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: '<div style="position:relative; display:flex; align-items:center; justify-content:center;"><div class="map-marker-pulse" style="width: 36px; height: 36px; margin: 0; background: rgba(239,68,68,0.25);"></div><div style="background:#ef4444; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #ef4444; position:absolute; z-index:10;"></div></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          leafletMarker = L.marker(coords, { icon: glowIcon }).addTo(leafletMap);

          // 2km radius circle representing target hotspot area (Red)
          leafletCircle = L.circle(coords, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.15,
            radius: 2000
          }).addTo(leafletMap);
        } else {
          leafletMap.setView(coords, zoomLevel);
          leafletMarker.setLatLng(coords);
          leafletCircle.setLatLng(coords);
        }

        // Bind hover tooltip for cursor rollover info display
        leafletMarker.bindTooltip(`
          <div style="font-family: Inter, sans-serif; font-size: 11px; color: #1f2937; line-height: 1.4; padding: 2px;">
            <b style="font-size: 12px; color: #ef4444; display: block; margin-bottom: 2px;">${district}</b>
            <strong>State:</strong> ${state}<br/>
            <strong>Type:</strong> ${fraudType}<br/>
            <strong>Risk:</strong> ${risk} Risk
          </div>
        `, { direction: 'top', opacity: 0.95 });

        // Force Leaflet recalculation
        leafletMap.invalidateSize();
      }
    } catch (err) {
      console.warn("Leaflet error:", err);
    }
  }, 200);
}

function closeModal() {
  $('complaint-modal').hidden = true;
}

function setupModal() {
  const closeBtn = $('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const modalOverlay = $('complaint-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// Make openDetailModal globally available since it is called inline via HTML
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const reveals = document.querySelectorAll('.reveal');
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -20px 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  reveals.forEach(el => observer.observe(el));
}

// Make openDetailModal globally available since it is called inline via HTML
window.openDetailModal = openDetailModal;

// ============================================================
//  INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check if reset is requested in URL params to unblock testing device
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    localStorage.removeItem('cybershield_blocked');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Check if device is blocked
  if (localStorage.getItem('cybershield_blocked') === 'true') {
    const screen = $('block-screen');
    if (screen) screen.style.display = 'flex';
    return;
  }

  initScrollReveal();
  initLandingPage();
  initLogin();
  initProfile();
  setupComplaintsGate();
  setupAdminComplaintsGate();
  setupCreateAccountForm();
  setupModal();
  initBrandInfoPopup();

  // Restore session if already logged in
  const savedUser = sessionStorage.getItem('cfis_user');
  const savedRole = sessionStorage.getItem('cfis_role');
  if (savedUser) {
    if (savedRole === 'admin') {
      showPage('page-admin-dashboard');
      initAdminDashboard();
    } else {
      showPage('page-dashboard');
      initDashboard();
    }
  } else {
    showPage('page-landing');
  }
});

function openDomainPopup(domain) {
  const titleEl = $('domain-modal-title');
  const bodyEl = $('domain-modal-body');
  if (!titleEl || !bodyEl) return;

  if (domain === 'xgboost') {
    titleEl.textContent = '🤖 XGBoost Predictive Scoring';
    bodyEl.innerHTML = `
      <p style="margin-bottom: 12px;"><strong>Description:</strong> Cybershield's classification core built on the extreme gradient boosting algorithm.</p>
      <p style="margin-bottom: 12px;"><strong>Features Analyzed:</strong> Parses location telemetry, banking routing codes, device hardware hashes, and transaction timestamps under 20 milliseconds.</p>
      <div style="background:rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 4px; padding: 10px; font-family: monospace; font-size:11px; color:var(--neon-blue);">
        n_estimators=300<br>
        max_depth=6<br>
        learning_rate=0.1<br>
        scale_pos_weight=18.83
      </div>
    `;
  } else if (domain === 'networkx') {
    titleEl.textContent = '🕸️ NetworkX Mule Traversal';
    bodyEl.innerHTML = `
      <p style="margin-bottom: 12px;"><strong>Description:</strong> Graph analytics engine that identifies money laundering networks.</p>
      <p style="margin-bottom: 12px;"><strong>Algorithm:</strong> Traces flow dynamics using degree centrality rankings and community grouping algorithms to flag shell accounts.</p>
      <div style="background:rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 4px; padding: 10px; font-family: monospace; font-size:11px; color:var(--neon-blue);">
        def compute_degree_centrality(G):<br>
        &nbsp;&nbsp;&nbsp;&nbsp;centrality = nx.degree_centrality(G)<br>
        &nbsp;&nbsp;&nbsp;&nbsp;return sorted(centrality.items(), key=lambda x: x[1], reverse=True)
      </div>
    `;
  } else if (domain === 'audit') {
    titleEl.textContent = '🛡️ Audit-Compliant Logs';
    bodyEl.innerHTML = `
      <p style="margin-bottom: 12px;"><strong>Description:</strong> Cryptographically partitioned security ledger preventing tamper operations.</p>
      <p style="margin-bottom: 12px;"><strong>Security Integrity:</strong> Generates secure session logs of police access, preventing internal fraud modifications.</p>
      <p style="color:var(--neon-blue); font-size: 11px;">🔒 AES-256 GCM Session Encryption Active</p>
    `;
  } else if (domain === 'alerts') {
    titleEl.textContent = '📈 Real-Time Alert Feed';
    bodyEl.innerHTML = `
      <p style="margin-bottom: 12px;"><strong>Description:</strong> Stream parsing component scanning telemetry for banking anomalies.</p>
      <p style="margin-bottom: 12px;"><strong>Trigger Metrics:</strong> Instant categorization based on anomaly scores, target risks, and transaction amounts.</p>
      <p style="color:#10b981; font-size: 11px;">● Stream Syncing: Online (0.01s Latency)</p>
    `;
  }
  $('domain-info-modal').hidden = false;
}
window.openDomainPopup = openDomainPopup;

function openProfileModal(e) {
  if (e) e.preventDefault();
  
  const user = sessionStorage.getItem('cfis_user') || 'officer';
  const role = sessionStorage.getItem('cfis_role') || 'officer';
  
  const usernameEl = $('modal-profile-username');
  const roleEl = $('modal-profile-role');
  
  if (usernameEl) usernameEl.textContent = user;
  if (roleEl) roleEl.textContent = role === 'admin' ? 'System Administrator' : 'Police Officer';
  
  $('profile-modal').hidden = false;
}
window.openProfileModal = openProfileModal;

function initBrandInfoPopup() {
  const modal = $('brand-info-modal');
  const closeBtn = $('btn-brand-modal-close');
  
  const landingBrand = $('nav-brand-landing-logo');
  const dashBrand = $('nav-brand-dash-logo');
  const adminBrand = $('nav-brand-admin-logo');

  const openBrandModal = () => {
    if (modal) modal.hidden = false;
    document.body.classList.toggle('neon-blue-bg');
  };

  if (landingBrand) landingBrand.addEventListener('click', openBrandModal);
  if (dashBrand) dashBrand.addEventListener('click', openBrandModal);
  if (adminBrand) adminBrand.addEventListener('click', openBrandModal);

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.hidden = true;
    });
  }

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.hidden = true;
      }
    });
  }

  // Domain modal close button
  const domainModal = $('domain-info-modal');
  const domainCloseBtn = $('btn-domain-modal-close');
  if (domainCloseBtn) {
    domainCloseBtn.addEventListener('click', () => {
      if (domainModal) domainModal.hidden = true;
    });
  }
  if (domainModal) {
    domainModal.addEventListener('click', e => {
      if (e.target === domainModal) {
        domainModal.hidden = true;
      }
    });
  }

  // Profile modal close & logout
  const profileModal = $('profile-modal');
  const profileCloseBtn = $('btn-profile-modal-close');
  if (profileCloseBtn) {
    profileCloseBtn.addEventListener('click', () => {
      if (profileModal) profileModal.hidden = true;
    });
  }
  if (profileModal) {
    profileModal.addEventListener('click', e => {
      if (e.target === profileModal) {
        profileModal.hidden = true;
      }
    });
  }
  
  const modalLogout = $('btn-modal-logout');
  if (modalLogout) {
    modalLogout.onclick = () => {
      sessionStorage.clear();
      if (profileModal) profileModal.hidden = true;
      showPage('page-landing');
    };
  }
}