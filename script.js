// ---------- Audio ----------
const audioToggleBtn = document.getElementById('audioToggle');
const beachAudio = new Audio('audio/Seagull Beach Sound Effect  Free Sound Clips  Animal Sounds.mp3');
beachAudio.loop = true;
beachAudio.volume = 0.35;

const savedMuted = localStorage.getItem('beach-muted') === 'true';
let isPlaying = false;

function setPressedState(pressed) {
  audioToggleBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  audioToggleBtn.textContent = pressed ? '🔇 Beach Sounds Off' : '🔊 Beach Sounds';
}
setPressedState(savedMuted);
if (!savedMuted) window.addEventListener('pointerdown', tryPlayOnce, { once: true });
function tryPlayOnce() { beachAudio.play().then(() => { isPlaying = true; }).catch(()=>{}); }

audioToggleBtn.addEventListener('click', async () => {
  if (isPlaying && !beachAudio.paused) {
    beachAudio.pause(); isPlaying = false;
    localStorage.setItem('beach-muted', true); setPressedState(true);
  } else {
    try { await beachAudio.play(); isPlaying = true; localStorage.setItem('beach-muted', false); setPressedState(false); }
    catch(e){ setPressedState(true); }
  }
});

// ---------- Helpers for random placement ----------
function rand(min, max)   { return Math.random() * (max - min) + min; }
function clamp(v, a, b)   { return Math.min(Math.max(v, a), b); }
function rectsOverlap(a, b, pad = 0) {
  return !(a.x + a.w + pad < b.x ||
           b.x + b.w + pad < a.x ||
           a.y + a.h + pad < b.y ||
           b.y + b.h + pad < a.y);
}
function placeNonOverlapping({
  container,
  elements,           // array of HTMLElements
  bounds,             // { left, top, right, bottom } in px (container coords)
  minGap = 16,        // px between elements
  exclusionRects = [],// array of rects to avoid {x,y,w,h}
  maxAttempts = 500
}) {
  const placed = [];

  elements.forEach((el, index) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let attempt = 0;
    let placedOk = false;
    let bestPosition = null;
    let bestDistance = 0;

    while (attempt++ < maxAttempts && !placedOk) {
      const x = rand(bounds.left, Math.max(bounds.right - w, bounds.left));
      const y = rand(bounds.top,  Math.max(bounds.bottom - h, bounds.top));
      const rect = { x, y, w, h };

      const clashWithPlaced = placed.some(p => rectsOverlap(rect, p, minGap));
      const clashWithExcl = exclusionRects.some(er => rectsOverlap(rect, er, minGap));
      
      if (!clashWithPlaced && !clashWithExcl) {
        el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        placed.push(rect);
        placedOk = true;
      } else {
        // Track the position with the most distance from other elements
        let minDistanceToOthers = Infinity;
        placed.forEach(p => {
          const distance = Math.sqrt(Math.pow(rect.x - p.x, 2) + Math.pow(rect.y - p.y, 2));
          minDistanceToOthers = Math.min(minDistanceToOthers, distance);
        });
        
        if (minDistanceToOthers > bestDistance) {
          bestDistance = minDistanceToOthers;
          bestPosition = { x, y };
        }
      }
    }

    // Enhanced fallback: use best position found, or grid-based placement
    if (!placedOk) {
      let finalX, finalY;
      
      if (bestPosition) {
        finalX = bestPosition.x;
        finalY = bestPosition.y;
      } else {
        // Grid-based fallback for main islands
        const cols = 2;
        const rows = 2;
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const cellWidth = (bounds.right - bounds.left) / cols;
        const cellHeight = (bounds.bottom - bounds.top) / rows;
        
        finalX = bounds.left + (col * cellWidth) + (cellWidth - w) / 2;
        finalY = bounds.top + (row * cellHeight) + (cellHeight - h) / 2;
        
        // Add some randomness to avoid perfect grid
        finalX += rand(-20, 20);
        finalY += rand(-20, 20);
        
        // Ensure within bounds
        finalX = clamp(finalX, bounds.left, bounds.right - w);
        finalY = clamp(finalY, bounds.top, bounds.bottom - h);
      }
      
      el.style.transform = `translate(${Math.round(finalX)}px, ${Math.round(finalY)}px)`;
      placed.push({ x: finalX, y: finalY, w, h });
    }
  });

  return placed;
}

