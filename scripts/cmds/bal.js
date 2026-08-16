"use strict";

// ═══════════════════════════════════════════════════════════════════════════════
//  BALANCE ULTIMATE — Carte de solde entièrement repensée
//  Auteur   : Christus
//  Concept  : carte d'identité premium avec photo de profil intégrée au Canvas
//             (même technique que pair.js), anneau de rang gravé, ticker de
//             solde façon "cristal", grille de statistiques et 22 thèmes visuels
//             entièrement différents (fonds peints + particules + bordures).
//  Aucun emoji nulle part — uniquement des symboles géométriques.
// ═══════════════════════════════════════════════════════════════════════════════

const fs     = require("fs-extra");
const path   = require("path");
const axios  = require("axios");
const fonts  = require("../../func/font.js");

// Applique automatiquement fonts.bold à toutes les réponses (police stylisée)
function _applyPolice(message) {
  if (!message || message.__police) return;
  message.__police = true;
  const _origReply = message.reply.bind(message);
  message.reply = (form, ...rest) => {
    if (typeof form === "string") form = fonts.bold(form);
    else if (form && typeof form === "object" && typeof form.body === "string")
      form = { ...form, body: fonts.bold(form.body) };
    return _origReply(form, ...rest);
  };
}
const moment = require("moment-timezone");

let loadImage, createCanvas, registerFont;
let canvasAvailable = false;
try {
  const cv = require("canvas");
  loadImage    = cv.loadImage;
  createCanvas = cv.createCanvas;
  registerFont = cv.registerFont;
  canvasAvailable = true;
} catch (e) { console.error("Canvas indisponible :", e.message); }

let fontsLoaded = false;
function ensureFonts() {
  if (fontsLoaded || !canvasAvailable || !registerFont) return;
  fontsLoaded = true;
  try {
    if (typeof __dirname !== "string") return;
    const fd = path.join(__dirname, "assets", "font");
    if (!fs.existsSync(fd)) return;
    const fontFiles = [
      ["BeVietnamPro-Bold.ttf",    "BF", "bold"],
      ["BeVietnamPro-Regular.ttf", "BF", "normal"],
      ["BeVietnamPro-SemiBold.ttf","BF", "600"],
      ["NotoSans-Bold.ttf",        "BF", "bold"],
      ["NotoSans-Regular.ttf",     "BF", "normal"],
    ];
    for (const [f, fam, w] of fontFiles) {
      try {
        const fp = path.join(fd, f);
        if (fs.existsSync(fp)) registerFont(fp, { family: fam, weight: w });
      } catch (_) {}
    }
  } catch (_) {}
}

const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIGURATION ÉCONOMIQUE (logique métier conservée)
// ═══════════════════════════════════════════════════════════════════════════════
const ECONOMY = {
  currency: { sym: "$" },
  transfer: {
    min: 10, max: 1_000_000,
    taxes: [
      { max: 1_000,   rate: 2  },
      { max: 10_000,  rate: 5  },
      { max: 50_000,  rate: 8  },
      { max: 100_000, rate: 10 },
      { max: 500_000, rate: 12 },
      { max: Infinity,rate: 15 },
    ],
  },
  daily: { base: 100, streakMult: 0.1, resetHours: 21 },
  tiers: [
    { name: "Starter", min: 0,       max: 999,      color: "#CD7F32", sym: "◈", mult: 1.0 },
    { name: "Rookie",  min: 1_000,   max: 4_999,    color: "#C0C0C0", sym: "◇", mult: 1.1 },
    { name: "Pro",     min: 5_000,   max: 19_999,   color: "#FFD700", sym: "◆", mult: 1.2 },
    { name: "Elite",   min: 20_000,  max: 49_999,   color: "#E8E8FF", sym: "◉", mult: 1.3 },
    { name: "Master",  min: 50_000,  max: 99_999,   color: "#00FFFF", sym: "▣", mult: 1.5 },
    { name: "Legend",  min: 100_000, max: 499_999,  color: "#FF00FF", sym: "▲", mult: 2.0 },
    { name: "GOD",     min: 500_000, max: Infinity, color: "#FF2020", sym: "◎", mult: 3.0 },
  ],
};

