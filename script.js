// === HANNAH & VICTOR WEDDING - REAL-TIME SYNCED VERSION ===
// Works on every phone instantly ♡

const firebaseConfig = {
  databaseURL: "https://hannah-victor-wedding-default-rtdb.firebaseio.com/"  // ← CHANGE THIS TO YOUR URL
};

let gifts = [];
let claimedData = {};

// Load gifts.json
fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    loadFirebase();
  });

// Load Firebase SDKs
function loadFirebase() {
  const appScript = document.createElement('script');
  appScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
  appScript.onload = () => {
    const dbScript = document.createElement('script');
    dbScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js";
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
    claimedData = snapshot.val() || {};
    applyClaimsAndRender();
  });
}

function applyClaimsAndRender() {
  gifts.forEach(g => {
    if (!g.isRedPocket && claimedData[g.id]) {
      g.claimed = true;
      g.claimedBy = claimedData[g.id].name;
      g.blessing = claimedData[g.id].blessing;
      g.payment = claimedData[g.id].payment;
    } else if (!g.isRedPocket) {
      g.claimed = false;
      g.claimedBy = "";
    }
  });
  render();
}

function render() {
  const available = gifts.filter(g => g.isRedPocket || !g.claimed);
  const gifted    = gifts.filter(g => g.claimed || (g.isRedPocket && claimedData[g.id]));

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
    <div class="gift" style="opacity:0.9; border:2px solid #27ae60;">
      <img src="${g.photo}" alt="${g.name}">
      <div class="info">
        <strong>${g.name}</strong><br>
        <em style="color:#27ae60;">Gifted</em>
      </div>
    </div>`;
}

let currentGift = null;
function openModal(id) {
  currentGift = gifts.find(g => g.id === id);
  if (!currentGift || (!currentGift.isRedPocket && currentGift.claimed)) return;

  // Reset modal
  document.getElementById('step-details').style.display = 'block';
  document.getElementById('step-payment').style.display = 'none';
  document.querySelectorAll('.qr').forEach(q => q.classList.remove('active'));
  document.getElementById('claimer-name').value = '';
  document.getElementById('blessing').value = '';

  // Fill details
  document.getElementById('modal-img').src = currentGift.photo;
  document.getElementById('modal-name').textContent = currentGift.name;
  document.getElementById('modal-price').textContent = 
    currentGift.isRedPocket ? 'Any amount 隨意金額' : 'HK$ ' + currentGift.price;
  document.getElementById('modal-details').textContent = currentGift.details || "Thank you for your love!";

  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function showPaymentStep() {
  document.getElementById('step-details').style.display = 'none';
  document.getElementById('step-payment').style.display = 'block';
}

function backToDetails() {
  document.getElementById('step-payment').style.display = 'none';
  document.getElementById('step-details').style.display = 'block';
}

function toggleQR(type) {
  const qr = document.getElementById('qr-' + type);
  const isActive = qr.classList.contains('active');
  
  document.querySelectorAll('.qr').forEach(q => q.classList.remove('active'));
  if (!isActive) {
    qr.classList.add('active');
  }
}

function confirmGift() {
  const name = document.getElementById('claimer-name').value.trim();
  const blessing = document.getElementById('blessing').value.trim();
  const activeQR = document.querySelector('.qr.active');
  if (!name) return alert('Please enter your name');
  if (!activeQR) return alert('Please select FPS or PayMe');

  const payment = activeQR.id === 'qr-fps' ? 'FPS' : 'PayMe';

  const db = firebase.database();
  const data = { 
    name, 
    blessing: blessing || "No message", 
    payment, 
    timestamp: Date.now() 
  };

  db.ref('weddingGifts/' + currentGift.id).set(data)
    .then(() => {
      alert(`Thank you ${name}! Your blessing is recorded.`);
      closeModal();
    })
    .catch(() => alert('Network error, please try again'));
}

// === ADMIN PANEL ===
function openAdminPanel() {
  const pass = prompt("Admin password?", "");
  if (pass !== "0411") return alert("Wrong password!");
  
  const select = document.getElementById("gift-to-reset");
  select.innerHTML = '<option value="">-- Select to undo --</option>';
  
  Object.keys(claimedData).forEach(id => {
    const g = gifts.find(x => x.id == id);
    if (g) {
      const record = claimedData[id];
      const opt = new Option(`${g.name} — ${record.name} (${record.payment})`, id);
      select.add(opt);
    }
  });
  
  if (select.options.length === 1) return alert("No gifts claimed yet!");
  document.getElementById("admin-modal").style.display = "flex";
}

function performReset() {
  if (document.getElementById("admin-pass").value !== "0411") return alert("Wrong password!");
  const id = document.getElementById("gift-to-reset").value;
  if (!id) return alert("Please select a gift");
  
  firebase.database().ref('weddingGifts/' + id).remove()
    .then(() => {
      alert("Gift undone successfully!");
      document.getElementById("admin-modal").style.display = "none";
    })
    .catch(() => alert("Error undoing gift"));
}

window.onclick = e => {
  const modal = document.getElementById('modal');
  const admin = document.getElementById('admin-modal');
  if (e.target === modal) closeModal();
  if (e.target === admin) admin.style.display = 'none';
};
