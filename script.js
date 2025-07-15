const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const placesContainer = document.getElementById("placesContainer");
const worker = new Worker("worker.js");
const placeType = document.getElementById("placeType");
const loadBtn = document.getElementById("loadPlaces");

let userLat = null;
let userLon = null;

// Get user's geolocation
navigator.geolocation.getCurrentPosition(
  (pos) => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    drawUserDot(userLat, userLon);
  },
  (err) => alert("Please allow location access for this app to work.")
);

loadBtn.addEventListener("click", async () => {
  if (!userLat || !userLon) return;

  placesContainer.innerHTML = ""; // Clear old results

  const query = placeType.value;
  const url = `https://nominatim.openstreetmap.org/search.php?q=${query}&lat=${userLat}&lon=${userLon}&format=jsonv2`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "GeoArtMapper/1.0 (student@example.com)"
    }
  });

  const data = await res.json();

  data.slice(0, 5).forEach(place => {
    createPlaceCard(place);
    worker.postMessage({
      userLat: userLat,
      userLon: userLon,
      place: {
        name: place.display_name,
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon)
      }
    });
  });
});

function drawUserDot(lat, lon) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00FF00";
  ctx.beginPath();
  ctx.arc(150, 150, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText("You", 130, 140);
}

function createPlaceCard(place) {
  const card = document.createElement("div");
  card.className = "place-card observer";
  card.innerHTML = `
    <h3>${place.display_name.split(',')[0]}</h3>
    <p>${place.display_name}</p>
    <p class="distance">Calculating distance...</p>
  `;
  placesContainer.appendChild(card);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.border = "2px solid #fff";
    }
  });
});
setTimeout(() => {
  document.querySelectorAll('.observer').forEach(card => observer.observe(card));
}, 1000);

worker.onmessage = (e) => {
  const { name, distance } = e.data;
  const cards = document.querySelectorAll('.place-card');
  cards.forEach(card => {
    if (card.innerHTML.includes(name.split(',')[0])) {
      const distancePara = card.querySelector('.distance');
      distancePara.textContent = `📍 ${distance.toFixed(2)} km away`;
    }
  });
};