function formatMoney(n) {
  if (n == null || isNaN(n)) return `${ECONOMY.currency.sym}0`;
  n = Number(n);
  if (!isFinite(n)) return `${ECONOMY.currency.sym}∞`;
  const SCALES = [
    { v: 1e18, s: "Qi" }, { v: 1e15, s: "Qa" }, { v: 1e12, s: "T" },
    { v: 1e9,  s: "B"  }, { v: 1e6,  s: "M"  }, { v: 1e3,  s: "K" },
  ];
  const sc = SCALES.find(s => Math.abs(n) >= s.v);
  if (sc) {
    const v = (Math.abs(n) / sc.v).toFixed(2).replace(/\.00$/, "");
    return `${n < 0 ? "-" : ""}${ECONOMY.currency.sym}${v}${sc.s}`;
  }
  const p = Math.abs(n).toFixed(2).split(".");
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${ECONOMY.currency.sym}${p.join(".")}`;
}

function getTier(balance) {
  const b = Number(balance) || 0;
  const t = ECONOMY.tiers.find(t => b >= t.min && b <= t.max) || ECONOMY.tiers[0];
  const idx  = ECONOMY.tiers.indexOf(t);
  const next = ECONOMY.tiers[idx + 1] || null;
  const prog = t.max === Infinity ? 100 : Math.min(100, ((b - t.min) / (t.max - t.min)) * 100);
  return { ...t, next, prog, idx };
}

function calcTax(amount) {
  const { rate } = ECONOMY.transfer.taxes.find(r => amount <= r.max) || ECONOMY.transfer.taxes.at(-1);
  const tax = Math.ceil((amount * rate) / 100);
  return { rate, tax, total: amount + tax };
}

function txID() {
  return ("TX" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  22 THÈMES ULTRA-SPECTACULAIRES
//  Chaque thème = palette + style de particules + style de bordure.
//  Les fonctions de rendu sont partagées et paramétrées par thème (voir plus bas).
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  neon_tokyo:      { name: "Neon Tokyo",       sym: "◈", bg: ["#050510","#0a0620","#050510"], primary:"#ff0080", secondary:"#00ffff", tertiary:"#7700ff", text:"#ffffff", glow:"#ff0080", particle:"grid",     border:"neon",     tag:"Vitesse électrique" },
  galaxy_drift:    { name: "Galaxy Drift",     sym: "✦", bg: ["#000000","#0d0420","#000000"], primary:"#a855f7", secondary:"#6366f1", tertiary:"#ec4899", text:"#ffffff", glow:"#a855f7", particle:"stars",    border:"double",   tag:"Dérive cosmique" },
  sakura_dream:    { name: "Sakura Dream",     sym: "❖", bg: ["#fff0f3","#ffd6e8","#ff85b3"], primary:"#e91e8c", secondary:"#f06292", tertiary:"#ff80ab", text:"#3d0026", glow:"#f48fb1", particle:"petals",   border:"ornate",   tag:"Douceur printanière" },
  aurora_polaire:  { name: "Aurora Polaire",   sym: "◐", bg: ["#010a12","#031824","#010a12"], primary:"#00ff88", secondary:"#00ccff", tertiary:"#8800ff", text:"#ffffff", glow:"#00ff88", particle:"aurora",   border:"neon",     tag:"Lueurs du nord" },
  golden_royal:    { name: "Golden Royal",     sym: "◆", bg: ["#1a0e00","#2d1a00","#0d0700"], primary:"#ffd700", secondary:"#ffe680", tertiary:"#b8860b", text:"#fff3d6", glow:"#ffd700", particle:"bokeh",    border:"brackets", tag:"Prestige absolu" },
  obsidian_noir:   { name: "Obsidian Noir",    sym: "◎", bg: ["#050408","#0c0a14","#050408"], primary:"#9b59ff", secondary:"#5a2e9a", tertiary:"#2c1250", text:"#ede6ff", glow:"#9b59ff", particle:"smoke",    border:"double",   tag:"Élégance nocturne" },
  emerald_forest:  { name: "Emerald Forest",   sym: "⬡", bg: ["#03130a","#062010","#03130a"], primary:"#2ecc71", secondary:"#4ecda0", tertiary:"#145a32", text:"#e0ffe8", glow:"#2ecc71", particle:"leaves",   border:"ornate",   tag:"Souffle sauvage" },
  ruby_inferno:    { name: "Ruby Inferno",     sym: "▲", bg: ["#140002","#2a0006","#0d0001"], primary:"#ff2b3d", secondary:"#ff6b35", tertiary:"#8a0f1a", text:"#ffe0e4", glow:"#ff2b3d", particle:"embers",   border:"brackets", tag:"Chaleur ardente" },
  sapphire_deep:   { name: "Sapphire Deep",    sym: "◇", bg: ["#020a18","#041530","#020a18"], primary:"#2196f3", secondary:"#00e5ff", tertiary:"#0d47a1", text:"#e3f2fd", glow:"#2196f3", particle:"bubbles",  border:"neon",     tag:"Abysses bleutées" },
  platinum_elite:  { name: "Platinum Elite",   sym: "◉", bg: ["#0c0c0c","#1a1a1a","#0c0c0c"], primary:"#e8e8e8", secondary:"#ffffff", tertiary:"#8a8a8a", text:"#fafafa", glow:"#e8e8e8", particle:"crystals", border:"double",   tag:"Perfection minérale" },
  cyber_matrix:    { name: "Cyber Matrix",     sym: "▣", bg: ["#000500","#001400","#000500"], primary:"#00ff41", secondary:"#00b82e", tertiary:"#003b0f", text:"#c8ffcf", glow:"#00ff41", particle:"matrix",   border:"neon",     tag:"Code vivant" },
  sunset_blaze:    { name: "Sunset Blaze",     sym: "◑", bg: ["#1a0800","#3d1400","#1a0300"], primary:"#ff6b00", secondary:"#ff9e2c", tertiary:"#ff2d78", text:"#fff3e0", glow:"#ff6b00", particle:"waves",    border:"brackets", tag:"Crépuscule flamboyant" },
  arctic_frost:    { name: "Arctic Frost",     sym: "◇", bg: ["#04121c","#0a2436","#04121c"], primary:"#7fdfff", secondary:"#c8f4ff", tertiary:"#2a7ea8", text:"#eafcff", glow:"#7fdfff", particle:"snow",     border:"ornate",   tag:"Silence glacé" },
  venom_toxic:     { name: "Venom Toxic",      sym: "⬢", bg: ["#050a02","#0e1804","#050a02"], primary:"#c6ff00", secondary:"#76ff03", tertiary:"#3a5a00", text:"#eaffb0", glow:"#c6ff00", particle:"circuit",  border:"neon",     tag:"Énergie corrosive" },
  royal_amethyst:  { name: "Royal Amethyst",   sym: "◈", bg: ["#0c0416","#180a2c","#0c0416"], primary:"#9d4edd", secondary:"#c77dff", tertiary:"#5a189a", text:"#f3e8ff", glow:"#9d4edd", particle:"orbits",   border:"double",   tag:"Noblesse violette" },
  blood_moon:      { name: "Blood Moon",       sym: "◎", bg: ["#0a0002","#1c0006","#0a0002"], primary:"#d0021b", secondary:"#8b0000", tertiary:"#4a0008", text:"#ffd6d6", glow:"#d0021b", particle:"lightning", border:"brackets", tag:"Éclipse pourpre" },
  tropical_bloom:  { name: "Tropical Bloom",   sym: "❖", bg: ["#001a17","#00332b","#001a17"], primary:"#00e5a0", secondary:"#ffd93d", tertiary:"#00998a", text:"#e0fff7", glow:"#00e5a0", particle:"confetti", border:"ornate",   tag:"Éclat exotique" },
  midnight_ocean:  { name: "Midnight Ocean",   sym: "◐", bg: ["#000814","#001d3d","#000814"], primary:"#00b4d8", secondary:"#90e0ef", tertiary:"#03045e", text:"#caf0f8", glow:"#00b4d8", particle:"rain",     border:"neon",     tag:"Marée profonde" },
  desert_mirage:   { name: "Desert Mirage",    sym: "◆", bg: ["#1a1000","#2e1c00","#1a1000"], primary:"#e0a458", secondary:"#f4d35e", tertiary:"#8a5a1c", text:"#fff3d6", glow:"#e0a458", particle:"sand",     border:"brackets", tag:"Mirage doré" },
  cosmic_void:     { name: "Cosmic Void",      sym: "✧", bg: ["#000000","#0a0014","#000000"], primary:"#ff00ff", secondary:"#00ffff", tertiary:"#ffff00", text:"#ffffff", glow:"#ff00ff", particle:"geometric", border:"double",   tag:"Vide infini" },
  rose_gold:       { name: "Rose Gold",        sym: "❖", bg: ["#1a0a10","#2e1420","#1a0a10"], primary:"#ff9eb5", secondary:"#f7cac9", tertiary:"#b76e79", text:"#fff0f3", glow:"#ff9eb5", particle:"bokeh",    border:"ornate",   tag:"Charme rosé" },
  electric_storm:  { name: "Electric Storm",   sym: "▲", bg: ["#050510","#0a1030","#050510"], primary:"#3d5afe", secondary:"#ffea00", tertiary:"#1a237e", text:"#e8eaff", glow:"#3d5afe", particle:"lightning", border:"neon",     tag:"Tempête électrique" },
  crimson_dynasty: { name: "Crimson Dynasty",  sym: "◉", bg: ["#0f0402","#1f0805","#0f0402"], primary:"#e63946", secondary:"#f1a208", tertiary:"#6a040f", text:"#ffe8d6", glow:"#e63946", particle:"embers",   border:"brackets", tag:"Dynastie écarlate" },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES DE DESSIN
// ═══════════════════════════════════════════════════════════════════════════════
function rr(ctx, x, y, w, h, r) {
  if (typeof r === "number") r = [r,r,r,r];
  const [tl,tr,br,bl] = r;
  ctx.beginPath();
  ctx.moveTo(x+tl,y); ctx.lineTo(x+w-tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br); ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl); ctx.quadraticCurveTo(x,y,x+tl,y); ctx.closePath();
}

function T(ctx, s, x, y, sz, color, {align="left",weight="bold",glow=null,alpha=1}={}) {
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.font=`${weight} ${sz}px BF, Arial`;
  ctx.textAlign=align; ctx.textBaseline="middle";
  if(glow){ctx.shadowColor=glow;ctx.shadowBlur=14;}
  ctx.fillStyle=color; ctx.fillText(s,x,y); ctx.restore();
}

function GL(ctx, x1,y1,x2,y2, color, w=1.5) {
  const g=ctx.createLinearGradient(x1,y1,x2,y2);
  g.addColorStop(0,"transparent");g.addColorStop(.5,color);g.addColorStop(1,"transparent");
  ctx.save();ctx.strokeStyle=g;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FOND + PARTICULES (20 styles réutilisables, pilotés par thème)
// ═══════════════════════════════════════════════════════════════════════════════
function drawBackground(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.bg[0]); g.addColorStop(0.5, t.bg[1]); g.addColorStop(1, t.bg[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Halos de couleur ambiants (communs à tous les thèmes, positions variables)
  const spots = [
    [W*0.18, H*0.22, t.primary],
    [W*0.85, H*0.18, t.secondary],
    [W*0.5,  H*0.9,  t.tertiary],
    [W*0.9,  H*0.85, t.primary],
  ];
  spots.forEach(([sx,sy,sc]) => {
    const rg = ctx.createRadialGradient(sx,sy,0,sx,sy,360);
    rg.addColorStop(0, sc+"33"); rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
  });

  drawParticles(ctx, W, H, t);

  // Vignette globale pour la lisibilité
  const vg = ctx.createRadialGradient(W/2, H/2, Math.max(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function drawParticles(ctx, W, H, t) {
  const { primary: p, secondary: s, tertiary: te } = t;
  switch (t.particle) {
    case "grid": {
      ctx.strokeStyle = p + "10"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      break;
    }
    case "stars": {
      for (let i = 0; i < 220; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = Math.random()*1.7;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.3+Math.random()*0.6})`; ctx.fill();
      }
      break;
    }
    case "petals": {
      for (let i = 0; i < 26; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 8+Math.random()*22;
        const rg = ctx.createRadialGradient(x,y,0,x,y,r);
        rg.addColorStop(0, p+"55"); rg.addColorStop(1, "transparent");
        ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
      }
      break;
    }
    case "aurora": {
      [[H*0.15,p,s],[H*0.35,s,te],[H*0.6,te,p]].forEach(([y,c1,c2]) => {
        const ag = ctx.createLinearGradient(0,y-70,0,y+70);
        ag.addColorStop(0,"transparent"); ag.addColorStop(0.45,c1+"33");
        ag.addColorStop(0.55,c2+"33"); ag.addColorStop(1,"transparent");
        ctx.fillStyle = ag; ctx.fillRect(0,y-70,W,140);
      });
      break;
    }
    case "bokeh": {
      for (let i = 0; i < 20; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 20+Math.random()*60;
        const rg = ctx.createRadialGradient(x,y,0,x,y,r);
        rg.addColorStop(0, (i%2?p:s)+"22"); rg.addColorStop(1,"transparent");
        ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
      }
      break;
    }
    case "smoke": {
      for (let i = 0; i < 10; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 100+Math.random()*180;
        const rg = ctx.createRadialGradient(x,y,0,x,y,r);
        rg.addColorStop(0, p+"18"); rg.addColorStop(1,"transparent");
        ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
      }
      break;
    }
    case "leaves": {
      for (let i = 0; i < 18; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 10+Math.random()*16;
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.random()*Math.PI);
        ctx.fillStyle = (i%2?p:s)+"33";
        ctx.beginPath(); ctx.ellipse(0,0,r,r*0.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "embers": {
      for (let i = 0; i < 60; i++) {
        const x = Math.random()*W, y = H - Math.random()*H*0.8, r = 1+Math.random()*2.4;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = (i%3?p:s); ctx.shadowColor = p; ctx.shadowBlur = 6;
        ctx.globalAlpha = 0.5+Math.random()*0.5; ctx.fill(); ctx.globalAlpha = 1;
      }
      break;
    }
    case "bubbles": {
      for (let i = 0; i < 24; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 6+Math.random()*22;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.strokeStyle = p+"44"; ctx.lineWidth = 1.4; ctx.stroke();
      }
      break;
    }
    case "crystals": {
      for (let i = 0; i < 20; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 6+Math.random()*14;
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/4);
        ctx.strokeStyle = p+"55"; ctx.lineWidth = 1.2;
        ctx.strokeRect(-r/2,-r/2,r,r); ctx.restore();
      }
      break;
    }
    case "matrix": {
      ctx.font = "12px monospace";
      for (let x = 0; x < W; x += 26) {
        const len = 3+Math.floor(Math.random()*7);
        for (let j = 0; j < len; j++) {
          const y = (Math.random()*H);
          ctx.fillStyle = p + (j===0?"cc":"22");
          ctx.fillText(String(Math.floor(Math.random()*2)), x, y);
        }
      }
      break;
    }
    case "waves": {
      for (let i = 0; i < 4; i++) {
        const y = H*0.2 + i*H*0.18;
        const wg = ctx.createLinearGradient(0,y-40,0,y+40);
        wg.addColorStop(0,"transparent"); wg.addColorStop(0.5,(i%2?p:s)+"22"); wg.addColorStop(1,"transparent");
        ctx.fillStyle = wg; ctx.fillRect(0,y-40,W,80);
      }
      break;
    }
    case "snow": {
      for (let i = 0; i < 140; i++) {
        const x = Math.random()*W, y = Math.random()*H, r = 1+Math.random()*2.6;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.3+Math.random()*0.5})`; ctx.fill();
      }
      break;
    }
    case "circuit": {
      ctx.strokeStyle = p+"33"; ctx.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) {
        let x = Math.random()*W, y = Math.random()*H;
        ctx.beginPath(); ctx.moveTo(x,y);
        for (let j = 0; j < 3; j++) {
          if (Math.random() > 0.5) x += (Math.random()-0.5)*80; else y += (Math.random()-0.5)*80;
          ctx.lineTo(x,y);
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,2.4,0,Math.PI*2); ctx.fillStyle = p+"77"; ctx.fill();
      }
      break;
    }
    case "orbits": {
      const cx = W/2, cy = H*0.42;
      [120,190,260].forEach((r,i) => {
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle = (i%2?p:s)+"22"; ctx.lineWidth = 1; ctx.stroke();
        const a = Math.random()*Math.PI*2;
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 3, 0, Math.PI*2);
        ctx.fillStyle = p+"aa"; ctx.fill();
      });
      break;
    }
    case "lightning": {
      for (let i = 0; i < 4; i++) {
        let x = Math.random()*W, y = 0;
        ctx.beginPath(); ctx.moveTo(x,y);
        while (y < H) { x += (Math.random()-0.5)*60; y += 40+Math.random()*40; ctx.lineTo(x,y); }
        ctx.strokeStyle = p+"33"; ctx.lineWidth = 1.4; ctx.shadowColor = p; ctx.shadowBlur = 8; ctx.stroke();
      }
      break;
    }
    case "confetti": {
      for (let i = 0; i < 40; i++) {
        const x = Math.random()*W, y = Math.random()*H, w = 4+Math.random()*8;
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.random()*Math.PI);
        ctx.fillStyle = (i%2?p:s)+"66"; ctx.fillRect(-w/2,-w/4,w,w/2); ctx.restore(
