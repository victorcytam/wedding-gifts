// === HANNAH & VICTOR WEDDING - ADMIN PORTAL 100% FIXED ===

const firebaseConfig = {
  databaseURL: "https://hannah-victor-wedding-default-rtdb.firebaseio.com/"  // CHANGE TO YOURS
};

let gifts = [];
window.claimedData = {};  // ← GLOBAL + CRITICAL

fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    loadFirebase();
  });

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

function confirmGift() {
  const name = document.getElementById('claimer-name').value.trim();
  const blessing = document.getElementById('blessing').value.trim();
  if (!name) return alert('Please enter your name');

  const db = firebase.database();
  const data = { name, blessing: blessing || "No message", timestamp: Date.now() };

  db.ref('weddingGifts/' + currentGift.id).set(data)
    .then(() => {
      alert(`Thank you ${name}! Your gift is recorded.`);
      closeModal();
    })
    .catch(() => alert('Network error'));
}

// === ADMIN PORTAL - FULLY WORKING ===
function openAdminPortal() {
  const pass = prompt("Admin password?", "");
  if (pass !== "0411") return alert("Wrong password!");
  
  document.getElementById('admin-modal').style.display = 'flex';
  document.getElementById('undo-form').style.display = 'none';
  document.getElementById('log-content').style.display = 'none';
  document.getElementById('admin-pass').value = '';
}

function showUndoForm() {
  document.getElementById('undo-form').style.display = 'block';
  document.getElementById('log-content').style.display = 'none';
  
  const select = document.getElementById("gift-to-reset");
  select.innerHTML = '<option value="">-- Select to undo --</option>';
  
  if (Object.keys(window.claimedData).length === 0) {
    select.innerHTML += '<option disabled>No gifts claimed yet</option>';
    return;
  }

  Object.keys(window.claimedData).forEach(id => {
    const g = gifts.find(x => x.id == id);
    const rec = window.claimedData[id];
    if (g && rec) {
      const opt = new Option(`${g.name} — ${rec.name} (${new Date(rec.timestamp).toLocaleString()})`, id);
      select.add(opt);
    }
  });
}

function showLog() {
  document.getElementById('undo-form').style.display = 'none';
  document.getElementById('log-content').style.display = 'block';
  renderLog();  // ← NOW CALLED
}

function renderLog() {
  const logs = Object.entries(window.claimedData)
    .map(([id, rec]) => {
      const g = gifts.find(x => x.id == id);
      return { ...rec, giftName: g?.name || 'Unknown' };
    })
    .sort((a,b) => b.timestamp - a.timestamp);

  const rows = logs.map(l => `
    <tr>
      <td><strong>${l.giftName}</strong></td>
      <td>${l.name}</td>
      <td style="max-width:200px; word-wrap:break-word;">${l.blessing}</td>
      <td>${new Date(l.timestamp).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = logs.length ? `
    <table id="log-table">
      <tr><th>Gift</th><th>Name</th><th>Blessing</th><th>Time</th></tr>
      ${rows}
    </table>
  ` : '<p style="text-align:center; color:#aaa;">No gifts recorded yet.</p>';
  
  const logContent = document.getElementById('log-content');
  if (logContent) logContent.innerHTML = html;
}

function performReset() {
  const pass = document.getElementById("admin-pass").value;
  if (pass !== "0411") return alert("Wrong password!");
  
  const id = document.getElementById("gift-to-reset").value;
  if (!id) return alert("Please select a gift");
  
  firebase.database().ref('weddingGifts/' + id).remove()
    .then(() => {
      alert("Gift undone successfully!");
      document.getElementById('admin-modal').style.display = "none";
    })
    .catch(err => alert("Error: " + err.message));
}

// Close modals
window.onclick = e => {
  const modal = document.getElementById('modal');
  const admin = document.getElementById('admin-modal');
  const zoom = document.getElementById('zoom-modal');
  if (e.target === modal) closeModal();
  if (e.target === admin) admin.style.display = 'none';
  if (e.target === zoom) document.getElementById('zoom-modal').style.display = 'none';
};
