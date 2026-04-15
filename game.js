/* ════════════════════════════════════════════════════════════════════
   FAB FLOOR v3 - scrolling camera, 4-frame walk, typewriter, audio,
   warm earthy palette, title screen, transitions.
   ════════════════════════════════════════════════════════════════════ */

/* ── Palette (warm, earthy, GBA-inspired) ───────────────────────── */
const PAL = {
  // floor
  floorA:'#d9c79a', floorB:'#c8b385', floorGrout:'#8b7649',
  floorAccent:'#a08960',
  sage:'#8fa07e', sageDk:'#6e7f5e',
  rugRed:'#9c3a2e', rugCream:'#e8d6a5',
  // walls
  wallBase:'#3f302a', wallFace:'#6a4f3e', wallTrim:'#e8d6a5',
  wallDark:'#2a1f18', wallLamp:'#ffd26d', wallLampGlow:'#ffa93c',
  // metal / tech
  metal:'#b8a88a', metalDk:'#7e6e50', metalShine:'#ede3c3',
  teal:'#4a8a8c', tealDk:'#2d5a5c',
  // highlights
  amber:'#e8b658', gold:'#d49a3c',
  red:'#b8463a', orange:'#d97a3c', leafGreen:'#6a8e3c',
  // text / ui
  cream:'#f4ead0', dark:'#2a2018', darker:'#180f0a',
  ink:'#1a120c'
};

/* ── Characters (each with a signature silhouette) ──────────────── */
const CHARS = {
  player: { skin:'#e6c09a', hair:'#2a1408', coat:'#d97a3c', accent:'#e8d6a5', pants:'#3a2a1c', hat:'#e8b658', vest:true, name:'You' },
  rao:    { skin:'#c89870', hair:'#15080a', coat:'#9c3a2e', accent:'#f4ead0', pants:'#2a1f2a', bun:true, name:'Dr. Priya Rao', role:'Polymer Dynamics · Cambridge' },
  marcus: { skin:'#d9b48a', hair:'#7a6a4a', coat:'#4a6d8c', accent:'#f4ead0', pants:'#2a1f18', beard:true, glasses:true, name:'Marcus Lindqvist', role:'QC · Dresden Fab' },
  hana:   { skin:'#b89068', hair:'#1a0a08', coat:'#5c4079', accent:'#f4ead0', pants:'#2a1a28', longHair:true, tablet:true, name:'Hana Okafor', role:'PhD · Soft-Matter Lab' }
};

/* ── World ────────────────────────────────────────────────────────
   Bigger map, scrolling camera.
   Tiles:
   . floor         # wall           r rug edge        R rug center
   T AFM tool      C control station  b bench (solid)
   P plant         d coffee machine   s sign (solid)
   h hazard stripe  l logo inlay      g grass/planter (solid, decorative)
   D door (decor)  w whiteboard      f file cabinet
*/
const MAP = [
  "###############################",
  "#.............................#",
  "#..######......######......####",
  "#..#T...#......#T...#......#T##",
  "#..#....#......#....#......#..#",
  "#..#C...#......#C...#......#C.#",
  "#..######......######......####",
  "#.............................#",
  "#...........................w.#",
  "#.rRRRr...hhh.llll.hhh...rRRRr#",
  "#.rRRRr..........llll....rRRRr#",
  "#.rRRRr...hhh.llll.hhh...rRRRr#",
  "#.............................#",
  "#.P.........................d.#",
  "#.............................#",
  "#..bbbbbb................bbbbb#",
  "#.............................#",
  "#..f...s...............s....f.#",
  "#.............................#",
  "###############D###############",
];
/* ── CMST easter-egg map (entered via the EXIT door) ─────────── */
/* tight rows of fab tools (T) with workstations (W) staffed by seated NPCs */
const CSMT_MAP = [
  "###############################",
  "#.............................#",
  "#.TT.TTT.TT.TTTT.TTT.TT.TTT.T.#",
  "#.TT.TTT.TT.TTTT.TTT.TT.TTT.T.#",
  "#.............................#",
  "#.............................#",
  "#....WWW........WWW...........#",
  "#.............................#",
  "#.............................#",
  "#.T.TTT.TTTT.TT.TTT.TTTT.TT.T.#",
  "#.T.TTT.TTTT.TT.TTT.TTTT.TT.T.#",
  "#.............................#",
  "#.............................#",
  "#..........WWW........WWW.....#",
  "#.............................#",
  "#.............................#",
  "#.TTT.TT.TTTT.TT.TTT.TT.TTT.T.#",
  "#.TTT.TT.TTTT.TT.TTT.TT.TTT.T.#",
  "#.............................#",
  "###############B###############",
];
/* Tools are 2 tiles tall - only the TOP tile of each pair carries the
   brand/size data so we don't double-render or double-smoke them.        */
const CMST_BRANDS = ['ASML','AMAT','LAM','KLA','TEL','HITA'];
function cmstToolMeta(x,y){
  // deterministic per-column hash so all tools in a vertical pair share data
  const h = ((x*131 + y*7 + 91) >>> 0);
  const brand = CMST_BRANDS[h % CMST_BRANDS.length];
  // size: 0 small, 1 medium, 2 large (large only in some rows)
  const sizeBucket = (h >> 3) % 5;
  const size = sizeBucket < 2 ? 0 : sizeBucket < 4 ? 1 : 2;
  return { brand, size, hash: h };
}
function cmstIsToolHead(x,y){
  // a tile is a "tool head" (drawn) if it's a T and the tile above is NOT a T
  return tileAt(x,y)==='T' && tileAt(x,y-1)!=='T';
}

/* ── Gowning room - single small antechamber between HQ and the fab.
   'B' = back-door (returns to HQ). 'D' = forward door (advances into the
   cleanroom). 'L' is a floor-to-ceiling locker. The room is intentionally
   tight so the lockers are unmissable - you cannot pass D without
   suiting up at one of them. */
const GOWNING_MAP = [
  "#################",
  "#.LL.LL.LL.LL.L.#",
  "#...............#",
  "#...............#",
  "#...............#",
  "B...............D",
  "#...............#",
  "#...............#",
  "#...............#",
  "#...............#",
  "#################",
];
/* Linear scene order - 'D' walks forward, 'B' walks back. */
const ROUTE = ['play','gowning','csmt'];
const MAPS  = { play:MAP, gowning:GOWNING_MAP, csmt:CSMT_MAP };
/* Where to drop the player when they ARRIVE at a scene.
   `fwd` = arriving from the previous scene (player walked forward / D).
   `back`= arriving from the next scene (player walked back / B). */
const ENTRY = {
  play:    { fwd:null,                              back:{x:15,y:18,dir:'up'   } },
  gowning: { fwd:{x:1, y:5, dir:'right'},           back:{x:15,y:5, dir:'left' } },
  csmt:    { fwd:{x:15,y:18,dir:'up'   },           back:null                   },
};
const SCENE_FLASH = {
  gowning: 'Gowning room · press E at a locker to suit up before entering the fab',
  csmt:    'FAB FLOOR 2 ACCESS · whack the smoking tools with E',
  play:    'Back at Headquarters',
};
let activeMap = MAP;
/* COLS / ROWS are tied to the active map and may change when the player
   moves between scenes (HQ → corridor → suiting → blower → cleanroom). */
let COLS = MAP[0].length;
let ROWS = MAP.length;
function setActiveMap(m){
  activeMap = m;
  COLS = m[0].length;
  ROWS = m.length;
}
const TILE = 32;

function tileAt(x,y){ if(y<0||y>=ROWS||x<0||x>=COLS) return '#'; return activeMap[y][x]; }
function solidTile(c){
  return c==='#' || c==='T' || c==='C' || c==='b' || c==='P' || c==='d' || c==='s' || c==='f' || c==='g' || c==='w' || c==='W' || c==='L';
}

/* ── NPCs ─────────────────────────────────────────────────────── */
const NPCS = [
  { id:'rao', x:5, y:7, dir:'down', idleTimer:0, ch:'rao', done:false,
    lines:[
      "Oh thank god, you're here.",
      "Grant deadline Thursday. I cannot afford another overnight failure.",
      "My tapping-mode scans show streaks across the fast axis, and the setpoint drifts after ten minutes.",
      "Fresh AC160 tip this morning. Sample's a spin-coated PS film. Standard as it gets."
    ],
    options:[
      {t:"Check the laser alignment first.",       r:"SUM reads 4.2 volts. Laser isn't the issue."},
      {t:"Clean the cantilever chip and re-tune.", r:"That fixed it. Clean baseline, zero drift. You're a legend.", good:true},
      {t:"Recalibrate the scanner.",               r:"Closed-loop sensors are already in spec. Still streaking."}
    ]
  },
  { id:'marcus', x:15, y:7, dir:'down', idleTimer:0, ch:'marcus', done:false,
    lines:[
      "Tool came back from a power-cycle and deflection pegs high before we engage.",
      "SUM photodiode reads 1.2 volts. Should be around four.",
      "Viewing camera shows the laser spot drifted clean off the cantilever."
    ],
    options:[
      {t:"Re-centre the laser on the cantilever.", r:"SUM back to 4.1. Deflection zeroed. Beautiful work.", good:true},
      {t:"Swap in a fresh cantilever.",            r:"Don't think the lever itself is the problem."},
      {t:"Reboot the controller again.",           r:"Rebooted twice already. No change."}
    ]
  },
  { id:'hana', x:27, y:7, dir:'down', idleTimer:0, ch:'hana', done:false,
    lines:[
      "I... I think I might be doing something wrong.",
      "Same repeating pattern at 1 micron, 5 micron, twenty micron. Even on a calibration grating.",
      "My supervisor says I'm imaging incorrectly. This is my thesis sample."
    ],
    options:[
      {t:"Swap the tip again.",                     r:"Already tried. Artefact persists."},
      {t:"Scanner resonance, let's recalibrate.",  r:"Oh, it wasn't me. Thank you. Really.", good:true},
      {t:"Re-align the laser.",                     r:"Beam path is fine. SUM is nominal."}
    ]
  }
];

/* ── Player ─────────────────────────────────────────────────────── */
const player = { x:15, y:13, px:15*TILE, py:13*TILE, dir:'up', moving:false, stepFrame:0, stepCount:0, ch:'player' };

/* ── Game state ─────────────────────────────────────────────────── */
const state = {
  scene: 'title',        // 'title' | 'play' | 'end'
  dialogue: null,
  tickets: 0, tick: 0,
  camera: { x:0, y:0 },
  fade: 1,               // 1 = fully black, 0 = clear
  fadeDir: -1,           // -1 fading in, 1 fading out, 0 idle
  shake: 0,
  typewriter: { text:'', full:'', idx:0, speed:2, done:false, sink:null },
  titleAlpha: 0, titlePhase: 0,
  bumpCooldown: 0,
  message: null, messageTimer: 0,
  // CSMT easter-egg state
  csmtSmoking: new Set(),     // "x,y" strings of tools still smoking
  csmtFixed: 0,
  csmtTotal: 0,
  spannerSwing: 0,            // animation tick for whack
  returnAfterFade: null,      // function fired when fade-out completes
  suited: false,              // wearing cleanroom suit (set in gowning room)
};

/* ── Canvas setup ───────────────────────────────────────────────── */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
const VIEW_W = cvs.width, VIEW_H = cvs.height;

/* ════════════════════════════════════════════════════════════════
   AUDIO - WebAudio generated SFX (footsteps, bump, beep, jingle)
   ════════════════════════════════════════════════════════════════ */
let actx = null;
let audioMuted = false;
function initAudio(){
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e){ console.warn('no audio'); }
}
const muteBtn = document.getElementById('muteBtn');
if (muteBtn){
  muteBtn.addEventListener('click', ()=>{
    audioMuted = !audioMuted;
    muteBtn.textContent = audioMuted ? '🔇 MUTED' : '🔊 SOUND';
    muteBtn.setAttribute('aria-pressed', audioMuted ? 'true' : 'false');
    initAudio();
  });
}
function beep(freq, dur=0.06, type='square', vol=0.06, slide=0){
  if (!actx || audioMuted) return;
  const now = actx.currentTime;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slide) osc.frequency.linearRampToValueAtTime(freq+slide, now+dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now+dur);
  osc.connect(gain); gain.connect(actx.destination);
  osc.start(now); osc.stop(now+dur+0.02);
}
function sfxStep(){ beep(120 + Math.random()*20, 0.04, 'square', 0.035); }
function sfxBump(){ beep(90, 0.1, 'square', 0.08, -30); beep(70, 0.1, 'triangle', 0.04, -10); }
function sfxBlip(){ beep(1000, 0.02, 'square', 0.025); }
function sfxSelect(){ beep(660, 0.05, 'square', 0.06); setTimeout(()=>beep(880,0.08,'square',0.06), 50); }
function sfxWrong(){ beep(220, 0.2, 'sawtooth', 0.06, -40); }
function sfxCorrect(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'square',0.06), i*80)); }
function sfxWin(){
  const seq = [523,659,784,1047,784,1047,1319];
  seq.forEach((f,i)=>setTimeout(()=>beep(f,0.15,'square',0.07), i*130));
}
function sfxOpen(){ beep(440, 0.04, 'square', 0.05); setTimeout(()=>beep(660,0.06,'square',0.05),40); }

/* ════════════════════════════════════════════════════════════════
   INPUT
   ════════════════════════════════════════════════════════════════ */
