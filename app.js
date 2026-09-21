"use strict";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const $ = (id) => document.getElementById(id);

const SECTIONS = [
  { id: "strengths", num: "01", en: "BUFFS", title: "強み" },
  { id: "experience", num: "02", en: "QUEST LOG", title: "経験領域" },
  { id: "skills", num: "03", en: "LOADOUT", title: "スキル" },
  { id: "principles", num: "04", en: "RULES OF ENGAGEMENT", title: "開発の流儀" },
  { id: "learning", num: "05", en: "NEXT STREAM", title: "学習中・取り組み中" }
];
const TIERS = ["MAIN WEAPON", "SIDEARM", "IN TRAINING"];

/* ---------- DOM helpers ---------- */
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.cls) node.className = opts.cls;
  if (opts.id) node.id = opts.id;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.i != null) node.style.setProperty("--i", opts.i);
  for (const [k, v] of Object.entries(opts.attrs || {})) node.setAttribute(k, v);
  for (const c of children) node.appendChild(c);
  return node;
}
const tags = (items, cls = "") => el("div", { cls: `tag-row ${cls}`.trim() }, items.map((t) => el("span", { text: t })));
const panel = (children) => el("div", { cls: "panel" }, [el("div", { cls: "inner" }, children)]);

function sectionHead(s) {
  const title = el("h2", { cls: "sec-title", text: s.title, attrs: { "data-scramble": s.title } });
  return el("div", { cls: "sec-head rv" }, [
    el("span", { cls: "sec-num", text: s.num, attrs: { "aria-hidden": "true" } }),
    el("div", {}, [el("span", { cls: "sec-en", text: s.en }), title])
  ]);
}
function section(s, body) {
  const node = el("section", { id: s.id, attrs: { "data-hud": `${s.num} // ${s.en}` } }, [sectionHead(s), body]);
  return node;
}

/* ---------- Renderers ---------- */
function renderHero(d) {
  const h1 = $("headline");
  const phrases = d.headline.split(/(?<=、)/);
  h1.setAttribute("data-text", phrases.join("\n"));
  const key = "生成AI";
  h1.replaceChildren(...phrases.map((ph) => {
    const line = el("span", { cls: "ph" });
    const at = ph.indexOf(key);
    if (at < 0) { line.textContent = ph; return line; }
    line.append(ph.slice(0, at), el("em", { text: key }), ph.slice(at + key.length));
    return line;
  }));
  $("summary").textContent = d.summary;

  const skillCount = d.skills.reduce((n, s) => n + s.items.length, 0);
  const stats = [
    ["経験領域", d.experience.length],
    ["スキル", skillCount],
    ["開発の流儀", d.principles.length]
  ];
  $("stats").replaceChildren(...stats.map(([label, n]) =>
    el("div", { cls: "stat" }, [el("b", { text: "0", attrs: { "data-count": n } }), el("span", { text: label })])));
}

function renderStrengths(d) {
  const items = d.strengths.map((s, i) =>
    el("div", { cls: "alert rv", i }, [panel([
      el("span", { cls: "alert-label", text: "BUFF UNLOCKED" }),
      el("h3", { text: s.title }),
      el("p", { text: s.body })
    ])]));
  return el("div", { cls: "alerts" }, items);
}

function renderExperience(d) {
  const quests = d.experience.map((e, i) =>
    el("article", { cls: "quest rv" }, [panel([
      el("div", { cls: "quest-inner" }, [
        el("div", {}, [
          el("span", { cls: "q-id", text: `Q-${String(i + 1).padStart(2, "0")}` }),
          el("h3", { text: e.area }),
          el("p", { cls: "q-sum", text: e.summary }),
          tags(e.tech, "hot")
        ]),
        el("ul", { cls: "q-points" }, e.points.map((p) => el("li", { text: p })))
      ])
    ])]));
  return el("div", { cls: "quests" }, quests);
}

function renderSkills(d) {
  const slots = d.skills.map((s, i) =>
    el("div", { cls: "slot rv", i, attrs: { "data-tier": String(i) } }, [panel([
      el("div", { cls: "slot-label", text: TIERS[i] || "SLOT" }),
      el("h3", { text: s.level }),
      tags(s.items)
    ])]));
  return el("div", { cls: "loadout" }, slots);
}

