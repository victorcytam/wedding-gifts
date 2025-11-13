// === HANNAH & VICTOR WEDDING - FINAL FIXED VERSION ===
// No PayMe/FPS | Log Tab (0411) | Public "Gifted" only | New Colors

const firebaseConfig = {
  databaseURL: "https://hannah-victor-wedding-default-rtdb.firebaseio.com/"  // ← CHANGE THIS TO YOUR URL

let gifts = [];
window.claimedData = {};  // ← MAKE GLOBAL

// Load gifts
fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    loadFirebase();
  });

// Firebase
function loadFirebase() {
  const appScript = document.createElement('script');
  appScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
  appScript.onload = () => {
    const dbScript = document.createElement('script');
    dbScript.src = "https://www.gstatic.com.firebasejs/10.8.1/firebase-database-compat.js";
    dbScript.onload = initFirebase;
    document.head.appendChild(dbScript);
  };
  document.head.appendChild(appScript);
}

function initFirebase() {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const ref = db.ref('weddingGifts');

  ref.on('value', (snapshot) => {
    window.claimedData = snapshot.val() || {};
    applyClaimsAndRender();
  });
}

function applyClaimsAndRender() {
  gifts.forEach(g => {
    if (!g.isRedPocket && window.claimedData[g.id]) {
      g.claimed = true;
    } else if (!g.isRedPocket) {
      g.claimed = false;
    }
  });
  render();
  if (document.getElementById('tab-log').style.display === 'block') renderLog();
}

function render() {
  const available = gifts.filter(g => g.isRedPocket || !g.claimed);
  const gifted    = gifts.filter(g => g.claimed || (g.isRedPocket && window.claimedData[g.id]));

  document.getElementById('available').innerHTML = available.map(giftCard).join('');
  document.getElementById('gifted').innerHTML     = gifted.map(giftedCard).join('');
}

function giftCard(g) {
  const rpClass = g.isRedPocket ? 'gift redpocket' : 'gift';
  const priceText = typeof g.price === 'number' ? `HK$ ${g.price}` : g.price;
  return `
    <div class="${rpClass}">
      <img src="${g.photo}" alt="${g.name}" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAo9W5xwAAAABJRU5ErkJggg=='">
      <div class="info">
        <strong>${g.name}</strong><br>
        <span class="price">${priceText}</span>
      </div>
      <button onclick="openModal(${g.id})">${g.isRedPocket ? 'Send 利是' : "I'll give this"}</button>
    </div>`;
}

function giftedCard(g) {
  return `
    <div class="gift" style="opacity:0.9; border:2px solid #A2B6A7;">
      <img src="${g.photo}" alt="${g.name}">
      <div class="info">
        <strong>${g.name}</strong><br>
        <em style="color:#A2B6A7;">Gifted</em>
      </div>
    </div>`;
}

let currentGift = null;
function openModal(id) {
  currentGift = gifts.find(g => g.id === id);
  if (!currentGift || (!currentGift.isRedPocket && currentGift.claimed)) return;

  document.getElementById('step-details').style.display = 'block';
  document.getElementById('step-payment').style.display = 'none';
  document.getElementById('claimer-name').value = '';
  document.getElementById('blessing').value = '';

  document.getElementById('modal-img').src = currentGift.photo;
  document.getElementById('modal-name').textContent = currentGift.name;
  document.getElementById('modal-price').textContent = 
    currentGift.isRedPocket ? 'Any amount 隨意金額' : 'HK$ ' + currentGift.price;
  document.getElementById('modal-details').textContent = currentGift.details || "Thank you!";