const keys = {};
cvs.addEventListener('click', ()=>{ initAudio(); cvs.focus(); });
window.addEventListener('keydown', e => {
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  const k = e.key.toLowerCase();
  if (!keys[k]) handleKeyPress(k);
  keys[k] = true;
  initAudio();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function handleKeyPress(k){
  if (state.scene === 'title'){
    if (k==='e'||k===' '||k==='enter'){
      sfxSelect();
      state.scene = 'play';
      fadeTo(0);
      setTimeout(()=>flashMessage('Walk to a researcher with a "!" and press E', 480), 600);
    }
    return;
  }
  if (state.scene === 'ending'){
    if (k==='r'){ sfxSelect(); location.reload(); }
    else if (k==='escape'){ window.location.href='index.html'; }
    return;
  }
  if (state.dialogue){
    const d = state.dialogue;
    // if typewriter still running, skip to full
    if (d.phase === 'lines'){
      if (!state.typewriter.done && (k==='e'||k===' '||k==='enter')){
        state.typewriter.idx = state.typewriter.full.length;
        state.typewriter.text = state.typewriter.full;
        state.typewriter.done = true;
        return;
      }
      if (state.typewriter.done && (k==='e'||k===' '||k==='enter')){
        sfxBlip();
        d.idx++;
        if (d.idx >= d.lines.length){
          if (d.npc.done) { state.dialogue = null; return; }
          d.phase = 'choices';
        } else {
          startTypewriter(d.lines[d.idx]);
        }
      }
    } else if (d.phase === 'choices' && (k==='1'||k==='2'||k==='3')){
      const opt = d.npc.options[parseInt(k,10)-1];
      if (opt){
        sfxSelect();
        d.phase='result'; d.result=opt;
        startTypewriter(`"${opt.r}"`);
        if (opt.good){
          d.npc.done=true; state.tickets++;
          document.getElementById('score').textContent = `TICKETS ${state.tickets} / 3`;
          setTimeout(sfxCorrect, 100);
        } else {
          setTimeout(sfxWrong, 100);
        }
      }
    } else if (d.phase === 'result' && (k==='e'||k===' '||k==='enter')){
      if (!state.typewriter.done){
        state.typewriter.idx = state.typewriter.full.length;
        state.typewriter.text = state.typewriter.full;
        state.typewriter.done = true;
        return;
      }
      if (d.result.good){
        flashMessage(`✓ ${CHARS[d.npc.ch].name.split(' ')[0]}'s tool is back online`);
        if (state.tickets===3){ setTimeout(()=>{ fadeTo(1); setTimeout(showEnding, 700); }, 400); }
      }
      sfxBlip();
      state.dialogue = null;
    }
    return;
  }
  if (k==='e'||k===' '||k==='enter') tryInteract();
}

function startTypewriter(text){
  state.typewriter = { text:'', full:text, idx:0, speed:1.6, done:false, lastBlip:0 };
}

/* ════════════════════════════════════════════════════════════════
   MOVEMENT
   ════════════════════════════════════════════════════════════════ */
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const MOVE_DURATION = 160;
let moveStart = 0, moveFromX = 0, moveFromY = 0;
const PLAYABLE = new Set(['play','gowning','csmt']);

function tryMove(dir){
  if (player.moving || state.dialogue || !PLAYABLE.has(state.scene)) return;
  player.dir = dir;
  const [dx,dy] = DIRS[dir];
  const nx = player.x+dx, ny = player.y+dy;
  if (solidTile(tileAt(nx,ny)) || NPCS.some(n=>n.x===nx && n.y===ny)){
    // bump
    if (state.bumpCooldown<=0){
      sfxBump(); state.shake = 6; state.bumpCooldown = 20;
    }
    return;
  }
  moveFromX=player.px; moveFromY=player.py;
  player.x=nx; player.y=ny;
  player.moving=true; moveStart=performance.now();
  player.stepCount++;
  if (player.stepCount%2===0) sfxStep();
}

function tryInteract(){
  const [dx,dy] = DIRS[player.dir];
  const fx=player.x+dx, fy=player.y+dy;
  const npc = NPCS.find(n=>n.x===fx && n.y===fy);
  if (npc){
    // face player
    if (dx===1) npc.dir='left'; else if (dx===-1) npc.dir='right';
    else if (dy===1) npc.dir='up'; else npc.dir='down';
    sfxOpen();
    openDialogue(npc);
    return;
  }
  const t = tileAt(fx,fy);
  if (t==='T' && state.scene === 'csmt'){
    // Tools are 2 tiles tall - the smoking key is on the HEAD (top tile).
    // Resolve any tool tile up to its head so you can whack from front,
    // back, OR side and still hit the right machine.
    let hx = fx, hy = fy;
    while (tileAt(hx, hy-1) === 'T') hy--;
    const key = hx+','+hy;
    state.spannerSwing = 20;
    if (state.csmtSmoking.has(key)){
      state.csmtSmoking.delete(key);
      state.csmtFixed++;
      sfxBump(); setTimeout(sfxCorrect, 80);
      state.shake = 4;
      if (state.csmtFixed >= state.csmtTotal){
        flashMessage('FAB FLOOR 2 STABILISED · walk back through the door', 360);
        setTimeout(sfxWin, 200);
      } else {
        flashMessage(`Tool back online · ${state.csmtFixed}/${state.csmtTotal} fixed`, 150);
      }
    } else {
      sfxBump();
      flashMessage('Already humming. Nice spanner work.', 120);
    }
    return;
  }
  if (t==='L'){
    if (!state.suited){
      state.suited = true;
      sfxOpen();
      flashMessage('Cleanroom suit equipped · the cleanroom door is now unlocked', 240);
    } else {
      flashMessage('Already suited up. Move along.', 120);
    }
    return;
  }
  if (t==='J'){
    flashMessage('Air-shower jet · keep moving to purge particulates', 150);
    return;
  }
  if (t==='T') flashMessage('AFM · talk to the researcher beside it');
  else if (t==='C') flashMessage('Control station · logs look nominal');
  else if (t==='d') flashMessage('Coffee machine · tempting, but later');
  else if (t==='b') flashMessage('Lab bench · clipboards, samples, half-eaten sandwich');
  else if (t==='P') flashMessage('A suspiciously healthy pot plant');
  else if (t==='s') flashMessage('Sign: "CLEANROOM B: AUTHORISED ONLY"');
  else if (t==='f') flashMessage('Filing cabinet: calibration records');
  else if (t==='w') flashMessage('Whiteboard: yesterday\'s SOP notes');
}

function openDialogue(npc){
  const lines = npc.done ? ["Thanks again. Tool's humming."] : npc.lines.slice();
  state.dialogue = { npc, lines, idx:0, phase:'lines' };
  startTypewriter(lines[0]);
}

/* ════════════════════════════════════════════════════════════════
   CAMERA
   ════════════════════════════════════════════════════════════════ */
function updateCamera(){
  // center on player, clamp to world. If the world is smaller than the
  // viewport (e.g. the gowning room), centre the world in the viewport
  // instead - otherwise the small map ends up pinned to the top-left.
  const worldW = COLS*TILE, worldH = ROWS*TILE;
  let cx, cy;
  if (worldW <= VIEW_W) cx = (worldW - VIEW_W) / 2;       // negative → centred
  else { cx = player.px - VIEW_W/2 + TILE/2; cx = Math.max(0, Math.min(worldW - VIEW_W, cx)); }
  if (worldH <= VIEW_H) cy = (worldH - VIEW_H) / 2;
  else { cy = player.py - VIEW_H/2 + TILE/2; cy = Math.max(0, Math.min(worldH - VIEW_H, cy)); }
  // smooth
  state.camera.x += (cx - state.camera.x) * 0.22;
  state.camera.y += (cy - state.camera.y) * 0.22;
}

/* ════════════════════════════════════════════════════════════════
   UPDATE
   ════════════════════════════════════════════════════════════════ */
function update(now){
  state.tick++;
  if (state.fadeDir !== 0){
    state.fade += state.fadeDir * 0.03;
    if (state.fade<=0){ state.fade=0; state.fadeDir=0; }
    if (state.fade>=1){ state.fade=1; state.fadeDir=0; }
  }
  if (state.shake>0) state.shake *= 0.82;
  if (state.bumpCooldown>0) state.bumpCooldown--;
  if (state.messageTimer>0) state.messageTimer--;
  if (state.spannerSwing>0) state.spannerSwing--;

  // door-tile pickup: walking onto 'D' advances along the route,
  // walking onto 'B' steps back. HQ → gowning room → cleanroom.
  if (!player.moving && state.fadeDir===0 && !state.returnAfterFade){
    const here = tileAt(player.x, player.y);
    const idx = ROUTE.indexOf(state.scene);
    let target = null, direction = null;
    if (here === 'D' && idx >= 0 && idx < ROUTE.length-1){
      target = ROUTE[idx+1]; direction = 'fwd';
    } else if (here === 'B' && idx > 0){
      target = ROUTE[idx-1]; direction = 'back';
    }
    // gowning gate: cannot enter the cleanroom without a bunny suit
    if (target === 'csmt' && direction === 'fwd' && !state.suited){
      target = null;
      flashMessage('LOCKED · press E at a locker to suit up first', 220);
    }
    if (target){
      const captured = { target, direction };
      state.returnAfterFade = ()=>{
        const nextScene = captured.target;
        const dir = captured.direction;
        setActiveMap(MAPS[nextScene]);
        state.scene = nextScene;
        // arrival point depends on which way we walked through the door
        const e = ENTRY[nextScene][dir==='fwd' ? 'fwd' : 'back'] || ENTRY[nextScene].fwd || ENTRY[nextScene].back;
        player.x = e.x; player.y = e.y; player.px = e.x*TILE; player.py = e.y*TILE; player.dir = e.dir;
        // suit removed automatically when you head all the way back to HQ
        // or down the service corridor (the suiting room is *before* the gate)
        if (nextScene === 'play') state.suited = false;
        // when we arrive at the cleanroom, populate smoking tools fresh
        if (nextScene === 'csmt'){
          state.csmtSmoking.clear();
          state.csmtTotal = 0;
          for (let yy=0; yy<CSMT_MAP.length; yy++){
            for (let xx=0; xx<CSMT_MAP[0].length; xx++){
              if (CSMT_MAP[yy][xx]==='T' && CSMT_MAP[yy-1] && CSMT_MAP[yy-1][xx]!=='T'){
                const h = ((xx*131 + yy*7 + 91) >>> 0);
                if (h % 4 === 0){ state.csmtSmoking.add(xx+','+yy); state.csmtTotal++; }
              }
            }
          }
          state.csmtFixed = 0;
        }
        const dur = (nextScene === 'csmt') ? 720 : 300;
        flashMessage(SCENE_FLASH[nextScene] || '', dur);
        // snap camera so the room doesn't slide in from off-screen
        const wW = COLS*TILE, wH = ROWS*TILE;
        state.camera.x = (wW <= VIEW_W) ? (wW - VIEW_W)/2 : Math.max(0, Math.min(wW - VIEW_W, player.px - VIEW_W/2 + TILE/2));
        state.camera.y = (wH <= VIEW_H) ? (wH - VIEW_H)/2 : Math.max(0, Math.min(wH - VIEW_H, player.py - VIEW_H/2 + TILE/2));
        fadeTo(0);
      };
      sfxOpen();
      fadeTo(1);
    }
  }
  if (state.returnAfterFade && state.fade>=1 && state.fadeDir===0){
    const fn = state.returnAfterFade; state.returnAfterFade = null; fn();
  }

  // NPC idle - random turn
  NPCS.forEach(n=>{
    if (!state.dialogue){
      n.idleTimer--;
      if (n.idleTimer<=0){
        n.idleTimer = 180 + Math.floor(Math.random()*240);
        const dirs = ['down','left','right','down','down'];
        n.dir = dirs[Math.floor(Math.random()*dirs.length)];
      }
    }
  });

  // Typewriter
  if (state.dialogue && !state.typewriter.done){
    const tw = state.typewriter;
    tw.idx += tw.speed;
    tw.text = tw.full.slice(0, Math.floor(tw.idx));
    if (tw.idx >= tw.full.length){ tw.done = true; }
    // beep occasionally
    if (state.tick % 3 === 0 && !tw.done && !/[\s.,!?]/.test(tw.full[Math.floor(tw.idx)-1]||'')) sfxBlip();
  }

  if (!PLAYABLE.has(state.scene)) return;

  if (!player.moving && !state.dialogue){
    if (keys['arrowup']||keys['w']) tryMove('up');
    else if (keys['arrowdown']||keys['s']) tryMove('down');
    else if (keys['arrowleft']||keys['a']) tryMove('left');
    else if (keys['arrowright']||keys['d']) tryMove('right');
  }
  if (player.moving){
    const t = Math.min(1,(now-moveStart)/MOVE_DURATION);
    player.px = moveFromX + (player.x*TILE - moveFromX)*t;
    player.py = moveFromY + (player.y*TILE - moveFromY)*t;
    if (t>=1){ player.moving=false; player.px=player.x*TILE; player.py=player.y*TILE; player.stepFrame = (player.stepFrame+1)%4; }
  }
  updateCamera();
}

/* ════════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════════ */
function render(){
  if (state.scene==='title'){ drawTitle(); drawFade(); return; }
  if (state.scene==='ending'){ drawEnding(); drawFade(); return; }

  // offset for camera + shake
  const shakeX = (Math.random()-0.5) * state.shake;
  const shakeY = (Math.random()-0.5) * state.shake;
  const cx = Math.round(state.camera.x + shakeX);
  const cy = Math.round(state.camera.y + shakeY);

  ctx.save();
  ctx.translate(-cx, -cy);

  drawFloor();
  drawRugs();
  drawGowningSignage();
  drawBackWall();
  drawDecor();
  drawEntities();
  drawFrontWall();
  drawNPCMarkers();
  drawVignette(cx, cy);

  ctx.restore();

  drawParticles();
  drawHUD();
  if (state.dialogue) drawDialogue();
  if (state.message && state.messageTimer>0) drawFlash();
  drawFade();
}

/* ── Title screen ── */
function drawTitle(){
  // background
  const g = ctx.createLinearGradient(0,0,0,VIEW_H);
  g.addColorStop(0, '#3f2f22'); g.addColorStop(1, '#1a110a');
  ctx.fillStyle = g; ctx.fillRect(0,0,VIEW_W,VIEW_H);

  // stars / dust
  for (let i=0;i<40;i++){
    const x = (i*73 + state.tick*0.15)%VIEW_W;
    const y = (i*41 + Math.sin(state.tick/60+i)*10)%VIEW_H;
    const a = 0.2 + 0.3*Math.sin(state.tick/30 + i);
    ctx.fillStyle = `rgba(232,182,88,${a})`;
    ctx.fillRect(x,y,1,1);
  }

  // Hero illustration - engineer silhouette in portrait
  const cx = VIEW_W/2, cy = VIEW_H/2;

  // big title
  ctx.fillStyle = PAL.amber;
  ctx.font = "900 54px Inter";
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText("FAB FLOOR", cx, cy-120);

  ctx.fillStyle = PAL.cream;
  ctx.font = "700 18px Inter";
  ctx.fillText("Service Call", cx, cy-80);

  ctx.fillStyle = PAL.gold;
  ctx.font = "600 11px 'JetBrains Mono',monospace";
  ctx.letterSpacing = '4px';
  ctx.fillText("▸  A DAY IN THE LIFE OF A FIELD SERVICE ENGINEER  ◂", cx, cy-50);

  // Character showcase - 4 silhouettes
  const showcase = [CHARS.player, CHARS.rao, CHARS.marcus, CHARS.hana];
  showcase.forEach((c,i)=>{
    const sx = cx - 180 + i*120;
    const sy = cy + 40;
    drawBigCharPortrait(sx, sy, c, i===0);
  });

  // prompt
  if (Math.floor(state.tick/50)%2===0){
    ctx.fillStyle = PAL.cream;
    ctx.font = "bold 14px 'JetBrains Mono',monospace";
    ctx.fillText("▶  PRESS  E  OR  SPACE  TO  BEGIN", cx, cy+210);
  }

  // footer
  ctx.fillStyle = 'rgba(244,234,208,0.35)';
  ctx.font = "10px 'JetBrains Mono',monospace";
  ctx.fillText("click once to enable sound · arrows/WASD to move", cx, VIEW_H-18);
}

function drawBigCharPortrait(cx, cy, c, highlight){
  const p=(x,y,w,h,col)=>{ ctx.fillStyle=col; ctx.fillRect(Math.round(cx+x),Math.round(cy+y),w,h); };
  // frame
  if (highlight){
    ctx.fillStyle = 'rgba(232,182,88,0.15)';
    ctx.fillRect(cx-44, cy-60, 88, 130);
    ctx.strokeStyle = PAL.amber; ctx.lineWidth = 2;
    ctx.strokeRect(cx-44, cy-60, 88, 130);
  }
  // coat
  p(-22, 30, 44, 40, c.coat);
  p(-22, 30, 44, 3, 'rgba(255,255,255,0.15)');
  // collar
  p(-10, 30, 20, 4, c.accent);
  // neck
  p(-6, 22, 12, 10, c.skin);
  // head
  p(-16, -20, 32, 44, c.skin);
  // hair
  if (c.bun){ p(-16,-20,32,14,c.hair); p(-20,-14,4,12,c.hair); p(16,-14,4,12,c.hair); p(-6,-30,12,10,c.hair); }
  else if (c.longHair){ p(-20,-20,40,20,c.hair); p(-22,-10,4,40,c.hair); p(18,-10,4,40,c.hair); }
  else { p(-16,-20,32,12,c.hair); p(-20,-12,4,8,c.hair); p(16,-12,4,8,c.hair); }
  if (c.hat){ p(-18,-30,36,10,c.hat); p(-18,-22,36,2,'#c9722a'); }
  // eyes
  p(-8, 0, 4, 4, PAL.darker); p(4, 0, 4, 4, PAL.darker);
  p(-7, 1, 2, 1, '#fff'); p(5, 1, 2, 1, '#fff');
  if (c.glasses){
    ctx.strokeStyle = PAL.darker; ctx.lineWidth=2;
    ctx.strokeRect(cx-10, cy-2, 8, 8);
    ctx.strokeRect(cx+2, cy-2, 8, 8);
    ctx.beginPath(); ctx.moveTo(cx-2,cy+2); ctx.lineTo(cx+2,cy+2); ctx.stroke();
  }
  if (c.beard){ p(-10,10,20,10,c.hair); p(-4,14,8,2,'#5a2218'); }
  else { p(-4,12,8,2,'#7a3020'); }
  // nose
  p(-1,4,2,4,'rgba(0,0,0,0.18)');
  // vest
  if (c.vest){ p(-20,35,40,20,'#d97a3c'); p(-20,40,40,2,PAL.amber); p(-20,48,40,2,PAL.amber); p(-1,35,2,20,PAL.darker); }
  // name plate
  ctx.fillStyle = PAL.darker;
  ctx.font = "bold 9px 'JetBrains Mono',monospace";
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const name = c.name ? c.name.split(' ').slice(-1)[0].toUpperCase() : '';
  ctx.fillStyle = highlight ? PAL.amber : PAL.cream;
  ctx.fillText(name, cx, cy+80);
}

/* ── Floor ── */
function drawFloor(){
  const x0 = Math.max(0, Math.floor(state.camera.x/TILE));
  const y0 = Math.max(0, Math.floor(state.camera.y/TILE));
  const x1 = Math.min(COLS, Math.ceil((state.camera.x+VIEW_W)/TILE)+1);
  const y1 = Math.min(ROWS, Math.ceil((state.camera.y+VIEW_H)/TILE)+1);

  for (let y=y0;y<y1;y++){
    for (let x=x0;x<x1;x++){
      const c = activeMap[y][x];
      const px=x*TILE, py=y*TILE;
      // base floor
      const checker = (x+y)%2===0;
      const ante = state.scene === 'gowning';
      if (ante){
        // light grey industrial floor - same family as the cleanroom
        ctx.fillStyle = checker ? '#e7eaec' : '#d8dde0';
        ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle = '#bfc6ca';
        ctx.fillRect(px+TILE-1,py,1,TILE);
        ctx.fillRect(px,py+TILE-1,TILE,1);
        continue;
      }
      if (state.scene === 'csmt'){
        ctx.fillStyle = checker ? '#ffffff' : '#f1f4f6';
        ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle = '#dbe2e6';
        ctx.fillRect(px+TILE-1,py,1,TILE);
        ctx.fillRect(px,py+TILE-1,TILE,1);
        ctx.fillStyle = 'rgba(180,200,210,0.25)';
        ctx.fillRect(px,py,TILE,1);
      } else {
        ctx.fillStyle = checker ? PAL.floorA : PAL.floorB;
        ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle = PAL.floorGrout;
        ctx.fillRect(px+TILE-1,py,1,TILE);
        ctx.fillRect(px,py+TILE-1,TILE,1);
        ctx.fillStyle = 'rgba(255,240,200,0.09)';
        ctx.fillRect(px,py,TILE,1);
      }

      // tile-specific overlays
      if (c==='h'){ drawHazardTile(px,py); }
      else if (c==='l'){ drawLogoTile(px,py); }
      else if (c==='r'||c==='R'){ /* rug drawn separately */ }
      else if (c==='.'){
        // scattered floor texture
        if (((x*7+y*13)%31)===0){
          ctx.fillStyle = 'rgba(74,45,26,0.14)';
          ctx.beginPath();
          ctx.ellipse(px+TILE/2+3, py+TILE/2, 7, 4, 0, 0, Math.PI*2);
          ctx.fill();
        }
        if (((x*11+y*5)%47)===0){
          ctx.fillStyle = 'rgba(139,118,73,0.35)';
          ctx.fillRect(px+8,py+14,3,1);
          ctx.fillRect(px+14,py+18,4,1);
        }
      }
    }
  }
}

function drawHazardTile(px,py){
  ctx.save();
  ctx.beginPath(); ctx.rect(px,py,TILE,TILE); ctx.clip();
  ctx.fillStyle = PAL.amber; ctx.fillRect(px,py,TILE,TILE);
  ctx.fillStyle = PAL.darker;
  for (let i=-TILE;i<TILE*2;i+=12){
    ctx.beginPath();
    ctx.moveTo(px+i,py); ctx.lineTo(px+i+6,py);
    ctx.lineTo(px+i+6-TILE,py+TILE); ctx.lineTo(px+i-TILE,py+TILE);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle='rgba(255,240,200,0.2)'; ctx.fillRect(px,py,TILE,2);
}

function drawLogoTile(px,py){
  ctx.fillStyle = PAL.tealDk; ctx.fillRect(px,py,TILE,TILE);
  ctx.fillStyle = PAL.teal; ctx.fillRect(px,py,TILE,3);
  ctx.strokeStyle = 'rgba(232,182,88,0.65)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(px+TILE/2,py+TILE/2,8,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = PAL.amber;
  ctx.fillRect(px+TILE/2-1,py+TILE/2-1,3,3);
}

/* ── Rugs ── */
function drawRugs(){
  for (let y=0;y<ROWS;y++){
    for (let x=0;x<COLS;x++){
      const c = activeMap[y][x];
      if (c!=='r' && c!=='R') continue;
      const px=x*TILE, py=y*TILE;
      ctx.fillStyle = PAL.rugRed;
      ctx.fillRect(px,py,TILE,TILE);
      if (c==='R'){
        // inner pattern
        ctx.fillStyle = PAL.rugCream;
        ctx.fillRect(px+4,py+4,TILE-8,TILE-8);
        ctx.fillStyle = PAL.rugRed;
        ctx.fillRect(px+10,py+10,TILE-20,TILE-20);
        ctx.fillStyle = PAL.rugCream;
        ctx.fillRect(px+13,py+13,TILE-26,TILE-26);
      } else {
        // fringe on edge
        const above = tileAt(x,y-1);
        const below = tileAt(x,y+1);
        ctx.fillStyle = PAL.rugCream;
        if (above!=='r' && above!=='R'){
          for (let i=0;i<TILE;i+=3) ctx.fillRect(px+i,py,1,2);
        }
        if (below!=='r' && below!=='R'){
          for (let i=0;i<TILE;i+=3) ctx.fillRect(px+i,py+TILE-2,1,2);
        }
      }
    }
  }
}

/* ── Back wall + solid decor (drawn before entities for occlusion) ── */
function drawBackWall(){
  for (let y=0;y<ROWS;y++){
    for (let x=0;x<COLS;x++){
      const c = activeMap[y][x];
      const px=x*TILE, py=y*TILE;
      if (c==='#'){
        const below = tileAt(x,y+1);
        if (below==='#') drawWallTile(px,py,x,y,false);
      }
    }
  }
}
function drawFrontWall(){
  for (let y=0;y<ROWS;y++){
    for (let x=0;x<COLS;x++){
      const c = activeMap[y][x];
      const px=x*TILE, py=y*TILE;
      if (c==='#'){
        const below = tileAt(x,y+1);
        if (below!=='#') drawWallTile(px,py,x,y,true);
      } else if (c==='D'){ drawDoor(px,py); }
      else if (c==='B'){ drawDoor(px,py, true); }
    }
  }
}

function drawDecor(){
  for (let y=0;y<ROWS;y++){
    for (let x=0;x<COLS;x++){
      const c = activeMap[y][x];
      const px=x*TILE, py=y*TILE;
      if (c==='T'){
        if (state.scene === 'csmt'){
          // tools are 2 tiles tall - draw only at the top tile to avoid stacking
          if (cmstIsToolHead(x,y)) drawCMSTTool(px,py,x,y);
        } else {
          drawAFM(px,py,x,y);
        }
      }
      else if (c==='W') drawCMSTConsole(px,py,x,y);
      else if (c==='C') drawWorkstation(px,py);
      else if (c==='b') drawBench(px,py,x,y);
      else if (c==='P') drawPlant(px,py);
      else if (c==='d') drawCoffeeMachine(px,py);
      else if (c==='s') drawSign(px,py);
      else if (c==='f') drawCabinet(px,py);
      else if (c==='w') drawWhiteboard(px,py);
      else if (c==='L') drawLocker(px,py,x,y);
      else if (c==='J') drawBlowerJet(px,py,x,y);
    }
  }
}

/* Big floor decal + arrow that screams "use a locker" the moment you
   step into the gowning room. Painted on the floor so it sits BEHIND
   the player and lockers but on TOP of the checker. */
function drawGowningSignage(){
  if (state.scene !== 'gowning') return;
  // hazard-stripe band running under the locker row
  for (let x = 1; x < 16; x++){
    const px = x*TILE, py = 2*TILE;
    for (let i = 0; i < TILE; i+=6){
      ctx.fillStyle = ((x*TILE + i) % 12 < 6) ? '#f3c012' : '#1a1208';
      ctx.fillRect(px + i, py, 3, 6);
    }
  }
  // big yellow "SUIT UP" floor stencil, centred
  const cx = 8*TILE, cy = 4*TILE + 12;
  ctx.save();
  ctx.fillStyle = 'rgba(243,192,18,0.85)';
  ctx.font = '900 28px "JetBrains Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('▲  SUIT UP  ▲', cx, cy);
  ctx.font = 'bold 11px "JetBrains Mono",monospace';
  ctx.fillStyle = 'rgba(40,28,12,0.85)';
  ctx.fillText('PRESS  E  AT A LOCKER', cx, cy + 18);
  // arrow toward the door (right side)
  ctx.strokeStyle = 'rgba(243,192,18,0.7)';
  ctx.lineWidth = 4;
  const ay = 5*TILE + TILE/2;
  ctx.beginPath();
  ctx.moveTo(11*TILE, ay); ctx.lineTo(15*TILE, ay);
  ctx.moveTo(15*TILE, ay); ctx.lineTo(15*TILE-8, ay-6);
  ctx.moveTo(15*TILE, ay); ctx.lineTo(15*TILE-8, ay+6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(243,192,18,0.85)';
  ctx.font = 'bold 9px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CLEANROOM →', 11*TILE+4, ay-10);
  ctx.restore();
}

/* Suiting-room locker - tall metal door with a vent strip. */
function drawLocker(px,py,x,y){
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(px+1, py+TILE-2, TILE-2, 2);
  // body
  ctx.fillStyle = '#cfd6db'; ctx.fillRect(px+1, py+1, TILE-2, TILE-3);
  // bevels
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(px+1, py+1, TILE-2, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(px+1, py+TILE-3, TILE-2, 1);
  // door split
  ctx.fillStyle = '#9aa3a8'; ctx.fillRect(px+TILE/2, py+1, 1, TILE-3);
  // handles
  ctx.fillStyle = '#3a4045';
  ctx.fillRect(px+TILE/2-5, py+TILE/2, 3, 2);
  ctx.fillRect(px+TILE/2+2, py+TILE/2, 3, 2);
  // vent strips
  ctx.fillStyle = '#3a4045';
  for (let i=0;i<3;i++){
    ctx.fillRect(px+5, py+5+i*2, TILE-10, 1);
  }
  // tag (number-ish)
  ctx.fillStyle = '#fdfefe'; ctx.fillRect(px+8, py+TILE-9, TILE-16, 4);
  ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 5px "JetBrains Mono",monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(((x*7+y) % 90 + 10).toString(), px+TILE/2, py+TILE-7);
}

/* Air-shower blower jet - ceiling nozzle with animated airflow streaks. */
function drawBlowerJet(px,py,x,y){
  // ceiling-mounted housing
  ctx.fillStyle = '#9aa3a8'; ctx.fillRect(px+8, py+1, TILE-16, 5);
  ctx.fillStyle = '#cfd6db'; ctx.fillRect(px+8, py+1, TILE-16, 1);
  ctx.fillStyle = '#3a4045'; ctx.fillRect(px+10, py+5, TILE-20, 2);
  // animated airflow streaks
  const t = state.tick + (x*7+y*13);
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i=0;i<6;i++){
    const off = ((t*0.6) + i*6) % 26;
    const a = 0.55 * (1 - off/26);
    ctx.fillStyle = `rgba(190,225,240,${a})`;
    ctx.fillRect(px+TILE/2 - 6 + (i%3)*5, py+8 + off, 2, 4);
  }
  ctx.restore();
  // floor reflection patch
  ctx.fillStyle = 'rgba(190,225,240,0.20)';
  ctx.beginPath();
  ctx.ellipse(px+TILE/2, py+TILE-4, 9, 3, 0, 0, Math.PI*2);
  ctx.fill();
}

function drawEntities(){
  if (state.scene === 'csmt') ensureCMSTNPCs();
  const npcs = state.scene === 'play' ? NPCS : [];
  const cmstNpcs = state.scene === 'csmt' ? CMST_NPCS : [];
  // walking CMST NPCs need a y-sort that follows their animated position
  const cmstSorted = cmstNpcs.map(n=>{
    if (n.kind === 'sit') return { t:'cn', e:n, y:n.y*TILE };
    return { t:'cn', e:n, y:n.y*TILE };
  });
  const ents = [
    ...npcs.map(n=>({t:'n', e:n, y:n.y*TILE})),
    ...cmstSorted,
    {t:'p', e:player, y:player.py+1}
  ];
  ents.sort((a,b)=>a.y-b.y);
  ents.forEach(ent => {
    if (ent.t==='p') drawPlayer();
    else if (ent.t==='cn') drawCMSTNPC(ent.e);
    else drawNPC(ent.e);
  });
  if (state.scene === 'csmt'){ drawSpanner(); drawOHTLayer(); }
}

/* ── Spanner held by player in CMST scene ──
   Anchored to the actual hand pixel so it doesn't float. The character
   sprite's right hand sits at (baseX+19, baseY+18+bob+aOff) and the left
   hand at (baseX+1, baseY+18+bob+aOff). baseX = px+(TILE-22)/2, baseY = py+2. */
function drawSpanner(){
  // ctx is already translated by -camera in render(); use world coords.
  const px = player.px, py = player.py;
  const baseX = px + (TILE-22)/2;
  const baseY = py + 2;
  const bob = Math.floor(Math.sin((state.tick + (px+py))/30)*0.6);

  // recover walk frame the same way drawPlayer does
  let wf = 0;
  if (player.moving){
    const t = Math.min(1,(performance.now()-moveStart)/MOVE_DURATION);
    const phase = (player.stepFrame + (t>0.5?1:0)) % 2;
    wf = phase===0 ? 1 : 3;
  }
  // hand offsets from baseX/baseY
  let handX, handY;
  if (player.dir === 'down' || player.dir === 'up'){
    // use right hand (pixel x=19) for visibility
    const aOff = (wf===3) ? 1 : 0;
    handX = baseX + 20;
    handY = baseY + 19 + bob + aOff;
  } else if (player.dir === 'left'){
    const swing = wf===1 ? 1 : (wf===3 ? -1 : 0);
    handX = baseX + 1;
    handY = baseY + 19 + bob + swing;
  } else { // right
    const swing = wf===1 ? 1 : (wf===3 ? -1 : 0);
    handX = baseX + 20;
    handY = baseY + 19 + bob + swing;
  }
  // swing animation
  const swing = state.spannerSwing;
  let dx = 0, dy = 0;
  if (swing > 0){
    const k = Math.sin((20-swing)/20 * Math.PI);
    if (player.dir==='left') dx = -k*7;
    else if (player.dir==='right') dx = k*7;
    else if (player.dir==='up') dy = -k*7;
    else dy = k*7;
  }
  // spanner is held vertically when facing up/down, horizontally when left/right
  const horiz = (player.dir === 'left' || player.dir === 'right');
  ctx.save();
  ctx.translate(handX + dx, handY + dy);
  // small grip rotation toward swing direction
  if (swing > 0){
    const k = Math.sin((20-swing)/20 * Math.PI);
    const tilt = (player.dir==='left' || player.dir==='up') ? -k*0.6 : k*0.6;
    ctx.rotate(tilt);
  }
  if (horiz){
    // shaft along x
    ctx.fillStyle = '#3a2618'; ctx.fillRect(-3, -1, 4, 2);   // grip
    ctx.fillStyle = '#9aa3a8'; ctx.fillRect( 1, -1, 9, 2);   // shaft
    ctx.fillStyle = '#c5cdd2'; ctx.fillRect(10, -3, 4, 6);   // jaw
    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(11, -1, 2, 2);
  } else {
    // shaft along y
    ctx.fillStyle = '#3a2618'; ctx.fillRect(-1, -3, 2, 4);   // grip
    ctx.fillStyle = '#9aa3a8'; ctx.fillRect(-1,  1, 2, 9);   // shaft
    ctx.fillStyle = '#c5cdd2'; ctx.fillRect(-3, 10, 6, 4);   // jaw
    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(-1, 11, 2, 2);
  }
  ctx.restore();
}

/* ── Walls ── */
function drawWallTile(px,py,x,y,front){
  const csmt = state.scene === 'csmt' || state.scene === 'gowning';
  const faceCol = csmt ? '#f4f7f9' : PAL.wallFace;
  const seamCol = csmt ? '#cfd6db' : PAL.wallDark;
  const trimCol = csmt ? '#dfe5e9' : PAL.wallTrim;
  const goldCol = csmt ? '#cc0a17' : PAL.gold;
  ctx.fillStyle = faceCol; ctx.fillRect(px,py,TILE,TILE);
  // vertical plank seams (panel joins in csmt)
  ctx.fillStyle = seamCol;
  ctx.fillRect(px,py,1,TILE);
  ctx.fillRect(px+TILE/2,py,1,TILE);
  // cream trim top
  ctx.fillStyle = trimCol;
  ctx.fillRect(px,py,TILE,3);
  ctx.fillStyle = goldCol;
  ctx.fillRect(px,py+3,TILE,1);
  // shading
  ctx.fillStyle = csmt ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.18)';
  ctx.fillRect(px,py+TILE-4,TILE,4);

  // warm wall lamp every few tiles (cool fluorescent in csmt)
  if ((x===2 || x===10 || x===18 || x===26) && y===1){
    ctx.fillStyle = csmt ? '#b8c0c5' : PAL.wallDark; ctx.fillRect(px+12,py+10,8,4);
    ctx.fillStyle = csmt ? '#e8f4ff' : PAL.wallLamp; ctx.fillRect(px+13,py+14,6,4);
    // glow
    const g = ctx.createRadialGradient(px+TILE/2, py+18, 2, px+TILE/2, py+18, 28);
    if (csmt){
      g.addColorStop(0, 'rgba(220,235,255,0.55)');
      g.addColorStop(1, 'rgba(220,235,255,0)');
    } else {
      g.addColorStop(0, 'rgba(255,200,120,0.6)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(px-16, py-4, 64, 64);
  }
  // warning sign
  if (x===8 && y===1){
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.moveTo(px+TILE/2,py+8); ctx.lineTo(px+TILE-6,py+TILE-6); ctx.lineTo(px+6,py+TILE-6); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.darker; ctx.font='bold 14px Inter';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('!', px+TILE/2, py+TILE-10);
  }
  // NSC plaque (or CSMT logo when in the easter-egg fab)
  if (x===23 && y===1){
    ctx.fillStyle = PAL.darker; ctx.fillRect(px+3,py+8,TILE-6,14);
    if (state.scene === 'csmt'){
      ctx.fillStyle = '#cc0a17'; ctx.font='900 10px "JetBrains Mono",monospace';
    } else {
      ctx.fillStyle = PAL.amber; ctx.font='bold 10px "JetBrains Mono",monospace';
    }
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(state.scene === 'csmt' ? 'FF2' : 'NSC', px+TILE/2, py+15);
  }
  // CSMT signage on additional wall tiles when in easter-egg scene
  if (state.scene === 'csmt' && y===1 && (x===5 || x===11 || x===17)){
    ctx.fillStyle = '#fdf3ee'; ctx.fillRect(px+2,py+8,TILE-4,16);
    ctx.fillStyle = '#cc0a17'; ctx.font='900 11px "JetBrains Mono",monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('FAB·2', px+TILE/2, py+16);
  }

  if (front){
    // shadow at base
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px, py+TILE, TILE, 5);
  }
}

function drawDoor(px,py, back){
  // antechamber scenes use a cool industrial palette, HQ keeps the warm wood
  const ante = state.scene === 'gowning' || state.scene === 'csmt';
  const frameCol = ante ? '#dde3e8' : PAL.wallFace;
  const slabCol  = ante ? '#3a4045' : PAL.darker;
  const trimCol  = ante ? '#cfd6db' : PAL.wallTrim;
  ctx.fillStyle = frameCol; ctx.fillRect(px,py,TILE,TILE);
  ctx.fillStyle = slabCol;  ctx.fillRect(px+4,py+2,TILE-8,TILE-4);
  ctx.fillStyle = ante ? '#cc0a17' : PAL.gold;
  ctx.fillRect(px+TILE-8,py+TILE/2,2,3);
  ctx.fillStyle = trimCol; ctx.fillRect(px,py,TILE,3);
  ctx.fillStyle = ante ? '#cc0a17' : PAL.amber;
  ctx.font="bold 7px 'JetBrains Mono',monospace"; ctx.textAlign='center';
  ctx.fillText(back ? 'BACK' : 'EXIT', px+TILE/2, py+10);
}

/* ── Workstation ── */
function drawWorkstation(px,py){
  // desk
  ctx.fillStyle = '#5a4028'; ctx.fillRect(px,py+10,TILE,TILE-10);
  ctx.fillStyle = '#7a5836'; ctx.fillRect(px,py+10,TILE,2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px,py+TILE-3,TILE,3);
  // monitor
  ctx.fillStyle = PAL.darker; ctx.fillRect(px+5,py+2,22,16);
  // animated screen
  ctx.fillStyle = '#0a1828'; ctx.fillRect(px+7,py+4,18,12);
  const scanY = (state.tick/3)%10;
  ctx.fillStyle = PAL.teal; ctx.fillRect(px+7,py+4+scanY,18,1);
  ctx.fillStyle = PAL.amber;
  for (let i=0;i<3;i++) ctx.fillRect(px+9+i*5, py+7+((i+state.tick/10)%4), 3, 1);
  ctx.fillStyle = '#6ad68a'; ctx.fillRect(px+21,py+5,2,1);
  // stand + base
  ctx.fillStyle = PAL.darker; ctx.fillRect(px+14,py+18,4,3);
  ctx.fillRect(px+10,py+21,12,2);
  // keyboard
  ctx.fillStyle = '#2f241a'; ctx.fillRect(px+4,py+24,24,5);
  ctx.fillStyle = '#6a5238';
  for (let i=0;i<6;i++) ctx.fillRect(px+6+i*4,py+25,2,1);
}

/* ── Bench ── */
function drawBench(px,py,x,y){
  // wooden bench top
  const g = ctx.createLinearGradient(px,py,px,py+TILE);
  g.addColorStop(0,'#9a7a52'); g.addColorStop(1,'#6a4f38');
  ctx.fillStyle = g; ctx.fillRect(px,py,TILE,TILE);
  ctx.fillStyle = 'rgba(255,235,190,0.15)'; ctx.fillRect(px,py+1,TILE,1);
  // wood grain
  ctx.fillStyle = 'rgba(42,24,14,0.2)';
  for (let i=5;i<TILE-2;i+=4) ctx.fillRect(px+2,py+i,TILE-4,1);
  // deterministic prop
  const seed = (x*7+y*3)%6;
  if (seed===0){ // beaker
    ctx.fillStyle = PAL.teal; ctx.fillRect(px+11,py+6,10,14);
    ctx.fillStyle = 'rgba(244,234,208,0.5)'; ctx.fillRect(px+12,py+7,3,12);
    ctx.fillStyle = '#6a4f79'; ctx.fillRect(px+11,py+10,10,2);
    ctx.fillStyle = PAL.darker; ctx.fillRect(px+11,py+5,10,2);
  } else if (seed===1){ // clipboard
    ctx.fillStyle = PAL.red; ctx.fillRect(px+8,py+5,14,18);
    ctx.fillStyle = PAL.cream; ctx.fillRect(px+10,py+8,10,13);
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(px+11,py+10,7,1); ctx.fillRect(px+11,py+13,8,1); ctx.fillRect(px+11,py+16,6,1);
  } else if (seed===2){ // toolbox
    ctx.fillStyle = '#c93d25'; ctx.fillRect(px+4,py+10,24,14);
    ctx.fillStyle = '#7a2416'; ctx.fillRect(px+4,py+22,24,2);
    ctx.fillStyle = PAL.amber; ctx.fillRect(px+12,py+13,8,2);
    ctx.fillStyle = PAL.darker; ctx.fillRect(px+14,py+8,4,3);
  } else if (seed===3){ // sticky notes
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(px+6,py+6,10,10);
    ctx.fillStyle = '#f7a8be'; ctx.fillRect(px+14,py+10,10,10);
    ctx.fillStyle = 'rgba(42,24,14,0.5)';
    ctx.fillRect(px+8,py+9,6,1); ctx.fillRect(px+8,py+11,5,1);
    ctx.fillRect(px+16,py+13,6,1); ctx.fillRect(px+16,py+15,5,1);
  } else if (seed===4){ // coffee mug
    ctx.fillStyle = PAL.cream; ctx.fillRect(px+10,py+8,10,14);
    ctx.fillStyle = PAL.cream; ctx.fillRect(px+19,py+11,4,6);
    ctx.strokeStyle = PAL.darker; ctx.lineWidth=1; ctx.strokeRect(px+19.5,py+11.5,3,5);
    ctx.fillStyle = '#3e2413'; ctx.fillRect(px+11,py+10,8,2);
    ctx.fillStyle = PAL.red; ctx.fillRect(px+11,py+16,8,1);
    // steam
    const st = (state.tick/10)%8;
    ctx.fillStyle = `rgba(244,234,208,${0.5-st/20})`;
    ctx.fillRect(px+13,py+4-st,2,2);
    ctx.fillRect(px+17,py+6-st,2,2);
  } else { // test samples
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px+6,py+10,8,8);
    ctx.fillStyle = '#aaa'; ctx.fillRect(px+7,py+11,6,6);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px+18,py+10,8,8);
    ctx.fillStyle = '#aaa'; ctx.fillRect(px+19,py+11,6,6);
    ctx.fillStyle = 'rgba(232,182,88,0.4)'; ctx.fillRect(px+8,py+12,4,4);
  }
  // bench shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(px, py+TILE, TILE, 3);
}

function drawPlant(px,py){
  // pot
  ctx.fillStyle = '#6a3e20'; ctx.fillRect(px+6,py+20,20,10);
  ctx.fillStyle = '#8a5230'; ctx.fillRect(px+6,py+20,20,2);
  ctx.fillStyle = '#4a2a18'; ctx.fillRect(px+6,py+28,20,2);
  // leaves with subtle wind
  const s = Math.sin(state.tick/40);
  ctx.fillStyle = '#3a5a1c';
  for (let i=0;i<5;i++){
    const ang = -Math.PI/2 + (i-2)*0.45 + s*0.06;
    const lx = px+16 + Math.cos(ang)*4, ly = py+18 + Math.sin(ang)*4;
    ctx.beginPath();
    ctx.ellipse(lx + Math.cos(ang)*7, ly + Math.sin(ang)*11, 6, 10, ang, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = PAL.leafGreen;
  ctx.beginPath(); ctx.ellipse(px+16,py+6+s*0.8,5,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(px+11,py+11,5,7,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(px+21,py+11,5,7,0.4,0,Math.PI*2); ctx.fill();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(px+16,py+31,12,3,0,0,Math.PI*2); ctx.fill();
}

function drawCoffeeMachine(px,py){
  ctx.fillStyle = '#2a1f18'; ctx.fillRect(px,py+6,TILE,TILE-6);
  ctx.fillStyle = '#3a2f24'; ctx.fillRect(px,py+6,TILE,2);
  ctx.fillStyle = '#d5c9a8'; ctx.fillRect(px+4,py+8,24,16);
  ctx.fillStyle = '#9a8e6c'; ctx.fillRect(px+4,py+22,24,2);
  ctx.fillStyle = PAL.darker; ctx.fillRect(px+7,py+11,18,7);
  ctx.fillStyle = PAL.amber; ctx.fillRect(px+9,py+13,6,3);
  ctx.fillStyle = '#3a3028'; ctx.fillRect(px+14,py+18,4,4);
  // steam
  const st = (state.tick/6)%10;
  ctx.fillStyle=`rgba(244,234,208,${0.45-st/25})`;
  ctx.beginPath(); ctx.arc(px+16,py+4-st,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(px+12,py+6-st,2,0,Math.PI*2); ctx.fill();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py+TILE, TILE, 3);
}

function drawSign(px,py){
  ctx.fillStyle = '#3a2818'; ctx.fillRect(px+10,py+6,12,16);
  ctx.fillStyle = PAL.cream; ctx.fillRect(px+12,py+8,8,11);
  ctx.fillStyle = PAL.darker;
  ctx.fillRect(px+13,py+10,6,1); ctx.fillRect(px+13,py+12,5,1);
  ctx.fillRect(px+13,py+14,6,1); ctx.fillRect(px+13,py+16,4,1);
  // pole
  ctx.fillStyle = '#5a4028'; ctx.fillRect(px+15,py+22,2,8);
  ctx.fillStyle = '#2a1f18'; ctx.fillRect(px+13,py+30,6,1);
}

function drawCabinet(px,py){
  ctx.fillStyle = '#5a4028'; ctx.fillRect(px+2,py+4,TILE-4,TILE-4);
  ctx.fillStyle = '#7a5836'; ctx.fillRect(px+2,py+4,TILE-4,2);
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(px+4,py+8,TILE-8,6);
  ctx.fillRect(px+4,py+16,TILE-8,6);
  ctx.fillRect(px+4,py+24,TILE-8,6);
  ctx.fillStyle = PAL.amber;
  ctx.fillRect(px+TILE-8,py+10,2,2);
  ctx.fillRect(px+TILE-8,py+18,2,2);
  ctx.fillRect(px+TILE-8,py+26,2,2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py+TILE, TILE, 3);
}

function drawWhiteboard(px,py){
  ctx.fillStyle = PAL.cream; ctx.fillRect(px+2,py+2,TILE-4,TILE-10);
  ctx.fillStyle = '#3a2818'; ctx.fillRect(px,py,TILE,2);
  ctx.fillStyle = PAL.darker; ctx.fillRect(px+2,py+2,TILE-4,1);
  // scribbles
  ctx.fillStyle = '#2a5a8a'; ctx.fillRect(px+5,py+6,10,1); ctx.fillRect(px+5,py+8,14,1);
  ctx.fillStyle = PAL.red; ctx.fillRect(px+5,py+12,18,1); ctx.fillRect(px+5,py+14,8,1);
  ctx.fillStyle = '#3a7a3a'; ctx.fillRect(px+5,py+18,20,1); ctx.fillRect(px+5,py+20,12,1);
  // marker tray
  ctx.fillStyle = '#5a4028'; ctx.fillRect(px+2,py+TILE-8,TILE-4,3);
  ctx.fillStyle = PAL.red; ctx.fillRect(px+6,py+TILE-7,2,2);
  ctx.fillStyle = '#2a5a8a'; ctx.fillRect(px+11,py+TILE-7,2,2);
  ctx.fillStyle = '#3a7a3a'; ctx.fillRect(px+16,py+TILE-7,2,2);
}

/* ── AFM Tool ── */
function drawAFM(px,py,x,y){
  // tool is INSIDE a cubicle; only the researcher's assigned one should look urgent
  const npc = NPCS.find(n=>Math.abs((n.x-x))<=1 && Math.abs((n.y-2-y))<=4);
  const broken = npc && !npc.done;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(px+TILE/2,py+TILE-1,14,4,0,0,Math.PI*2); ctx.fill();

  // anti-vib platform
  ctx.fillStyle = '#2f241a'; ctx.fillRect(px+1,py+24,TILE-2,6);
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(px+1,py+24,TILE-2,1);
  ctx.fillStyle = '#1a120a'; ctx.fillRect(px+1,py+29,TILE-2,1);

  // hood with cream/teal coloring (not the old harsh orange)
  const g = ctx.createLinearGradient(px,py,px,py+24);
  g.addColorStop(0, PAL.metalShine); g.addColorStop(0.4, PAL.metal); g.addColorStop(1, PAL.metalDk);
  ctx.fillStyle = g; ctx.fillRect(px+2,py+3,TILE-4,22);
  // teal trim
  ctx.fillStyle = PAL.teal; ctx.fillRect(px+2,py+12,TILE-4,2);
  ctx.fillStyle = PAL.tealDk; ctx.fillRect(px+2,py+14,TILE-4,1);
  // panel seams
  ctx.fillStyle = 'rgba(42,24,14,0.3)';
  ctx.fillRect(px+TILE/2-0.5,py+3,1,9);
  // screen
  ctx.fillStyle = '#0a1828'; ctx.fillRect(px+5,py+6,10,6);
  for (let i=0;i<3;i++){
    ctx.fillStyle = (i%2) ? PAL.teal : PAL.amber;
    ctx.fillRect(px+6,py+7+i*2,8,1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(px+5,py+6,10,1);
  // status LED
  const blink = Math.floor(state.tick/15)%2===0;
  const ledColor = broken ? (blink ? '#ff7a4a' : '#8a2a1a') : (blink ? '#6ad68a' : '#3a6a4a');
  ctx.fillStyle = ledColor;
  ctx.fillRect(px+TILE-7,py+6,3,3);
  if (blink){
    ctx.fillStyle = broken ? 'rgba(255,122,74,0.4)' : 'rgba(106,214,138,0.4)';
    ctx.fillRect(px+TILE-9,py+4,7,7);
  }
  // nameplate
  ctx.fillStyle = PAL.darker; ctx.fillRect(px+17,py+8,10,4);
  ctx.fillStyle = PAL.amber; ctx.font="bold 5px 'JetBrains Mono',monospace";
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText("NSC-V", px+22, py+10);
  // scanner head
  ctx.fillStyle = '#2a1f18'; ctx.fillRect(px+11,py+16,10,8);
  ctx.fillStyle = PAL.metal; ctx.fillRect(px+13,py+18,6,2);
  // laser + glow
  ctx.fillStyle = 'rgba(232,120,60,0.8)';
  ctx.fillRect(px+14,py+21,4,2);
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(px+15,py+21,2,1);
  // feet
  ctx.fillStyle = PAL.darker;
  ctx.fillRect(px+3,py+30,4,2); ctx.fillRect(px+TILE-7,py+30,4,2);
  // top bevel
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px+2,py+3,TILE-4,2);

  // CSMT easter-egg: smoke from broken tools
  if (state.scene === 'csmt' && state.csmtSmoking.has(x+','+y)){
    const t = state.tick;
    for (let i=0; i<5; i++){
      const phase = (t/4 + i*23) % 60;
      const sx = px + TILE/2 + Math.sin((t+i*30)/12) * (3 + phase*0.15);
      const sy = py + 4 - phase*0.6;
      const r = 3 + phase*0.12;
      const a = 0.55 * (1 - phase/60);
      ctx.fillStyle = `rgba(60,50,46,${a})`;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(120,110,104,${a*0.6})`;
      ctx.beginPath(); ctx.arc(sx-1, sy-1, r*0.6, 0, Math.PI*2); ctx.fill();
    }
    // red warning blink on the chassis
    if (Math.floor(t/12)%2===0){
      ctx.fillStyle = '#cc0a17'; ctx.fillRect(px+TILE-9, py+11, 3, 3);
    }
  }
}

/* ── CMST FAB DECOR ───────────────────────────────────────────────
   Tools span 2 vertical tiles (head + body). drawCMSTTool is invoked
   only on the head tile and renders the full 64-px tall machine.   */
function drawCMSTTool(px,py,x,y){
  const meta = cmstToolMeta(x,y);
  const fullH = 2*TILE;
  const top = py;
  const bot = py + fullH;
  const cx = px + TILE/2;
  // size scaling
  const widthInset = meta.size === 0 ? 5 : meta.size === 1 ? 3 : 1;
  const x0 = px + widthInset, x1 = px + TILE - widthInset;
  const w = x1 - x0;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(cx, bot-1, 13, 4, 0, 0, Math.PI*2); ctx.fill();
  // base plinth
  ctx.fillStyle = '#a8b1b6';
  ctx.fillRect(x0-1, bot-7, w+2, 6);
  ctx.fillStyle = '#7e878d'; ctx.fillRect(x0-1, bot-2, w+2, 1);
  // chassis
  const grad = ctx.createLinearGradient(x0, top, x1, top);
  grad.addColorStop(0, '#e9eef1');
  grad.addColorStop(0.5, '#fafcfd');
  grad.addColorStop(1, '#cdd5da');
  ctx.fillStyle = grad;
  ctx.fillRect(x0, top+4, w, fullH-12);
  // top cap (brand-coloured)
  const brandCol = ({
    ASML:'#0034a8', AMAT:'#cc0a17', LAM:'#1a8a4a',
    KLA:'#5a2a8a', TEL:'#0a6aa8', HITACHI:'#cc6a0a'
  })[meta.brand];
  ctx.fillStyle = brandCol;
  ctx.fillRect(x0, top+2, w, 5);
  // panel seams
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(x0, top+TILE-2, w, 1);
  ctx.fillRect(cx-0.5, top+8, 1, fullH-18);
  // viewport / screen
  const vy = top + 12;
  ctx.fillStyle = '#0a1828'; ctx.fillRect(x0+3, vy, w-6, 10);
  for (let i=0;i<3;i++){
    ctx.fillStyle = (i+meta.hash)%2 ? '#3aa8d6' : '#e88f3a';
    ctx.fillRect(x0+4, vy+1+i*3, w-8, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x0+3, vy, w-6, 1);
  // status LED row
  const blink = Math.floor((state.tick + meta.hash)/15)%2===0;
  const broken = state.csmtSmoking.has(x+','+y);
  for (let i=0;i<3;i++){
    const lit = blink && (i===meta.hash%3);
    ctx.fillStyle = broken
      ? (i===0 ? (blink?'#ff4a3a':'#5a1a14') : '#3a2018')
      : (lit ? ['#6ad68a','#e88f3a','#3aa8d6'][i] : '#22303a');
    ctx.fillRect(x0+4+i*4, vy+12, 3, 2);
  }
  // brand nameplate (white panel, brand colour text, auto-fits panel width)
  const np_y = top + 28;
  ctx.fillStyle = '#fdfefe';
  ctx.fillRect(x0+1, np_y, w-2, 8);
  ctx.fillStyle = brandCol;
  // pick the largest font size that still fits the panel
  let fpx = 7;
  ctx.font = 'bold ' + fpx + 'px "JetBrains Mono",monospace';
  while (ctx.measureText(meta.brand).width > w - 4 && fpx > 4){
    fpx -= 1;
    ctx.font = 'bold ' + fpx + 'px "JetBrains Mono",monospace';
  }
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(meta.brand, cx, np_y+4);
  // size detail: large tools get an extra port/exhaust
  if (meta.size === 2){
    ctx.fillStyle = '#3a4045';
    ctx.fillRect(x0+2, top+TILE+4, w-4, 6);
    ctx.fillStyle = '#1a2024';
    ctx.fillRect(x0+4, top+TILE+5, w-8, 2);
  } else if (meta.size === 1){
    // medium tools: a vent strip
    ctx.fillStyle = '#3a4045';
    for (let i=0;i<3;i++){
      ctx.fillRect(x0+3, top+TILE+5+i*3, w-6, 1);
    }
  }
  // bevel highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x0+1, top+8, 1, fullH-18);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x1-1, top+8, 1, fullH-18);

  // smoke + warning blink for broken tools
  if (broken){
    const t = state.tick;
    for (let i=0; i<6; i++){
      const phase = (t/4 + i*23) % 60;
      const sx = cx + Math.sin((t+i*30)/12) * (3 + phase*0.18);
      const sy = top + 6 - phase*0.7;
      const r = 3 + phase*0.13;
      const a = 0.55 * (1 - phase/60);
      ctx.fillStyle = `rgba(60,50,46,${a})`;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(160,150,144,${a*0.55})`;
      ctx.beginPath(); ctx.arc(sx-1, sy-1, r*0.6, 0, Math.PI*2); ctx.fill();
    }
    if (Math.floor(t/10)%2===0){
      ctx.fillStyle = '#ff2a17';
      ctx.fillRect(x1-4, top+6, 3, 3);
    }
  }
}

/* CMST workstation: low desk + monitor. NPCs are drawn separately. */
function drawCMSTConsole(px,py,x,y){
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(px+1, py+TILE-3, TILE-2, 3);
  // desk top
  ctx.fillStyle = '#dbe3e7'; ctx.fillRect(px, py+18, TILE, 10);
  ctx.fillStyle = '#b6c0c5'; ctx.fillRect(px, py+27, TILE, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(px, py+18, TILE, 1);
  // monitor stand
  ctx.fillStyle = '#5a6065'; ctx.fillRect(px+TILE/2-2, py+14, 4, 5);
  // monitor
  ctx.fillStyle = '#1a1f24'; ctx.fillRect(px+5, py+4, TILE-10, 12);
  ctx.fillStyle = '#0a1828'; ctx.fillRect(px+6, py+5, TILE-12, 10);
  // screen content (changes per console)
  const h = (x*17 + y*7) >>> 0;
  const blink = Math.floor((state.tick + h)/20)%2===0;
  for (let i=0;i<3;i++){
    ctx.fillStyle = (i + (blink?1:0))%2 ? '#3aa8d6' : '#6ad68a';
    ctx.fillRect(px+7, py+6+i*3, TILE-14, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(px+6, py+5, TILE-12, 1);
  // keyboard hint
  ctx.fillStyle = '#5a6065';
  ctx.fillRect(px+6, py+22, TILE-12, 2);
}

/* CMST NPCs - generated once, animated each frame.
   Roles: 'sit' anchors to a workstation tile; 'walk' patrols horizontally. */
const CMST_SUITS = {
  white: { coat:'#f4f6f8', pants:'#eef1f3', accent:'#dfe5e9', hood:'#f4f6f8', visor:'#dfe7ee' },
  pink:  { coat:'#f6c4d6', pants:'#e9aabe', accent:'#cf8aa2', hood:'#f6c4d6', visor:'#f0d2dd' },
  red:   { coat:'#cc2a2a', pants:'#a81e1e', accent:'#7a1414', hood:'#cc2a2a', visor:'#e8b0b0' },
  brown: { coat:'#8a5a32', pants:'#6e4422', accent:'#4a2e16', hood:'#8a5a32', visor:'#d6c2a6' },
};
let CMST_NPCS = null;
function ensureCMSTNPCs(){
  if (CMST_NPCS) return;
  CMST_NPCS = [];
  // seated NPCs ALWAYS in white bunny suits (techs/operators)
  const seats = [];
  for (let yy=0; yy<CSMT_MAP.length; yy++){
    for (let xx=0; xx<CSMT_MAP[0].length; xx++){
      if (CSMT_MAP[yy][xx]==='W') seats.push({x:xx,y:yy});
    }
  }
  seats.forEach((s, i)=>{
    if (i % 2 === 0){
      CMST_NPCS.push({ kind:'sit', x:s.x, y:s.y+1, suit:'white', dir:'up' });
    }
  });
  // walking patrols on the wide aisles, much slower & smoother
  const aisles = [
    { y:5,  x0:2, x1:28, suit:'white', speed:0.00040 },
    { y:8,  x0:3, x1:27, suit:'pink',  speed:0.00028 },
    { y:12, x0:2, x1:28, suit:'red',   speed:0.00035 },
    { y:15, x0:4, x1:26, suit:'brown', speed:0.00024 },
    { y:8,  x0:14, x1:26, suit:'pink', speed:0.00032, phase:1.7 },
    { y:15, x0:2, x1:18, suit:'white', speed:0.00042, phase:0.9 },
  ];
  aisles.forEach((a,i)=>{
    CMST_NPCS.push({ kind:'walk', y:a.y, x0:a.x0, x1:a.x1, suit:a.suit,
                     speed:a.speed, phase:a.phase || (i*0.6) });
  });
}

function drawCMSTNPC(n){
  ensureCMSTNPCs();
  const suit = CMST_SUITS[n.suit] || CMST_SUITS.white;
  if (n.kind === 'sit'){
    const px = n.x*TILE, py = n.y*TILE;
    drawSuit(px, py, 'up', 0, suit, false);
  } else {
    // walking back-and-forth
    const span = n.x1 - n.x0;
    const t = state.tick * n.speed + (n.phase || 0);
    const tri = Math.abs(((t % 2) - 1));   // 0..1..0
    const fx = n.x0 + tri * span;
    const dir = (Math.cos(Math.PI * t) >= 0) ? 'right' : 'left';
    // walk frames cycle in step with actual displacement so the legs
    // never out-pace the body (looks natural at any patrol speed)
    const wf = Math.floor(fx * 4) % 4;
    drawSuit(fx*TILE, n.y*TILE, dir, wf, suit, false);
  }
}

/* draws a cleanroom-suited figure independent of CHARS */
function drawSuit(px, py, dir, walkFrame, suit, isPlayer){
  const baseX = px + (TILE-22)/2;
  const baseY = py + 2;
  const p = (x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(Math.round(baseX+x),Math.round(baseY+y),w,h); };
  const bob = Math.floor(Math.sin((state.tick + (px+py))/30)*0.6);
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(px+TILE/2, py+TILE-1, 11, 3.5, 0, 0, Math.PI*2); ctx.fill();
  // legs (walk cycle)
  let offL=0, offR=0;
  if (walkFrame===1){ offL=-1; offR=1; }
  else if (walkFrame===3){ offL=1; offR=-1; }
  p(5, 22+offL, 5, 6, suit.pants);
  p(12, 22+offR, 5, 6, suit.pants);
  p(5, 22+offL, 1, 6, 'rgba(0,0,0,0.18)');
  p(12, 22+offR, 1, 6, 'rgba(0,0,0,0.18)');
  // boots
  p(5, 27+offL, 5, 2, '#1a1a1a');
  p(12, 27+offR, 5, 2, '#1a1a1a');
  // torso (coat)
  p(3, 11+bob, 16, 12, '#1a1a1a');
  p(4, 12+bob, 14, 10, suit.coat);
  p(4, 12+bob, 14, 1, 'rgba(255,255,255,0.25)');
  p(4, 21+bob, 14, 1, 'rgba(0,0,0,0.18)');
  p(10, 12+bob, 2, 10, suit.accent);
  // arms
  if (dir==='down' || dir==='up'){
    const aOffL = (walkFrame===1) ? 1 : 0;
    const aOffR = (walkFrame===3) ? 1 : 0;
    p(1, 12+bob+aOffL, 3, 8, '#1a1a1a');
    p(2, 13+bob+aOffL, 2, 6, suit.coat);
    p(2, 18+bob+aOffL, 2, 2, suit.visor);
    p(18, 12+bob+aOffR, 3, 8, '#1a1a1a');
    p(19, 13+bob+aOffR, 2, 6, suit.coat);
    p(19, 18+bob+aOffR, 2, 2, suit.visor);
  } else {
    const aX = dir==='left' ? 0 : 18;
    const swing = walkFrame===1 ? 1 : (walkFrame===3 ? -1 : 0);
    p(aX, 12+bob+swing, 3, 8, '#1a1a1a');
    p(aX+1, 13+bob+swing, 2, 6, suit.coat);
    p(aX+1, 18+bob+swing, 2, 2, suit.visor);
  }
  // head + hood
  const hx=5, hy=0+bob;
  p(hx-2, hy-1, 16, 14, suit.hood);
  p(hx-2, hy-1, 16, 1, 'rgba(255,255,255,0.7)');
  p(hx+1, hy+3, 10, 8, suit.visor);
  p(hx+1, hy+3, 10, 1, 'rgba(255,255,255,0.55)');
  if (dir==='down'){
    p(hx+3, hy+6, 2, 2, '#2a2a2a');
    p(hx+7, hy+6, 2, 2, '#2a2a2a');
  } else if (dir!=='up'){
    const flip = dir==='left';
    const ex = flip ? hx+3 : hx+7;
    p(ex, hy+6, 2, 2, '#2a2a2a');
  }
  p(hx+1, hy+10, 10, 1, 'rgba(0,0,0,0.18)');
}

/* OHT (overhead hoist transport) running on a ceiling rail */
function drawOHTLayer(){
  // Three ceiling rails. Each rail carries multiple cassette carriers
  // spaced evenly so there's always at least one visible - previously a
  // single carrier would vanish during the wrap-around at the right wall. */
  const rails = [
    { y:1.6, speed:0.35, phase:0,   carriers:3 },
    { y:8.6, speed:0.28, phase:90,  carriers:3 },
    { y:15.6, speed:0.32, phase:180, carriers:3 },
  ];
  const worldW = COLS * TILE;
  const span = worldW - 2*TILE;            // travel range between walls
  rails.forEach(r=>{
    const ry = r.y * TILE;
    // rail
    ctx.fillStyle = '#9aa3a8';
    ctx.fillRect(TILE, ry, span, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(TILE, ry+2, span, 1);

    // base offset advances continuously; each carrier is offset along
    // the rail and we draw a "ghost" copy at hx-span when straddling
    // the right edge so the carrier never just disappears.
    const base = (state.tick * r.speed + r.phase) % span;
    for (let i = 0; i < r.carriers; i++){
      const offset = (span / r.carriers) * i;
      const hxRaw = (base + offset) % span;       // 0..span
      const hx = TILE + hxRaw;
      const hy = ry + 2;
      drawOHTCarrier(hx, hy);
      // ghost wrap: if this carrier's right edge would clip past the
      // wall, also draw it on the left side so the wrap is seamless.
      if (hxRaw + 28 > span){
        drawOHTCarrier(hx - span, hy);
      }
    }
  });
}

function drawOHTCarrier(hx, hy){
  // chassis
  ctx.fillStyle = '#e0e6ea';
  ctx.fillRect(hx, hy, 28, 10);
  ctx.fillStyle = '#b6c0c5';
  ctx.fillRect(hx, hy+9, 28, 1);
  // cassette dangling
  ctx.fillStyle = '#3a4045';
  ctx.fillRect(hx+8, hy+10, 2, 6);
  ctx.fillRect(hx+18, hy+10, 2, 6);
  ctx.fillStyle = '#cc0a17';
  ctx.fillRect(hx+6, hy+16, 16, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(hx+6, hy+16, 16, 1);
  // status LED
  if (Math.floor(state.tick/10)%2===0){
    ctx.fillStyle = '#6ad68a';
    ctx.fillRect(hx+24, hy+2, 2, 2);
  }
  // soft shadow on floor below
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.beginPath();
  ctx.ellipse(hx+14, hy+30, 14, 3, 0, 0, Math.PI*2);
  ctx.fill();
}

/* ══════════════════════════════════════════════════════════════════
   CHARACTER RENDERING - 4-frame walk cycle, proper proportions
   Sprite cell: 22 wide × 30 tall inside 32×32 tile, bottom-anchored
   ══════════════════════════════════════════════════════════════════ */
function drawCharacter(px, py, dir, walkFrame, cf, isPlayer=false){
  const baseX = px + (TILE-22)/2;
  const baseY = py + 2;
  const p = (x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(Math.round(baseX+x),Math.round(baseY+y),w,h); };
  // Cleanroom "bunny suit" override - worn after gowning, taken off back at HQ
  const cleanroom = isPlayer && state.suited;
  if (cleanroom){
    cf = Object.assign({}, cf, {
      coat:   '#f4f6f8',
      pants:  '#eef1f3',
      accent: '#dfe5e9',
      skin:   '#dfe7ee',  // gloves/face shield reflection
      hair:   '#f4f6f8',  // hood covers hair
      vest:   false,
      tablet: false,
      bun:    false,
      longHair: false,
      hood:   true
    });
  }

  // shadow (breathes slightly)
  const bob = Math.floor(Math.sin((state.tick + (px+py))/30)*0.6);

  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(px+TILE/2, py+TILE-1, 11, 3.5, 0, 0, Math.PI*2); ctx.fill();

  // ── LEGS (4-frame walk cycle) ──
  // frame 0 = stand, 1 = left-forward, 2 = stand, 3 = right-forward
  let offL=0, offR=0;
  if (walkFrame===1){ offL=-1; offR=1; }
  else if (walkFrame===3){ offL=1; offR=-1; }
  // pant legs
  p(5, 22+offL, 5, 6, cf.pants);
  p(12, 22+offR, 5, 6, cf.pants);
  // leg shading
  p(5, 22+offL, 1, 6, 'rgba(0,0,0,0.3)');
  p(12, 22+offR, 1, 6, 'rgba(0,0,0,0.3)');
  // boots
  p(5, 27+offL, 5, 2, PAL.darker);
  p(12, 27+offR, 5, 2, PAL.darker);
  p(5, 27+offL, 5, 1, 'rgba(255,255,255,0.12)');

  // ── TORSO / COAT ──
  // black outline
  p(3, 11+bob, 16, 12, PAL.darker);
  // coat fill
  p(4, 12+bob, 14, 10, cf.coat);
  // coat lapel
  p(4, 11+bob, 14, 2, cf.coat);
  p(10, 12+bob, 2, 10, PAL.darker); // front seam
  // collar
  if (dir==='down'){
    p(7, 12+bob, 8, 3, cf.accent);
    p(10, 12+bob, 2, 3, PAL.darker);
  }
  // highlight
  p(4, 12+bob, 14, 1, 'rgba(255,255,255,0.18)');
  // shadow at bottom
  p(4, 21+bob, 14, 1, 'rgba(0,0,0,0.25)');
  // vest (player)
  if (cf.vest){
    p(4, 13+bob, 14, 9, '#d97a3c');
    p(4, 15+bob, 14, 1, PAL.amber);
    p(4, 19+bob, 14, 1, PAL.amber);
    p(10, 13+bob, 2, 9, PAL.darker);
    p(4, 13+bob, 14, 1, 'rgba(255,255,255,0.2)');
  }

  // ── ARMS ──
  if (dir==='down' || dir==='up'){
    // arms swing based on walk frame
    const aOffL = (walkFrame===1) ? 1 : 0;
    const aOffR = (walkFrame===3) ? 1 : 0;
    p(1, 12+bob+aOffL, 3, 8, PAL.darker); // outline
    p(2, 13+bob+aOffL, 2, 6, cf.coat);
    p(2, 18+bob+aOffL, 2, 2, cf.skin); // hand
    p(18, 12+bob+aOffR, 3, 8, PAL.darker);
    p(19, 13+bob+aOffR, 2, 6, cf.coat);
    p(19, 18+bob+aOffR, 2, 2, cf.skin);
  } else {
    const aX = dir==='left' ? 0 : 18;
    const swing = walkFrame===1 ? 1 : (walkFrame===3 ? -1 : 0);
    p(aX, 12+bob+swing, 3, 8, PAL.darker);
    p(aX+1, 13+bob+swing, 2, 6, cf.coat);
    p(aX+1, 18+bob+swing, 2, 2, cf.skin);
  }

  // ── Tablet for Hana when facing down ──
  if (cf.tablet && dir==='down'){
    p(7, 17+bob, 8, 5, '#2a1f18');
    p(8, 18+bob, 6, 3, PAL.teal);
    p(8, 18+bob, 6, 1, 'rgba(255,255,255,0.3)');
  }

  // ── HEAD ──
  const hx=5, hy=0+bob;
  // outline
  p(hx-1, hy, 14, 13, PAL.darker);
  p(hx, hy+1, 12, 11, cf.skin);
  // cheek shading
  p(hx, hy+9, 12, 1, 'rgba(122,48,32,0.15)');

  // HAIR (direction-aware)
  if (dir==='down'){
    if (cf.bun){
      p(hx, hy+1, 12, 4, cf.hair);
      p(hx-1, hy+2, 1, 5, cf.hair);
      p(hx+12, hy+2, 1, 5, cf.hair);
      // bun on top
      p(hx+4, hy-3, 5, 4, cf.hair);
      p(hx+5, hy-4, 3, 1, cf.hair);
    } else if (cf.longHair){
      p(hx-1, hy, 14, 6, cf.hair);
      p(hx-2, hy+2, 2, 11, cf.hair);
      p(hx+12, hy+2, 2, 11, cf.hair);
    } else {
      p(hx, hy+1, 12, 4, cf.hair);
      p(hx-1, hy+2, 1, 4, cf.hair);
      p(hx+12, hy+2, 1, 4, cf.hair);
    }
    // eyes
    p(hx+2, hy+6, 2, 2, PAL.darker);
    p(hx+8, hy+6, 2, 2, PAL.darker);
    p(hx+2, hy+6, 1, 1, 'rgba(255,255,255,0.4)');
    p(hx+8, hy+6, 1, 1, 'rgba(255,255,255,0.4)');
    // mouth
    if (cf.beard){
      p(hx+1, hy+8, 10, 4, cf.hair);
      p(hx+4, hy+9, 4, 1, '#5a2218');
    } else {
      p(hx+4, hy+10, 4, 1, '#5a2218');
    }
    // glasses
    if (cf.glasses){
      p(hx+1, hy+5, 4, 4, PAL.darker); p(hx+2, hy+6, 2, 2, cf.skin);
      p(hx+7, hy+5, 4, 4, PAL.darker); p(hx+8, hy+6, 2, 2, cf.skin);
      p(hx+5, hy+6, 2, 1, PAL.darker);
    }
    // hard hat
    if (cf.hat){
      p(hx-2, hy-3, 16, 4, cf.hat);
      p(hx-2, hy, 16, 1, '#c98a20');
      p(hx-3, hy-1, 1, 3, cf.hat);
      p(hx+14, hy-1, 1, 3, cf.hat);
    }
  } else if (dir==='up'){
    // back of head
    if (cf.bun){
      p(hx, hy+1, 12, 11, cf.hair);
      p(hx+4, hy-3, 5, 4, cf.hair);
    } else if (cf.longHair){
      p(hx-2, hy, 14, 13, cf.hair);
      p(hx-3, hy+3, 2, 10, cf.hair);
      p(hx+13, hy+3, 2, 10, cf.hair);
    } else {
      p(hx, hy+1, 12, 9, cf.hair);
    }
    if (cf.hat){ p(hx-2, hy-3, 16, 5, cf.hat); }
  } else {
    const flip = dir==='left';
    if (cf.longHair){
      p(hx-1, hy+1, 12, 11, cf.hair);
      if (flip) p(hx-2, hy+2, 2, 11, cf.hair); else p(hx+12, hy+2, 2, 11, cf.hair);
    } else if (cf.bun){
      p(hx, hy+1, 12, 4, cf.hair);
      p(hx+4, hy-3, 5, 4, cf.hair);
    } else {
      p(hx, hy+1, 12, 4, cf.hair);
      if (flip) p(hx-1, hy+2, 1, 4, cf.hair); else p(hx+12, hy+2, 1, 4, cf.hair);
    }
    // eye
    const ex = flip ? hx+2 : hx+8;
    p(ex, hy+6, 2, 2, PAL.darker);
    // mouth
    const mx = flip ? hx+2 : hx+6;
    p(mx, hy+10, 3, 1, '#5a2218');
    if (cf.beard){ p(hx+1, hy+8, 10, 4, cf.hair); }
    if (cf.glasses){
      const gx = flip ? hx+1 : hx+7;
      p(gx, hy+5, 4, 4, PAL.darker); p(gx+1, hy+6, 2, 2, cf.skin);
    }
    if (cf.hat){ p(hx-2, hy-3, 16, 4, cf.hat); p(hx-2, hy, 16, 1, '#c98a20'); }
  }

  // ── CLEANROOM HOOD + VISOR overlay ──
  if (cleanroom){
    // hood drape over shoulders
    p(2, 10+bob, 18, 4, '#f4f6f8');
    p(2, 10+bob, 18, 1, 'rgba(255,255,255,0.6)');
    p(2, 13+bob, 18, 1, 'rgba(0,0,0,0.08)');
    // hood around head
    p(hx-2, hy-1, 16, 14, '#f4f6f8');
    p(hx-2, hy-1, 16, 1, 'rgba(255,255,255,0.7)');
    p(hx-2, hy-1, 1, 14, 'rgba(0,0,0,0.08)');
    p(hx+13, hy-1, 1, 14, 'rgba(0,0,0,0.08)');
    // face opening (skin/face shield reflection)
    p(hx+1, hy+3, 10, 8, '#dfe7ee');
    // visor sheen
    p(hx+1, hy+3, 10, 1, 'rgba(255,255,255,0.55)');
    p(hx+1, hy+4, 2, 6, 'rgba(255,255,255,0.25)');
    // eyes through visor (subtle)
    if (dir==='down'){
      p(hx+3, hy+6, 2, 2, '#2a2a2a');
      p(hx+7, hy+6, 2, 2, '#2a2a2a');
    } else if (dir!=='up'){
      const flip = dir==='left';
      const ex = flip ? hx+3 : hx+7;
      p(ex, hy+6, 2, 2, '#2a2a2a');
    }
    // chin seam
    p(hx+1, hy+10, 10, 1, 'rgba(0,0,0,0.18)');
  }

  // YOU label - bouncing amber pill above the player, drawn large
  // enough to read from across the room. A soft halo + dark border
  // keep it legible against any floor/wall tile.
  if (isPlayer){
    const bob = Math.round(Math.sin(state.tick/12) * 1.5);
    const lw = 38, lh = 16;
    const lx = px + TILE/2 - lw/2;
    const ly = py - 22 + bob;
    // halo so it pops over busy decor
    const glow = ctx.createRadialGradient(px+TILE/2, ly+lh/2, 4, px+TILE/2, ly+lh/2, 30);
    glow.addColorStop(0, 'rgba(243,192,18,0.55)');
    glow.addColorStop(1, 'rgba(243,192,18,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx-14, ly-10, lw+28, lh+20);
    // pill body
    ctx.fillStyle = '#f3c012';
    roundRect(lx, ly, lw, lh, 4, true);
    // dark outline
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 2;
    roundRect(lx, ly, lw, lh, 4, false);
    ctx.stroke();
    // little tail pointing down to the head
    ctx.fillStyle = '#f3c012';
    ctx.beginPath();
    ctx.moveTo(px+TILE/2-4, ly+lh-1);
    ctx.lineTo(px+TILE/2,   ly+lh+5);
    ctx.lineTo(px+TILE/2+4, ly+lh-1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px+TILE/2-4, ly+lh-1);
    ctx.lineTo(px+TILE/2,   ly+lh+5);
    ctx.lineTo(px+TILE/2+4, ly+lh-1);
    ctx.stroke();
    // text
    ctx.fillStyle = '#1a0a04';
    ctx.font = '900 11px "JetBrains Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('YOU', px+TILE/2, ly+lh/2+1);
  }
}

function drawPlayer(){
  let wf = 0;
  if (player.moving){
    const t = Math.min(1,(performance.now()-moveStart)/MOVE_DURATION);
    // play through frames 1 and 3 based on step parity + progress
    const phase = (player.stepFrame + (t>0.5?1:0)) % 2;
    wf = phase===0 ? 1 : 3;
  }
  drawCharacter(player.px, player.py, player.dir, wf, CHARS.player, true);
}

function drawNPC(n){
  const cf = CHARS[n.ch];
  drawCharacter(n.x*TILE, n.y*TILE, n.dir, 0, cf, false);
}

/* Late-pass marker rendering - drawn AFTER drawFrontWall so the !
   bubbles always sit on top of decor, walls and other NPCs. */
function drawNPCMarkers(){
  if (state.scene !== 'play') return;
  for (const n of NPCS){
    if (n.done) continue;
    const bb = Math.sin(state.tick/10 + n.x)*2;
    const bx = n.x*TILE + TILE/2, by = n.y*TILE - 22 + bb;
    const R = 16;
    const glow = ctx.createRadialGradient(bx, by, 2, bx, by, R+18);
    glow.addColorStop(0, 'rgba(255,210,40,0.55)');
    glow.addColorStop(1, 'rgba(255,210,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bx-R-20, by-R-20, (R+20)*2, (R+20)*2);
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath();
    ctx.moveTo(bx-5, by+R-2); ctx.lineTo(bx, by+R+8); ctx.lineTo(bx+5, by+R-2); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx-5, by+R-2); ctx.lineTo(bx, by+R+8); ctx.lineTo(bx+5, by+R-2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(bx-5, by-5, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a0a04';
    ctx.font = '900 22px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', bx, by+1);
  }
}

/* ── Ambient particles & vignette ── */
function drawParticles(){
  ctx.save();
  for (let i=0;i<18;i++){
    const t = state.tick*0.3;
    const x = (i*97 + t)%VIEW_W;
    const y = (i*61 + Math.sin(t/40+i)*15 + t*0.2)%VIEW_H;
    const a = 0.15 + 0.15*Math.sin(t/25+i);
    ctx.fillStyle = `rgba(244,234,208,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function drawVignette(cx,cy){
  // warm vignette
  const g = ctx.createRadialGradient(cx+VIEW_W/2, cy+VIEW_H/2, 120, cx+VIEW_W/2, cy+VIEW_H/2, 520);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(30,18,10,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(cx, cy, VIEW_W, VIEW_H);
}

/* ══════════════════════════════════════════════════════════════════
   UI - HUD + dialogue + flash
   ══════════════════════════════════════════════════════════════════ */
function drawHUD(){
  // top bar
  const g = ctx.createLinearGradient(0,0,0,30);
  g.addColorStop(0, 'rgba(30,18,10,0.95)');
  g.addColorStop(1, 'rgba(30,18,10,0.75)');
  ctx.fillStyle = g; ctx.fillRect(0,0,VIEW_W,30);
  ctx.fillStyle = PAL.amber; ctx.fillRect(0,30,VIEW_W,1);

  ctx.font = "bold 11px 'JetBrains Mono',monospace";
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.amber;
  const shiftLabel = state.scene === 'csmt' ? '▸ FAB FLOOR 2' : '▸ ON SHIFT';
  ctx.fillText(shiftLabel, 12, 15);
  const shiftW = ctx.measureText(shiftLabel).width;
  ctx.fillStyle = 'rgba(244,234,208,0.55)';
  const hint = state.scene === 'csmt' ? '·  WHACK SMOKING TOOLS WITH  E' : '·  FIND THE  !  AND PRESS  E';
  ctx.fillText(hint, 12 + shiftW + 14, 15);
  ctx.textAlign='right'; ctx.fillStyle = PAL.cream;
  const right = state.scene === 'csmt'
    ? `FIXED ${state.csmtFixed||0} / ${state.csmtTotal||0}`
    : `TICKETS ${state.tickets} / 3`;
  ctx.fillText(right, VIEW_W-12, 15);

  // prompt when facing NPC
  if (!state.dialogue){
    const [dx,dy] = DIRS[player.dir];
    const fx=player.x+dx, fy=player.y+dy;
    const npc = NPCS.find(n=>n.x===fx && n.y===fy);
    if (npc){
      const name = npc.done ? `${CHARS[npc.ch].name} · thanks again` : CHARS[npc.ch].name;
      ctx.font='bold 13px Inter'; ctx.textAlign='center';
      const w = ctx.measureText(name).width + 74;
      const bx = VIEW_W/2 - w/2;
      ctx.fillStyle = 'rgba(30,18,10,0.95)';
      roundRect(bx, VIEW_H-46, w, 30, 8, true);
      ctx.strokeStyle = PAL.amber; ctx.lineWidth = 2;
      roundRect(bx, VIEW_H-46, w, 30, 8, false, true);
      ctx.fillStyle = PAL.cream;
      ctx.textBaseline='middle';
      ctx.fillText(name, VIEW_W/2 - 18, VIEW_H-30);
      ctx.fillStyle = PAL.darker;
      roundRect(VIEW_W/2 + w/2 - 30, VIEW_H-40, 22, 18, 4, true);
      ctx.fillStyle = PAL.amber;
      ctx.font='bold 11px "JetBrains Mono",monospace';
      ctx.fillText('E', VIEW_W/2 + w/2 - 19, VIEW_H-30);
    }
  }
}

function drawDialogue(){
  const d = state.dialogue;
  const bx = 14, by = VIEW_H - 186, bw = VIEW_W - 28, bh = 172;

  // backdrop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(bx+4, by+6, bw, bh, 14, true);

  // cream box
  ctx.fillStyle = PAL.cream;
  roundRect(bx, by, bw, bh, 14, true);
  // dark header band
  ctx.fillStyle = PAL.darker;
  roundRect(bx, by, bw, 40, 14, true);
  ctx.fillStyle = PAL.darker; ctx.fillRect(bx, by+22, bw, 18);
  // amber accent stripe
  ctx.fillStyle = PAL.amber;
  ctx.fillRect(bx, by+40, bw, 2);
  // inner border
  ctx.strokeStyle = PAL.darker; ctx.lineWidth = 2;
  roundRect(bx, by, bw, bh, 14, false, true);

  // portrait frame
  const pw=94, ph=148;
  ctx.fillStyle = PAL.darker;
  roundRect(bx+10, by+12, pw, ph, 8, true);
  ctx.strokeStyle = PAL.amber; ctx.lineWidth=2;
  roundRect(bx+10, by+12, pw, ph, 8, false, true);
  drawPortrait(bx+10, by+12, pw, ph, CHARS[d.npc.ch]);

  // header text - name + role
  const cf = CHARS[d.npc.ch];
  ctx.fillStyle = PAL.amber;
  ctx.font = "bold 13px 'JetBrains Mono',monospace";
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(cf.name.toUpperCase(), bx+118, by+16);
  ctx.fillStyle = 'rgba(244,234,208,0.6)';
  ctx.font = "10px 'JetBrains Mono',monospace";
  ctx.fillText((cf.role||'').toUpperCase(), bx+118, by+30);

  // content area
  const tx = bx + 118, ty = by + 56, tw = bw - 138;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  if (d.phase === 'lines'){
    ctx.fillStyle = PAL.ink;
    ctx.font = "17px Inter";
    wrapText(state.typewriter.text, tx, ty, tw, 24);
    // blinking prompt
    if (state.typewriter.done && Math.floor(state.tick/25)%2===0){
      ctx.fillStyle = PAL.gold;
      ctx.font = "bold 11px 'JetBrains Mono',monospace";
      ctx.textAlign='right';
      ctx.fillText(`▼ E / SPACE · ${d.idx+1}/${d.lines.length}`, bx+bw-18, by+bh-20);
    }
  } else if (d.phase === 'choices'){
    ctx.fillStyle = '#6a4f38';
    ctx.font = "bold 13px 'JetBrains Mono',monospace";
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText("WHAT'S YOUR CALL?", tx, ty);

    // options rendered as buttons
    d.npc.options.forEach((o,i)=>{
      const oy = ty + 26 + i*30;
      // badge
      ctx.fillStyle = PAL.darker;
      roundRect(tx, oy, 26, 24, 5, true);
      ctx.fillStyle = PAL.amber;
      ctx.font = "bold 14px 'JetBrains Mono',monospace";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${i+1}`, tx+13, oy+12);
      // background row
      ctx.fillStyle = 'rgba(42,24,14,0.06)';
      roundRect(tx+30, oy, tw-30, 24, 5, true);
      // option text
      ctx.fillStyle = PAL.ink;
      ctx.font = "15px Inter";
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(o.t, tx+40, oy+12);
    });
  } else if (d.phase === 'result'){
    const r = d.result;
    ctx.fillStyle = r.good ? '#3a7a3a' : PAL.red;
    ctx.font = "bold 12px 'JetBrains Mono',monospace";
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText(r.good ? '✓  CORRECT CALL' : '✗  NOT QUITE · TRY ANOTHER', tx, ty);
    ctx.fillStyle = PAL.ink;
    ctx.font = "17px Inter";
    wrapText(state.typewriter.text, tx, ty+26, tw, 24);
    if (state.typewriter.done && Math.floor(state.tick/25)%2===0){
      ctx.fillStyle = PAL.gold;
      ctx.font = "bold 11px 'JetBrains Mono',monospace";
      ctx.textAlign='right';
      ctx.fillText('▼ E / SPACE', bx+bw-18, by+bh-20);
    }
  }
}

function drawPortrait(px,py,w,h,c){
  // warm gradient bg
  const g = ctx.createLinearGradient(px,py,px,py+h);
  g.addColorStop(0, '#3e2f22'); g.addColorStop(1, '#1a110a');
  ctx.fillStyle = g; ctx.fillRect(px+2,py+2,w-4,h-4);

  // floating dust
  for (let i=0;i<5;i++){
    const ax = px + 10 + ((i*23 + state.tick*0.3)%(w-20));
    const ay = py + 10 + ((i*17)%(h-20));
    ctx.fillStyle = 'rgba(232,182,88,0.3)';
    ctx.fillRect(ax, ay, 1, 1);
  }

  // character bust
  const sx = px + w/2;
  const by_ = py + h - 6;

  const p=(x,y,ww,hh,col)=>{ ctx.fillStyle=col; ctx.fillRect(Math.round(px+x),Math.round(py+y),ww,hh); };

  // coat shoulders
  p(8, h-56, w-16, 52, c.coat);
  p(8, h-56, w-16, 3, 'rgba(255,255,255,0.15)');
  p(8, h-6,  w-16, 2, 'rgba(0,0,0,0.3)');
  // collar
  p(w/2-12, h-56, 24, 5, c.accent);
  p(w/2-1,  h-54, 2, 5, c.coat);
  // neck
  p(w/2-7, h-66, 14, 12, c.skin);
  p(w/2-7, h-66, 14, 1, 'rgba(0,0,0,0.25)');
  // head
  p(w/2-20, h-122, 40, 58, c.skin);
  // head shading
  p(w/2-20, h-68, 40, 2, 'rgba(0,0,0,0.15)');
  p(w/2-20, h-122, 40, 2, 'rgba(255,255,255,0.2)');
  // hair
  if (c.bun){
    p(w/2-20, h-122, 40, 18, c.hair);
    p(w/2-24, h-112, 4, 18, c.hair);
    p(w/2+20, h-112, 4, 18, c.hair);
    p(w/2-8, h-134, 16, 12, c.hair);
    p(w/2-5, h-138, 10, 4, c.hair);
  } else if (c.longHair){
    p(w/2-24, h-122, 48, 26, c.hair);
    p(w/2-28, h-108, 6, 60, c.hair);
    p(w/2+22, h-108, 6, 60, c.hair);
  } else {
    p(w/2-20, h-122, 40, 16, c.hair);
    p(w/2-24, h-112, 4, 14, c.hair);
    p(w/2+20, h-112, 4, 14, c.hair);
  }
  // hard hat for player
  if (c.hat){
    p(w/2-24, h-134, 48, 14, c.hat);
    p(w/2-24, h-122, 48, 3, '#c9722a');
    p(w/2-18, h-138, 36, 4, c.hat);
  }
  // eyes
  p(w/2-11, h-92, 5, 6, PAL.darker);
  p(w/2+6,  h-92, 5, 6, PAL.darker);
  p(w/2-10, h-91, 2, 2, '#fff');
  p(w/2+7,  h-91, 2, 2, '#fff');
  // eyebrows
  p(w/2-13, h-98, 8, 2, c.hair);
  p(w/2+5,  h-98, 8, 2, c.hair);
  // glasses
  if (c.glasses){
    ctx.strokeStyle = PAL.darker; ctx.lineWidth=2;
    ctx.strokeRect(px+w/2-13, py+h-95, 10, 10);
    ctx.strokeRect(px+w/2+3,  py+h-95, 10, 10);
    ctx.beginPath(); ctx.moveTo(px+w/2-3, py+h-90); ctx.lineTo(px+w/2+3, py+h-90); ctx.stroke();
  }
  // nose
  p(w/2-1, h-82, 2, 6, 'rgba(0,0,0,0.2)');
  // mouth
  if (c.beard){
    p(w/2-14, h-78, 28, 16, c.hair);
    p(w/2-6,  h-70, 12, 2, '#5a2218');
  } else {
    p(w/2-5, h-72, 10, 3, '#7a3020');
    p(w/2-5, h-72, 10, 1, '#4a1a10');
  }
  // name tag
  p(10, h-22, 14, 6, PAL.amber);
  p(11, h-21, 12, 1, PAL.cream);
}

/* ── Flash ── */
function drawFlash(){
  const alpha = Math.min(1, state.messageTimer/30);
  const y = 40;
  ctx.font = "bold 13px Inter";
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const textW = ctx.measureText(state.message).width;
  const bubbleW = Math.min(VIEW_W - 40, Math.max(280, Math.ceil(textW) + 48));
  const bx = (VIEW_W - bubbleW) / 2;
  ctx.fillStyle = `rgba(30,18,10,${0.95*alpha})`;
  roundRect(bx, y+6, bubbleW, 34, 7, true);
  ctx.strokeStyle = `rgba(232,182,88,${alpha})`;
  ctx.lineWidth = 1.5;
  roundRect(bx, y+6, bubbleW, 34, 7, false, true);
  ctx.fillStyle = `rgba(244,234,208,${alpha})`;
  ctx.fillText(state.message, VIEW_W/2, y+23);
}

function flashMessage(t, dur){
  state.message=t; state.messageTimer = dur || 180;
  // Mirror to the screen-reader live region so non-sighted players
  // still receive game state updates.
  const sr = document.getElementById('game-status');
  if (sr) sr.textContent = t;
}

/* ── Fade ── */
function drawFade(){
  if (state.fade<=0) return;
  ctx.fillStyle = `rgba(10,6,4,${state.fade})`;
  ctx.fillRect(0,0,VIEW_W,VIEW_H);
}
function fadeTo(target){
  state.fadeDir = target > state.fade ? 1 : -1;
}

/* ── Helpers ── */
function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
function wrapText(text, x, y, maxW, lh){
  if (!text) return;
  const words = text.split(' ');
  let line = '', yy = y;
  for (let i=0;i<words.length;i++){
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && i>0){
      ctx.fillText(line, x, yy);
      line = words[i] + ' '; yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

/* ── Ending / In-game Award ── */
function showEnding(){
  sfxWin();
  state.scene = 'ending';
  state.endingTick = 0;
  fadeTo(0);
}

function drawEnding(){
  state.endingTick = (state.endingTick||0) + 1;
  const t = state.endingTick;

  // dark warm backdrop
  const g = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, 40, VIEW_W/2, VIEW_H/2, VIEW_W*0.8);
  g.addColorStop(0, '#3a2618'); g.addColorStop(1, '#0a0604');
  ctx.fillStyle = g; ctx.fillRect(0,0,VIEW_W,VIEW_H);

  // confetti-ish dust
  for (let i=0;i<60;i++){
    const x = (i*97 + t*0.6)%VIEW_W;
    const y = ((i*53 + t*1.2)%VIEW_H);
    const hue = [PAL.amber, PAL.gold||'#e8b658', PAL.cream, '#c9722a'][i%4];
    ctx.fillStyle = hue;
    ctx.globalAlpha = 0.3 + 0.3*Math.sin(t/20 + i);
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // certificate card
  const cardW = 560, cardH = 380;
  const cx = (VIEW_W - cardW)/2, cy = (VIEW_H - cardH)/2;

  // drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(cx+8, cy+12, cardW, cardH);

  // parchment
  ctx.fillStyle = '#f4ead0';
  ctx.fillRect(cx, cy, cardW, cardH);

  // inner border
  ctx.strokeStyle = '#c9722a'; ctx.lineWidth = 2;
  ctx.strokeRect(cx+14, cy+14, cardW-28, cardH-28);
  ctx.strokeStyle = '#e8b658'; ctx.lineWidth = 1;
  ctx.strokeRect(cx+20, cy+20, cardW-40, cardH-40);

  // ornamental corners
  ctx.fillStyle = '#c9722a';
  [[0,0],[cardW-16,0],[0,cardH-16],[cardW-16,cardH-16]].forEach(([ox,oy])=>{
    ctx.fillRect(cx+ox+14, cy+oy+14, 16, 2);
    ctx.fillRect(cx+ox+14, cy+oy+14, 2, 16);
  });

  // medal / trophy pixel art
  const mx = cx + cardW/2, my = cy + 70;
  const bob = Math.sin(t/18)*2;
  // ribbon left
  ctx.fillStyle = '#9c3a2e'; ctx.fillRect(mx-28, my-32+bob, 10, 26);
  ctx.fillStyle = '#7a2a20'; ctx.fillRect(mx-28, my-8+bob, 10, 6);
  // ribbon right
  ctx.fillStyle = '#9c3a2e'; ctx.fillRect(mx+18, my-32+bob, 10, 26);
  ctx.fillStyle = '#7a2a20'; ctx.fillRect(mx+18, my-8+bob, 10, 6);
  // medal disc
  ctx.fillStyle = '#e8b658'; ctx.beginPath(); ctx.arc(mx, my+bob, 26, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#c9722a'; ctx.beginPath(); ctx.arc(mx, my+bob, 22, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f4ead0'; ctx.beginPath(); ctx.arc(mx, my+bob, 17, 0, Math.PI*2); ctx.fill();
  // star
  ctx.fillStyle = '#c9722a';
  ctx.font = '900 22px Inter';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('★', mx, my+bob+1);
  // shimmer
  ctx.fillStyle = `rgba(255,240,180,${0.3 + 0.3*Math.sin(t/10)})`;
  ctx.fillRect(mx-8, my-20+bob, 4, 4);

  // header text
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#c9722a';
  ctx.font = "700 11px 'JetBrains Mono',monospace";
  ctx.fillText('✦  CERTIFICATE OF SERVICE  ✦', mx, cy+140);

  ctx.fillStyle = '#1a120c';
  ctx.font = '900 32px Inter';
  ctx.fillText('Shift Complete', mx, cy+176);

  ctx.fillStyle = '#6a4f38';
  ctx.font = '600 13px Inter';
  ctx.fillText('Awarded to the Field Service Engineer', mx, cy+206);

  // stats
  ctx.fillStyle = '#3a2618';
  ctx.font = '500 12px Inter';
  ctx.fillText(`Tickets resolved: ${state.tickets} / 3   ·   Tools restored`, mx, cy+232);

  // citation
  ctx.fillStyle = '#6a4f38';
  ctx.font = 'italic 12px Inter';
  wrapText("Dr. Rao hit her grant deadline. Marcus' fab unpaused.", mx, cy+260, cardW-60, 16);
  wrapText("Hana's supervisor owes her an apology.", mx, cy+286, cardW-60, 16);

  // footer seal
  ctx.fillStyle = '#c9722a';
  ctx.font = "600 10px 'JetBrains Mono',monospace";
  ctx.fillText('✦  NANO-SCAN CORP  ·  FIELD SERVICE DIVISION  ✦', mx, cy+cardH-42);

  // prompt buttons (rendered as text)
  if (t > 60){
    const pulse = Math.floor(t/50)%2===0 ? 1 : 0.55;
    ctx.fillStyle = `rgba(244,234,208,${pulse})`;
    ctx.font = "bold 12px 'JetBrains Mono',monospace";
    ctx.fillText('▶  PRESS  R  TO  PLAY  AGAIN   ·   ESC  FOR  PORTFOLIO', VIEW_W/2, VIEW_H - 32);
  }
}

/* ── Main loop ── */
// Honour prefers-reduced-motion: pause the high-frame-rate render loop
// and only redraw on user input so screens stay still for users who
// have opted out of animation. Game state still advances on key press.
const MOTION_OK = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function loop(now){
  update(now); render();
  if (MOTION_OK) requestAnimationFrame(loop);
}
if (!MOTION_OK){
  // Re-render on input only.
  window.addEventListener('keydown', ()=>requestAnimationFrame(()=>{ update(performance.now()); render(); }));
  window.addEventListener('click', ()=>requestAnimationFrame(()=>{ update(performance.now()); render(); }));
}
fadeTo(0);
requestAnimationFrame(loop);