function renderPrinciples(d) {
  const rows = d.principles.map((p, i) =>
    el("div", { cls: "msg rv", i: Math.min(i, 4) }, [
      el("span", { cls: "msg-id", text: `#${String(i + 1).padStart(2, "0")}` }),
      el("div", {}, [el("strong", { text: p.title }), el("p", { text: p.body })])
    ]));
  return el("div", { cls: "rv" }, [panel([
    el("div", { cls: "chat-head" }, [el("i"), el("span", { text: "Pinned rules" })]),
    ...rows
  ])]);
}

function renderLearning(d) {
  const rows = d.learning.map((t) => el("li", {}, [el("b", { text: "NEXT ▶" }), el("span", { text: t })]));
  return el("div", { cls: "rv" }, [panel([el("ul", { cls: "next" }, rows)])]);
}

function renderRail() {
  $("rail").replaceChildren(...SECTIONS.map((s) =>
    el("a", { attrs: { href: `#${s.id}`, "data-for": s.id } }, [el("b", { text: s.num }), el("span", { text: s.en })])));
}

function renderTicker(d) {
  const words = d.skills.flatMap((s) => s.items);
  const one = words.flatMap((w) => [el("span", { text: w }), el("span", { text: "//" })]);
  const two = words.flatMap((w) => [el("span", { text: w }), el("span", { text: "//" })]);
  $("ticker").replaceChildren(...one, ...two);
}

function renderEnd(d) {
  const end = $("end");
  end.append(el("span", { text: "End of stream" }));
  const upd = el("span", { text: "最終更新 " }, [el("b", { text: d.updated_at })]);
  end.append(upd);
}

function render(d) {
  document.title = d.title;
  renderHero(d);
  renderRail();
  renderTicker(d);
  const bodies = {
    strengths: renderStrengths, experience: renderExperience, skills: renderSkills,
    principles: renderPrinciples, learning: renderLearning
  };
  $("sections").replaceChildren(...SECTIONS.map((s) => section(s, bodies[s.id](d))));
  renderEnd(d);
}

