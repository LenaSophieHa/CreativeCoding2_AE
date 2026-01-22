const c = document.getElementById("c"); // Holt das Canvas-Element aus dem HTML
const x = c.getContext("2d"); // Erstellt den 2D-Zeichenkontext für das Canvas

const h = document.getElementById("h"); // Farb-Slider (Hue)
const s = document.getElementById("s"); // Größen-Slider
const sw = document.getElementById("sw"); // Farb-Vorschau-Kreis
const m = document.getElementById("m"); // Button für Musik an/aus
const clr = document.getElementById("clr"); // Button zum Löschen
const info = document.getElementById("info"); // Anzeige für Netzwerk-Infos

let P = []; // Array, das alle Partikel eines Feuerwerks speichert
let run = 0; // Gibt an, ob die Animationsschleife gerade läuft

let on = 0; // Merkt sich, ob Musik aktiviert ist
let ac; // AudioContext der Web Audio API
let osc; // Oszillator für den Ton

const webRoomsWebSocketServerAddr = 'wss://nosch.uber.space/web-rooms/'; // Addresse vom WebSocket Server

let clientId = null; // Eigene ID im Web Room
let clientCount = 0; // Anzahl verbundener Clients

let W = innerWidth; // Breite des Canvas in CSS-Pixeln
let H = innerHeight; // Höhe des Canvas in CSS-Pixeln

const fit = () => { // Funktion passt Canvas an Fenstergröße an
  const d = devicePixelRatio || 1; // Pixeldichte des Geräts (z. B. Retina)
  c.width = innerWidth * d; // Setzt Canvas-Breite in Device-Pixeln
  c.height = innerHeight * d; // Setzt Canvas-Höhe in Device-Pixeln
  x.setTransform(d, 0, 0, d, 0, 0); // Skaliert Zeichenkoordinaten zurück auf CSS-Pixel
  W = c.width / d; // Effektive Zeichenbreite merken
  H = c.height / d; // Effektive Zeichenhöhe merken
  draw(); // Canvas neu zeichnen
};

addEventListener("resize", fit); // Reagiert auf Größenänderungen
fit(); // Initiales Anpassen beim Laden

const colFromHue = hh => `hsl(${hh},100%,60%)`; // Wandelt Hue-Wert in eine HSL-Farbe um
const col = () => colFromHue(h.value); // Liefert aktuell ausgewählte Farbe
sw.style.background = col(); // Setzt initiale Farbvorschau
h.oninput = () => sw.style.background = col(); // Aktualisiert Vorschau beim Slider-Bewegen

const tone = f => { // Spielt einen kurzen Ton
  if (!on) return; // Wenn Musik aus ist, nichts tun,„Spiele nur dann einen Ton, wenn on auf true steht, sonst brich sofort ab.“
  ac ||= new (AudioContext || webkitAudioContext)(); // AudioContext nur einmal erzeugen, danach immer den gleichen
  try { osc?.stop?.(); } catch {} // Alten Oszillator sicher stoppen, Programm soll dabei nicht abstürzen, catch fängt alle Fehler ab
  osc = ac.createOscillator(); // Neuen Oszillator erzeugen
  const g = ac.createGain(); // Gain-Knoten für Lautstärke, Lautstärkeregler
  osc.frequency.value = f; // Frequenz setzen, Tonhöhe des f wird auf osc eingestellt
  g.gain.value = 0.03; // Anfangslautstärke
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12); // Lass den Ton nach etwa innerhalb 0,12s ausklingen
  osc.connect(g); // Oszillator mit Gain verbinden, Tonerzeuger an Lautstärkeregler anschließen
  g.connect(ac.destination); // Gain mit Lautsprecher verbinden
  osc.start(); // Ton starten
  osc.stop(ac.currentTime + 0.12); // Ton automatisch nach 0,12s beenden
};

m.onclick = () => { // Klick auf Musik-Button
  on = !on; // Musikstatus umschalten, Wert wird umgekejrt, „Schalte die Musik an oder aus, je nachdem, was vorher war.“
  m.textContent = "Music: " + (on ? "On" : "Off"); // Button-Text aktualisieren
  if (on) ac?.resume?.(); // Wenn Musik eingeschaltet ist dann aktiviere Audio
};

clr.onclick = () => { // Klick auf Clear-Button
  P = []; // Alle Partikel löschen
  run = 0; // Animation stoppen
  x.clearRect(0, 0, W, H); // Canvas transparent löschen, damit Hintergrundbild sichtbar bleibt
  sendRequest('*broadcast-message*', ['fw-clear', clientId]); // Clear an alle Clients senden
};

