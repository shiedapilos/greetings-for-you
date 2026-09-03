(function () {
  const envelope = document.getElementById("envelope");
  const hint = document.getElementById("hint");
  const replay = document.getElementById("replay");
  const stage = document.getElementById("stage");
  const dust = document.getElementById("dust");
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ---------- static background dust ----------
  const dustColors = ["#d4a017", "#c1440e", "#fff8ed"];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    const size = 3 + Math.random() * 4;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.background = dustColors[i % dustColors.length];
    dust.appendChild(s);
  }

  // ---------- confetti canvas setup ----------
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const confettiColors = [
    "#d4a017",
    "#c1440e",
    "#2a9d8f",
    "#e8618c",
    "#fff8ed",
  ];
  let particles = [];
  let rafId = null;

  function makeParticle(x, y, burst) {
    const angle = burst
      ? Math.random() * Math.PI * 2
      : Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = burst ? 4 + Math.random() * 9 : 1 + Math.random() * 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed * (burst ? 1 : 0.3),
      vy: burst ? Math.sin(angle) * speed - 4 : speed,
      size: 5 + Math.random() * 6,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? "rect" : "circle",
      life: 0,
      maxLife: 130 + Math.random() * 90,
      gravity: 0.16 + Math.random() * 0.08,
    };
  }

  function burstAt(x, y, count) {
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle(x, y, true));
    }
  }

  let rainTimer = null;
  function startRain(duration) {
    const end = performance.now() + duration;
    clearInterval(rainTimer);
    rainTimer = setInterval(() => {
      if (performance.now() > end) {
        clearInterval(rainTimer);
        return;
      }
      particles.push(makeParticle(Math.random() * canvas.width, -20, false));
    }, 60);
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life++;

      const fade = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    particles = particles.filter(
      (p) => p.life < p.maxLife && p.y < canvas.height + 40,
    );

    if (particles.length > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function launchConfetti() {
    const rect = envelope.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top;

    if (prefersReducedMotion) {
      burstAt(originX, originY, 24);
    } else {
      burstAt(originX, originY, 90);
      startRain(3200);
    }

    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  // ---------- gentle celebratory chime ----------
  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ac = new AudioCtx();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ac.currentTime + i * 0.11;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain).connect(ac.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch (e) {
      /* audio not available, silently skip */
    }
  }

  // ---------- open / close ----------
  let isOpen = false;

  function openCard() {
    if (isOpen) return;
    isOpen = true;
    envelope.classList.add("open");
    stage.classList.add("opened");
    hint.style.opacity = "0";
    playChime();
    setTimeout(launchConfetti, 350);
  }

  function closeCard() {
    isOpen = false;
    envelope.classList.remove("open");
    stage.classList.remove("opened");
  }

  envelope.addEventListener("click", () => {
    if (!isOpen) openCard();
  });

  replay.addEventListener("click", (e) => {
    e.stopPropagation();
    closeCard();
    setTimeout(() => (hint.style.opacity = "0.9"), 500);
  });
})();