/* ---------- Effects ---------- */
const GLYPHS = "▮▯<>/\\[]{}=+*#_01アイウエオカキクケコ";
function scramble(node, final, duration = 700) {
  if (reduceMotion) return;
  node.setAttribute("aria-label", final);
  const start = performance.now();
  (function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const fixed = Math.floor(p * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      out += i < fixed || final[i] === " " ? final[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    node.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function countUp(node) {
  const to = Number(node.dataset.count);
  if (reduceMotion) { node.textContent = String(to); return; }
  const start = performance.now();
  (function tick(now) {
    const p = Math.min(1, (now - start) / 900);
    node.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = e.target;
      n.classList.add("in");
      n.querySelectorAll("[data-scramble]").forEach((t) => scramble(t, t.dataset.scramble));
      n.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(n);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach((n) => io.observe(n));
}

function setupActiveSection() {
  const secs = [...document.querySelectorAll("section[data-hud]")];
  let queued = false;
  const update = () => {
    queued = false;
    const mid = innerHeight * 0.45;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= mid) cur = s;
    $("hudSection").textContent = cur.dataset.hud;
    document.querySelectorAll(".rail a").forEach((a) => a.classList.toggle("on", a.dataset.for === cur.id));
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

function setupClock() {
  const t0 = Date.now();
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const s = Math.floor((Date.now() - t0) / 1000);
    $("clock").textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  };
  tick();
  setInterval(tick, 1000);
}

function setupTilt() {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll(".panel").forEach((p) => {
    p.addEventListener("pointermove", (e) => {
      const r = p.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      p.style.setProperty("--mx", `${px * 100}%`);
      p.style.setProperty("--my", `${py * 100}%`);
      p.style.setProperty("--rx", `${(0.5 - py) * 3}deg`);
      p.style.setProperty("--ry", `${(px - 0.5) * 4}deg`);
    });
    p.addEventListener("pointerleave", () => {
      p.style.setProperty("--rx", "0deg");
      p.style.setProperty("--ry", "0deg");
    });
  });
}

function setupReticle() {
  if (reduceMotion || !finePointer) return;
  const r = $("reticle");
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; r.classList.add("on"); });
  document.addEventListener("pointerleave", () => r.classList.remove("on"));
  document.addEventListener("pointerover", (e) => r.classList.toggle("hot", !!e.target.closest("a, .panel")));
  (function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    r.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

function setupBackground() {
  const cv = $("bg");
  const ctx = cv.getContext("2d");
  let w = 0, h = 0, mx = 0.5, vpx = 0, t = 0, running = true;
  let streaks = [];
  const COLORS = ["25,243,255", "255,46,136", "252,238,10"];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    streaks = Array.from({ length: Math.max(8, Math.round(w / 90)) }, () => ({
      x: Math.random() * w, y: Math.random() * h * 0.62,
      len: 30 + Math.random() * 90, v: 0.4 + Math.random() * 1.4,
      c: COLORS[Math.floor(Math.random() * COLORS.length)], a: 0.12 + Math.random() * 0.3
    }));
    vpx = w / 2;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const hz = h * 0.62;
    vpx += ((w / 2 + (mx - 0.5) * w * 0.1) - vpx) * 0.05;

    const glow = ctx.createLinearGradient(0, hz - 140, 0, hz + 60);
    glow.addColorStop(0, "rgba(255,46,136,0)");
    glow.addColorStop(0.7, "rgba(255,46,136,0.10)");
    glow.addColorStop(1, "rgba(25,243,255,0.02)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, hz - 140, w, 200);

    for (const s of streaks) {
      ctx.fillStyle = `rgba(${s.c},${s.a})`;
      ctx.fillRect(s.x, s.y, 1.5, s.len);
      if (running && !reduceMotion) {
        s.y += s.v;
        if (s.y > hz) { s.y = -s.len; s.x = Math.random() * w; }
      }
    }

    ctx.lineWidth = 1;
    for (let i = -24; i <= 24; i++) {
      ctx.strokeStyle = "rgba(25,243,255,0.13)";
      ctx.beginPath();
      ctx.moveTo(vpx + i * 10, hz);
      ctx.lineTo(vpx + i * (w / 10), h);
      ctx.stroke();
    }
    const rows = 14;
    for (let k = 0; k < rows; k++) {
      const p = ((k + t) % rows) / rows;
      const y = hz + (h - hz) * p * p;
      ctx.strokeStyle = `rgba(25,243,255,${0.04 + 0.26 * p})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(252,238,10,0.2)";
    ctx.beginPath();
    ctx.moveTo(0, hz);
    ctx.lineTo(w, hz);
    ctx.stroke();
  }

  function loop() {
    if (running) { t += 0.012; draw(); }
    requestAnimationFrame(loop);
  }
  addEventListener("resize", () => { resize(); draw(); });
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; });
  document.addEventListener("visibilitychange", () => { running = !document.hidden; });
  resize();
  draw();
  if (!reduceMotion) loop();
}

function setupBoot() {
  const boot = $("boot");
  const log = $("bootlog");
  const finish = () => {
    boot.classList.add("done");
    try { sessionStorage.setItem("booted", "1"); } catch (e) { /* storage may be blocked */ }
  };
  let seen = false;
  try { seen = sessionStorage.getItem("booted") === "1"; } catch (e) { /* ignore */ }
  if (reduceMotion || seen) { finish(); return; }

  const lines = [
    "> BOOT PORTFOLIO.EXE",
    "> LOAD PROFILE ........ <span class='ok'>OK</span>",
    "> SYNC SKILL TREE ..... <span class='ok'>OK</span>",
    "> CHECK LICENSES ...... <span class='ok'>OK</span>",
    "> STREAM .............. <span class='ok'>ONLINE</span>"
  ];
  let n = 0;
  const timer = setInterval(() => {
    log.innerHTML = lines.slice(0, ++n).join("\n") + "\n<span class='skip'>click to skip</span>";
    if (n >= lines.length) { clearInterval(timer); setTimeout(finish, 450); }
  }, 260);
  const skip = () => { clearInterval(timer); finish(); };
  boot.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });
}

/* ---------- Start ---------- */
setupBoot();
setupBackground();

fetch("data.json", { cache: "no-store" })
  .then((res) => res.json())
  .then((d) => {
    render(d);
    setupReveal();
    setupActiveSection();
    setupClock();
    setupTilt();
    setupReticle();
  })
  .catch(() => {
    $("error").hidden = false;
    $("boot").classList.add("done");
  });