function spawnFirework(px, py, hue, size, fromNetwork = false) { // Erzeugt ein Feuerwerk
  const n = 30; // Anzahl Partikel
  const rad = size * 1.3; // Partikelradius
  const C = colFromHue(hue); // Farbe berechnen
  if (!fromNetwork) tone(200 + Math.random() * 400); // Ton nur lokal abspielen

  for (let i = 0; i < n; i++) { // wIEDERHOLE Code Für jedes der n Partikel
    const a = Math.random() * Math.PI * 2; // Erzeuge Zufälliger Winkel
    const v = 2 + Math.random() * 4; // Erzeuge Zufällige Geschwindigkeit
    P.push([px, py, Math.cos(a)*v, Math.sin(a)*v, rad, C, 25]); // Partikel speichern
  }

  if (!run) { // Falls Animation noch nicht läuft
    run = 1; // Animation aktivieren
    requestAnimationFrame(loop); // Animationsschleife starten
  }

  if (!fromNetwork) { // Nur lokale Events senden
    sendRequest('*broadcast-message*', ['fw', px/W, py/H, hue, size, clientId]); // Normalisierte Daten senden
  }
}

c.onpointerdown = e => { // Klick / Touch auf Canvas
  if (on) ac?.resume?.(); // Audio auf Mobile entsperren
  const r = c.getBoundingClientRect(); // Canvas-Position im Dokument
  spawnFirework(e.clientX - r.left, e.clientY - r.top, +h.value, +s.value, false); // Feuerwerk erzeugen
};

function draw() { // Zeichnet alle Partikel
  x.clearRect(0, 0, W, H); // /* FIX */ Transparent statt Hintergrundfarbe, damit Bild sichtbar bleibt
  for (const q of P) { // Alle Partikel
    x.fillStyle = q[5]; // Partikelfarbe
    x.beginPath();
    x.arc(q[0], q[1], q[4], 0, Math.PI*2); // Kreis zeichnen
    x.fill();
  }
}

function loop() { // Animationsschleife
  let moving = 0; // Prüft, ob noch Partikel leben
  x.clearRect(0, 0, W, H); // /* FIX */ Transparent löschen statt füllen

  for (const q of P) {
    if (q[6] > 0) { // Lebensdauer prüfen
      q[0] += q[2]; // X-Position
      q[1] += q[3]; // Y-Position
      q[3] += 0.06; // Gravitation
      q[6]--; // Lebensdauer verringern
      moving = 1;
    }
    x.fillStyle = q[5];
    x.beginPath();
    x.arc(q[0], q[1], q[4], 0, Math.PI*2);
    x.fill();
  }

  if (moving) requestAnimationFrame(loop); // Weiter animieren
  else run = 0; // Animation stoppen
}

const socket = new WebSocket(webRoomsWebSocketServerAddr); // WebSocket-Verbindung herstellen

function sendRequest(...message) { // Hilfsfunktion zum Senden
  if (socket.readyState !== 1) return; // Nur senden wenn verbunden
  socket.send(JSON.stringify(message)); // Nachricht senden
}

socket.addEventListener('open', () => { // Verbindung geöffnet
  sendRequest('*enter-room*', 'fireworks'); // Raum betreten
  sendRequest('*subscribe-client-count*'); // Client-Anzahl abonnieren
  sendRequest('*subscribe-client-enter-exit*'); // Join/Leave abonnieren
  setInterval(() => socket.send(''), 30000); // Keepalive
});

socket.addEventListener('close', () => { // Verbindung geschlossen
  clientId = null;
  document.body.classList.add('disconnected'); // Offline anzeigen
  updateInfo();
});

socket.addEventListener('message', e => { // Nachricht empfangen
  let d;
  try { d = JSON.parse(e.data); } catch { return; } // Sicher parsen
  if (d[0] === '*client-id*') clientId = d[1]; // Eigene ID setzen
  if (d[0] === '*client-count*') clientCount = d[1]; // Anzahl aktualisieren
  if (d[0] === 'fw' && d[5] !== clientId) spawnFirework(d[1]*W, d[2]*H, d[3], d[4], true); // Remote-Feuerwerk
  if (d[0] === 'fw-clear') { P=[]; run=0; x.clearRect(0,0,W,H); } // /* FIX */ Remote-Clear transparent machen
  updateInfo();
});

function updateInfo() {
  info.textContent = clientId ? `#${clientId}/${clientCount}` : ''; // Info anzeigen
}




