// === HANNAH & VICTOR WEDDING - BLESSING + PAYMENT ===

const firebaseConfig = {
  databaseURL: "https://hannah-victor-wedding-default-rtdb.firebaseio.com/"  // CHANGE TO YOURS
};

let gifts = [];
let claimedData = {};

fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    loadFirebase();
  });

function loadFirebase() {
  const app = document.createElement('script');
  app.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js";
  app.onload = () => {
    const db = document.createElement('script');
    db.src = "https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js";
    db.onload = initFirebase;
    document.head.appendChild(db);
  };
  document.head.appendChild(app);
}

function initFirebase() {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  db.ref('weddingGifts').on('value', snap => {
    claimedData = snap.val() || {};
    applyClaimsAndRender();
  });
}

function applyClaimsAndRender() {
  gifts.forEach(g => {
    if (!g.isRedPocket && claimedData[g.id]) {
      g.claimed = true;
      g.claimedBy = claimedData[g.id].name || "Someone";
    } else if (!g.isRedPocket) {
      g.claimed = false;
    }
  });
  render();
}

function render() {
  const available = gifts.filter(g => g.isRedPocket || !g.claimed);
  const gifted = gifts.filter(g => g.claimed || (g.isRedPocket && claimedData[g.id]));

  document.getElementById('available').innerHTML = available.map(giftCard).join('');
  document.getElementById('gifted').innerHTML = gifted.map(giftedCard).join('');
}

function giftCard(g) {
  const rpClass = g.isRedPocket ? 'gift redpocket' : 'gift';
  const priceText = g.price === "Free" ? "Free" : (typeof g.price === 'number' ? `HK$ ${g.price}` : g.price);
  return `
    <div class="${rpClass}">
      <img src="${g.photo}" alt="${g.name}" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAo9W5xwAAAABJRU5ErkJggg=='">
      <div class="info">
        <strong>${g.name}</strong><br>
        <span class="price">${priceText}</span>
      </div>
      <button onclick="openModal(${g.id})">${g.id === 88 ? 'Send Blessing' : "I'll give this"}</button>
    </div>`;
}

function giftedCard(g) {
  let extra = '';
  if (g.id === 88 && claimedData[g.id]) {
    // For blessing: show message only
    const messages = Object.values(claimedData[g.id]).map(r => r.blessing || "No message");
    extra = messages.map(m => `<br><em style="font-size:14px; color:#e74c3c; font-style:italic;">“${m}”</em>`).join('');
  }

  return `
    <div class="gift" style="opacity:0.9; border:2px solid #27ae60;">
      <img src="${g.photo}" alt="${g.name}">
      <div class="info">
        <strong>${g.name}</strong><br>
        <em style="color:#27ae60;">Gifted</em>${extra}
      </div>
    </div>`;
}

let currentGift = null;
function openModal(id) {
  currentGift = gifts.find(g => g.id === id);
  if (!currentGift || (!currentGift.isRedPocket && currentGift.claimed)) return;

  document.getElementById('step-details').style.display = 'block';
  document.getElementById('step-payment').style.display = 'none';
  document.querySelectorAll('.qr').forEach(q => q.classList.remove('active'));
  document.getElementById('payme-link').style.display = 'none';
  document.getElementById('claimer-name').value = '';
  document.getElementById('blessing').value = '';

  document.getElementById('modal-img').src = currentGift.photo;
  document.getElementById('modal-name').textContent = currentGift.name;
  document.getElementById('modal-price').textContent = currentGift.price === "Free" ? "Free" : (typeof currentGift.price === 'number' ? 'HK$ ' + currentGift.price : currentGift.price);
  document.getElementById('modal-details').textContent = currentGift.details;

  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }
function closeZoom() { document.getElementById('zoom-modal').style.display = 'none'; }

function showPaymentStep() {
  document.getElementById('step-details').style.display = 'none';
  document.getElementById('step-payment').style.display = 'block';

  if (currentGift.id === 88) {
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('confirm-btn').textContent = "Send My Blessing";
  } else {
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('confirm-btn').textContent = "I've Paid – Record My Gift";
  }
}

function backToDetails() {
  document.getElementById('step-payment').style.display = 'none';
  document.getElementById('step-details').style.display = 'block';
}

function toggleQR(type) {
  const qr = document.getElementById('qr-' + type);
  const isActive = qr.classList.contains('active');
  document.querySelectorAll('.qr').forEach(q => q.classList.remove('active'));
  document.getElementById('payme-link').style.display = 'none';
  if (!isActive) {
    qr.classList.add('active');
    if (type === 'payme') document.getElementById('payme-link').style.display = 'block';
  }
}

function confirmGift() {
  const name = document.getElementById('claimer-name').value.trim();
  const blessing = document.getElementById('blessing').value.trim();
  if (!name) return alert('Please enter your name');

  const db = firebase.database();
  const data = { name, blessing: blessing || "No message", timestamp: Date.now() };

  if (currentGift.id === 88) {
    data.payment = "Blessing Only";
    db.ref('weddingGifts/' + currentGift.id).push(data)
      .then(() => { alert(`Thank you ${name}! Your blessing is recorded.`); closeModal(); })
      .catch(() => alert('Error'));
  } else {
    const activeQR = document.querySelector('.qr.active');
    if (!activeQR) return alert('Please select FPS or PayMe');
    data.payment = activeQR.id === 'qr-fps' ? 'FPS' : 'PayMe';
    db.ref('weddingGifts/' + currentGift.id).set(data)
      .then(() => { alert(`Thank you ${name}! Your gift is recorded.`); closeModal(); })
      .catch(() => alert('Error'));
  }
}

function zoomImage(src) {
  document.getElementById('zoomed-img').src = src;
  document.getElementById('zoom-modal').style.display = 'flex';
}

function openAdminPanel() {
  const pass = prompt("Admin password?", "");
  if (pass !== "0411") return alert("Wrong password!");
  const select = document.getElementById("gift-to-reset");
  select.innerHTML = '<option value="">-- Select to undo --</option>';
  Object.keys(claimedData).forEach(id => {
    const g = gifts.find(x => x.id == id);
    if (g) select.add(new Option(`${g.name} — ${claimedData[id].name}`, id));
  });
  if (select.options.length === 1) return alert("No gifts to undo!");
  document.getElementById("admin-modal").style.display = "flex";
}

function performReset() {
  if (document.getElementById("admin-pass").value !== "0411") return alert("Wrong password!");
  const id = document.getElementById("gift-to-reset").value;
  if (!id) return alert("Select a gift");
  firebase.database().ref('weddingGifts/' + id).remove()
    .then(() => { alert("Undone!"); document.getElementById("admin-modal").style.display = "none"; });
}

window.onclick = e => {
  if (e.target.classList.contains('modal')) {
    if (e.target.id === 'zoom-modal') closeZoom();
    else if (e.target.id === 'modal') closeModal();
    else if (e.target.id === 'admin-modal') e.target.style.display = 'none';
  }
};
