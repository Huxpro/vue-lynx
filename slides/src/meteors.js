/**
 * Meteors background — same recipe as website/theme,
 * but with theme-aware brand-color sourcing.
 */

const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };

class Meteor {
  constructor(gridSize, canvas) {
    this.gridSize = gridSize;
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.direction = Math.floor(Math.random() * 4);
    this.speed = 2 + Math.random() * 3;
    this.length = this.gridSize * (1 + Math.random() * 2);
    this.opacity = 0.55 + Math.random() * 0.35;

    const middle = (size) => {
      const margin = size * 0.2;
      return margin + Math.random() * (size * 0.6);
    };

    switch (this.direction) {
      case DIR.UP:
        this.x =
          Math.floor(middle(this.canvas.width) / this.gridSize) * this.gridSize;
        this.y = this.canvas.height;
        break;
      case DIR.RIGHT:
        this.x = 0;
        this.y =
          Math.floor(middle(this.canvas.height) / this.gridSize) *
          this.gridSize;
        break;
      case DIR.DOWN:
        this.x =
          Math.floor(middle(this.canvas.width) / this.gridSize) * this.gridSize;
        this.y = 0;
        break;
      case DIR.LEFT:
        this.x = this.canvas.width;
        this.y =
          Math.floor(middle(this.canvas.height) / this.gridSize) *
          this.gridSize;
        break;
    }
  }

  update() {
    switch (this.direction) {
      case DIR.UP:
        this.y -= this.speed;
        if (this.y + this.length < 0) this.reset();
        break;
      case DIR.RIGHT:
        this.x += this.speed;
        if (this.x > this.canvas.width) this.reset();
        break;
      case DIR.DOWN:
        this.y += this.speed;
        if (this.y > this.canvas.height) this.reset();
        break;
      case DIR.LEFT:
        this.x -= this.speed;
        if (this.x + this.length < 0) this.reset();
        break;
    }
  }

  draw(ctx) {
    let endX = this.x;
    let endY = this.y;
    switch (this.direction) {
      case DIR.UP: endY = this.y + this.length; break;
      case DIR.RIGHT: endX = this.x - this.length; break;
      case DIR.DOWN: endY = this.y - this.length; break;
      case DIR.LEFT: endX = this.x + this.length; break;
    }
    const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
    gradient.addColorStop(0, `rgba(66, 184, 131, ${this.opacity})`);
    gradient.addColorStop(0.02, `rgba(66, 184, 131, ${this.opacity * 0.8})`);
    gradient.addColorStop(0.05, `rgba(0, 221, 255, ${this.opacity * 0.6})`);
    gradient.addColorStop(1, 'rgba(0, 221, 255, 0)');
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

export function mountMeteors(canvas, { gridSize = 120, meteorCount = 3 } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  // Coarse-pointer / phone: keep the backing store small — the full-bleed
  // canvas otherwise mirrors devicePixelRatio×viewport into GPU memory on
  // every frame, which compounds with slide media on iOS Safari.
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 2);
  const count = coarse ? Math.min(meteorCount, 2) : meteorCount;

  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const meteors = Array.from(
    { length: count },
    () =>
      new Meteor(gridSize, {
        get width() { return canvas.width / dpr; },
        get height() { return canvas.height / dpr; },
      }),
  );

  let raf = 0;
  let running = false;

  // Skip the RAF loop when the canvas is fully faded (data-bg=clean) or the
  // tab is hidden — opacity:0 still composites a full-size layer every frame.
  const shouldRun = () => {
    if (document.hidden) return false;
    const deck = canvas.closest('.deck') || document.querySelector('.deck');
    if (deck?.dataset?.bg === 'clean') return false;
    const op = Number.parseFloat(getComputedStyle(canvas).opacity);
    return !(Number.isFinite(op) && op < 0.02);
  };

  const tick = () => {
    raf = 0;
    if (!shouldRun()) {
      running = false;
      return;
    }
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // grid
    const gridStroke = document.documentElement.classList.contains('dark')
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(15, 18, 22, 0.06)';
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    meteors.forEach((m) => { m.update(); m.draw(ctx); });
    raf = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (running || !shouldRun()) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };

  document.addEventListener('visibilitychange', kick);
  document.addEventListener('deck:change', kick);
  // dataset.bg flips via main.js applyChromeAndBg — observe so clean↔beam
  // transitions restart/stop the loop without waiting for another navigate.
  const deck = canvas.closest('.deck') || document.querySelector('.deck');
  const bgObs = deck
    ? new MutationObserver(kick)
    : null;
  bgObs?.observe(deck, { attributes: true, attributeFilter: ['data-bg'] });

  kick();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    running = false;
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', kick);
    document.removeEventListener('deck:change', kick);
    bgObs?.disconnect();
  };
}
