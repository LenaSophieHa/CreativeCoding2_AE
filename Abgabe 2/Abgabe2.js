// Canvas vorbereiten
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Canvas Größe an Fenster anpassen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Mausposition
const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  active: false
};

// Pause-Status
let paused = false;

// Ball-Objekt
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 200,
  vy: -150,
  radius: 18
};

// Mausbewegung
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});

// Klick → Ball springt zur Maus
window.addEventListener("click", () => {
  ball.x = mouse.x;
  ball.y = mouse.y;

  ball.vx = (Math.random() - 0.5) * 400;
  ball.vy = (Math.random() - 0.5) * 400;
});

// Leertaste → Pause
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    paused = !paused;
  }
});

// Animations-Loop
let lastTime = performance.now();

function animate(time) {
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  if (!paused) {
    // Magnet-Effekt zur Maus
    if (mouse.active) {
      const dx = mouse.x - ball.x;
      const dy = mouse.y - ball.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      ball.vx += (dx / distance) * 5;
      ball.vy += (dy / distance) * 5;
    }

    // Bewegung
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime;

    // Wände
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.vx *= -1;
    }

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
      ball.vy *= -1;
    }

    // Leichte Reibung
    ball.vx *= 0.99;
    ball.vy *= 0.99;
  }

  // Hintergrund löschen
  ctx.fillStyle = "#0f1115";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ball zeichnen
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#00c8ff";
  ctx.fill();

  // Status anzeigen
  document.getElementById("status").textContent =
    paused ? "Status: PAUSIERT" : "Status: LÄUFT";

  requestAnimationFrame(animate);
}

// Start
requestAnimationFrame(animate);