// ---------- Build tiny islets with random sizes ----------
const isletsContainer = document.querySelector('.islets');
const ISLET_COUNT = 12;
function createIslets() {
  isletsContainer.innerHTML = '';
  for (let i = 0; i < ISLET_COUNT; i++) {
    // Create container for the islet
    const isletContainer = document.createElement('div');
    isletContainer.className = 'islet';
    
    // Create the SVG image
    const isletImg = document.createElement('img');
    isletImg.src = 'assets/island.svg';
    isletImg.alt = 'Small island';
    isletImg.className = 'islet-image';
    
    // Random size and rotation
    const size = clamp(Math.round(rand(30, 60)), 25, 80);
    isletContainer.style.width = `${size}px`;
    isletContainer.style.height = `${size}px`;
    isletContainer.style.transform = `rotate(${rand(-25, 25)}deg)`;
    
    // Add the image to the container
    isletContainer.appendChild(isletImg);
    isletsContainer.appendChild(isletContainer);
  }
}

// ---------- Randomize layout ----------
const ocean = document.querySelector('.ocean');
const islandsLayer = document.querySelector('.islands');
const mainIslands = Array.from(document.querySelectorAll('.island'));

function getRect(el) {
  const r = el.getBoundingClientRect();
  const cr = ocean.getBoundingClientRect();
  return { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height };
}

// Function to check if any main islands are overlapping
function checkForOverlaps(placedRects, minGap) {
  for (let i = 0; i < placedRects.length; i++) {
    for (let j = i + 1; j < placedRects.length; j++) {
      if (rectsOverlap(placedRects[i], placedRects[j], minGap)) {
        return true;
      }
    }
  }
  return false;
}

function layout() {
  // Ensure islets exist (and reset)
  createIslets();

  // Force reflow so sizes are accurate
  mainIslands.forEach(el => { el.style.transform = 'translate(-9999px, -9999px)'; });

  // Wait for reflow
  setTimeout(() => {
    // Container & safe bounds
    const cRect = ocean.getBoundingClientRect();

    // Safe margins (keep islands away from edges for UX)
    const marginPct = 0.12; // increased to 12% padding for better spacing
    const bounds = {
      left:  cRect.width  * marginPct,
      top:   cRect.height * marginPct,
      right: cRect.width  * (1 - marginPct),
      bottom:cRect.height * (1 - marginPct)
    };

    // Exclusion zone for the audio button (slightly padded)
    const audioRect = getRect(audioToggleBtn);
    const audioPad = 25; // increased padding around audio button
    const exclusionRects = [{ x: Math.max(audioRect.x - audioPad, 0),
                              y: Math.max(audioRect.y - audioPad, 0),
                              w: audioRect.w + audioPad*2,
                              h: audioRect.h + audioPad*2 }];

    let attempts = 0;
    let mainPlaced;
    const maxLayoutAttempts = 5;
    
    // Try multiple times to get a good layout
    do {
      attempts++;
      
      // Place main islands (non-overlapping) with increased gap
      mainPlaced = placeNonOverlapping({
        container: ocean,
        elements: mainIslands,
        bounds,
        minGap: 60 + (attempts * 10), // increase gap with each attempt
        exclusionRects,
        maxAttempts: 1500
      });
      
    } while (checkForOverlaps(mainPlaced, 40) && attempts < maxLayoutAttempts);

    // Now place islets around, avoiding the main islands
    const islets = Array.from(document.querySelectorAll('.islet'));
    placeNonOverlapping({
      container: ocean,
      elements: islets,
      bounds: {
        left:  cRect.width  * 0.02,
        top:   cRect.height * 0.03,
        right: cRect.width  * 0.98,
        bottom:cRect.height * 0.95
      },
      minGap: 15,
      exclusionRects: mainPlaced.concat(exclusionRects)
    });
  }, 50); // Small delay to ensure proper sizing
}

// Initial layout after fonts/sizes settle
window.addEventListener('load', () => {
  layout();
  
  // Add class to trigger welcome message fade-out
  setTimeout(() => {
    document.body.classList.add('islands-loaded');
  }, 1000);
});

// Relayout on resize/orientation (debounced)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layout, 180);
});

// ---------- Island hover and click effects ----------
document.querySelectorAll('.island').forEach(el => {
  // Add ripple effect on click
  el.addEventListener('click', (e) => {
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.marginLeft = '-10px';
    ripple.style.marginTop = '-10px';
    ripple.style.pointerEvents = 'none';
    
    el.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
