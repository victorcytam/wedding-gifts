// === HANNAH & VICTOR WEDDING - REAL-TIME SYNCED VERSION ===
// Works on every phone instantly ♡

const firebaseConfig = {
  databaseURL: "https://hannah-victor-wedding-default-rtdb.firebaseio.com/"  // ← CHANGE THIS TO YOUR URL
};

let gifts = [];
let claimedData = {};

// Load gifts
fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    
    // Load Firebase script
    const script = document.createElement('script');
    script.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
    script.onload = () => loadFirebaseSDKs();
    document.head.appendChild(script);
  });

function loadFirebaseSDKs() {
  const dbScript = document.createElement('script');
  dbScript.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js";
  dbScript.onload = initFirebase;
  document.head.appendChild(dbScript);
}

function initFirebase() {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const ref = db.ref('weddingGifts');

  // Listen for real-time updates
  ref.on('value', (snapshot) => {
    claimedData = snapshot.val() || {};
    applyClaimsAndRender();
  });

  // Initial render will happen after first sync
}

function applyClaimsAndRender() {
  gifts.forEach(g => {
    if (!g.isRedPocket && claimedData[g.id]) {
      g.claimed = true;
      g.claimedBy = claimedData[g.id];
    } else if (!g.isRedPocket) {
      g.claimed = false;
      g.claimedBy = "";
    }
  });
  render();
}

// Render function (same as before)
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
      <button onclick="openModal(${g.id})">${g.isRedPocket ? 'Send 利是 ♡' : "I'll give this"}</button>
    </div>`;
}

function giftedCard(g) {
  const data = claimedData[g.id] || {};
  const by = data.name || 'Someone';
  const blessing = data.blessing && data.blessing !== "No message" ? ` — “${data.blessing}”` : '';
  return `
    <div class="gift" style="opacity:0.9; border:2px solid #27ae60;">
      <img src="${g.photo}" alt="${g.name}">
      <div class="info">
        <strong>${g.name}</strong><br>
        <em style="color:#27ae60;">♥ Gifted by ${by}${blessing}</em>
      </div>
    </div>`;
}

let currentGift = null;
function openModal(id) {
  currentGift = gifts.find(g => g.id === id);
  if (!currentGift || (!currentGift.isRedPocket && currentGift.claimed)) return;

  document.getElementById('modal-img').src = currentGift.photo;
  document.getElementById('modal-name').textContent = currentGift.name;
  document.getElementById('modal-price').textContent = 
    currentGift.isRedPocket ? 'Any amount ♡ 隨意金額' : 'HK$ ' + currentGift.price;
  document.getElementById('claimer-name').value = '';
  document.getElementById('modal').style.display = 'flex';
}

document.querySelector('.close').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('confirm-btn').onclick = () => {
  const name = document.getElementById('claimer-name').value.trim();
  if (!name) return alert('Please enter your name ♡');

  const db = firebase.database();
  const updates = {};
  updates[currentGift.id] = name;

  db.ref('weddingGifts').update(updates)
    .then(() => {
      alert(`Thank you ${name} ♡ Everyone can now see your blessing!`);
      document.getElementById('modal').style.display = 'none';
    })
    .catch(() => alert('Network error, please try again'));
};

// Admin undo still works (password 0411)
function openAdminPanel() {
  const pass = prompt("Admin password?", "");
  if (pass !== "0411") return alert("Wrong password!");
  
  const select = document.getElementById("gift-to-reset");
  select.innerHTML = '<option value="">-- Select to undo --</option>';
  
  Object.keys(claimedData).forEach(id => {
    const g = gifts.find(x => x.id == id);
    if (g) {
      const opt = new Option(`${g.name} — ${claimedData[id]}`, id);
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
      alert("Gift removed successfully!");
      document.getElementById("admin-modal").style.display = "none";
    });
}

window.onclick = e => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
}
