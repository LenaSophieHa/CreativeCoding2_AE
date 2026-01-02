// Canvas vorbereiten
const canvas = document.getElementById("canvas"); // Greift auf das Canvas-Element zu
const ctx = canvas.getContext("2d"); // Erstellt den 2D-Zeichenkontext

// Canvas Größe an Fenster anpassen
function resizeCanvas() { // Funktion zur Anpassung der Canvas-Größe
  canvas.width = window.innerWidth; // Setzt die Breite auf Fensterbreite
  canvas.height = window.innerHeight; // Setzt die Höhe auf Fensterhöhe
}
window.addEventListener("resize", resizeCanvas); // Reagiert auf Fensteränderung
resizeCanvas(); // Initialer Aufruf

// Mausposition
const mouse = { // Objekt für Mausdaten
  x: canvas.width / 2, // Startposition X
  y: canvas.height / 2, // Startposition Y
  active: false // Maus wurde bewegt
};

// Pause-Status
let paused = false; // Steuert Pause und Weiter

// Ball-Objekt
const ball = { // Eigenschaften des Balls
  x: canvas.width / 2, // Start X
  y: canvas.height / 2, // Start Y
  vx: 200, // Geschwindigkeit X
  vy: -150, // Geschwindigkeit Y
  radius: 18 // Radius des Balls
};

// SOUND
let audioCtx = null; // AudioContext für Sound

function playSound() { // Spielt einen kurzen Ton
  if (!audioCtx) { // Prüft ob AudioContext existiert
    audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // Erstellt AudioContext
  }
  const osc = audioCtx.createOscillator(); // Erzeugt Oszillator, beep Ton
  osc.frequency.value = 450; // Setzt Tonhöhe
  osc.connect(audioCtx.destination); // Verbindet mit Lautsprechern
  osc.start(); // Startet Ton
  osc.stop(audioCtx.currentTime + 0.05); // Stoppt Ton nach kurzer Zeit
}

// Mausbewegung
window.addEventListener("mousemove", (e) => { // Reagiert auf Mausbewegung
  mouse.x = e.clientX; // Aktualisiert Maus X
  mouse.y = e.clientY; // Aktualisiert Maus Y
  mouse.active = true; // Maus ist aktiv
});

// Klick: Ball springt zur Maus
window.addEventListener("click", () => { // Reagiert auf Klick
  playSound(); // Aktiviert Audio

  ball.x = mouse.x; // Setzt Ball X auf Maus
  ball.y = mouse.y; // Setzt Ball Y auf Maus

  ball.vx = (Math.random() - 0.5) * 400; // Zufällige X Geschwindigkeit
  ball.vy = (Math.random() - 0.5) * 400; // Zufällige Y Geschwindigkeit
});

// Leertaste → Pause
window.addEventListener("keydown", (e) => { // Reagiert auf Tastatur
  if (e.code === "Space") { // Prüft Leertaste
    paused = !paused; // Wechselt Pause-Zustand
  }
});

// Animations-Loop
let lastTime = performance.now(); // Zeit des letzten Frames

function animate(time) { // Haupt-Animationsfunktion
  const deltaTime = (time - lastTime) / 1000; // Zeit seit letztem Frame
  lastTime = time; // Aktualisiert Zeit

  if (!paused) { // Nur wenn nicht pausiert
    if (mouse.active) { // Wenn Maus aktiv ist
      const dx = mouse.x - ball.x; // Abstand X zur Maus
      const dy = mouse.y - ball.y; // Abstand Y zur Maus
      const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Distanz zur Maus

      ball.vx += (dx / distance) * 5; // Beschleunigung Richtung Maus X
      ball.vy += (dy / distance) * 5; // Beschleunigung Richtung Maus Y
    }

    ball.x += ball.vx * deltaTime; // Bewegt Ball X
    ball.y += ball.vy * deltaTime; // Bewegt Ball Y

    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) { // Kollision links/rechts
      ball.vx *= -1; // Richtungswechsel X
      playSound(); // Sound abspielen
    }

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) { // Kollision oben/unten
      ball.vy *= -1; // Richtungswechsel Y
      playSound(); // Sound abspielen
    }

    ball.vx *= 0.99; // Reibung X
    ball.vy *= 0.99; // Reibung Y
  }

  ctx.fillStyle = "#0f1115"; // Hintergrundfarbe
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Hintergrund zeichnen

  ctx.beginPath(); // Neuer Pfad
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); // Ball zeichnen
  ctx.fillStyle = "#00c8ff"; // Ballfarbe
  ctx.fill(); // Ball füllen

  document.getElementById("status").textContent = // Statusanzeige
    paused ? "Status: PAUSIERT" : "Status: LÄUFT"; // Text je nach Zustand

  requestAnimationFrame(animate); // Nächster Frame
}

requestAnimationFrame(animate); // Start der Animation
