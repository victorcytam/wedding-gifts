// Load gifts
let gifts = [];
fetch('gifts.json')
  .then(r => r.json())
  .then(data => {
    gifts = data;
    loadFromStorage();
    render();
  });

// Load claimed data from browser
function loadFromStorage() {
  const saved = localStorage.getItem('weddingGifts');
  if (saved) {
    const claimed = JSON.parse(saved);
    gifts.forEach(g => {
      if (claimed[g.id]) {
        g.claimed = true;
        g.claimedBy = claimed[g.id];
      }
    });
  }
}

// Save to browser
function saveToStorage() {
  const map = {};
  gifts.forEach(g => { if (g.claimed) map[g.id] = g.claimedBy; });
  localStorage.setItem('weddingGifts', JSON.stringify(map));
}

// Render lists
function render() {
  const avail = gifts.filter(g => !g.claimed);
  const done  = gifts.filter(g => g.claimed);

  document.getElementById('available').innerHTML = avail.map(giftCard).join('');
  document.getElementById('gifted').innerHTML     = done.map(giftedCard).join('');
}

// Gift card (available)
function giftCard(g) {
  return `
    <div class="gift">
      <img src="${g.photo}" alt="${g.name}" onerror="this.src='images/placeholder.png'">
      <div class="info">
        <strong>${g.name}</strong><br>
        <span class="price">HK$ ${g.price}</span>
      </div>
      <button onclick="openModal(${g.id})">I'll give this</button>
    </div>`;
}

// Gifted card
function giftedCard(g) {
  return `
    <div class="gift" style="opacity:0.8;">
      <img src="${g.photo}" alt="${g.name}">
      <div class="info">
        <strong>${g.name}</strong><br>
        <em>Gifted by ${g.claimedBy || 'Anonymous'}</em>
      </div>
    </div>`;
}

// Modal logic
let currentGift = null;
function openModal(id) {
  currentGift = gifts.find(g => g.id === id);
  if (!currentGift || currentGift.claimed) return;

  document.getElementById('modal-img').src = currentGift.photo;
  document.getElementById('modal-name').textContent = currentGift.name;
  document.getElementById('modal-price').textContent = currentGift.price;
  document.getElementById('claimer-name').value = '';
  document.getElementById('modal').style.display = 'flex';
}

// Close modal
document.querySelector('.close').onclick = () => {
  document.getElementById('modal').style.display = 'none';
};
window.onclick = e => {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
};

// Confirm claim
document.getElementById('confirm-btn').onclick = () => {
  const name = document.getElementById('claimer-name').value.trim();
  if (!name) { alert('Please enter your name'); return; }

  currentGift.claimed = true;
  currentGift.claimedBy = name;
  saveToStorage();
  render();
  document.getElementById('modal').style.display = 'none';
};
