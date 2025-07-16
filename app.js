// Apple Notes-style Sketch App

const canvas = document.getElementById('sketch-canvas');
const ctx = canvas.getContext('2d');

// Tool state
let currentTool = 'pencil';
let drawing = false;
let strokes = [];
let undoneStrokes = [];
let currentStroke = null;
let color = '#222222';
let thickness = 3;

// Tool buttons
const toolButtons = {
  pencil: document.getElementById('tool-pencil'),
  pen: document.getElementById('tool-pen'),
  marker: document.getElementById('tool-marker'),
  eraser: document.getElementById('tool-eraser'),
  lasso: document.getElementById('tool-lasso'),
  ruler: document.getElementById('tool-ruler'),
};

// Individual thickness for each tool
let toolThickness = {
  pencil: 3,
  pen: 5,
  marker: 10,
  eraser: 15
};

// Update setActiveTool to sync thickness slider
function setActiveTool(tool) {
  currentTool = tool;
  Object.entries(toolButtons).forEach(([name, btn]) => {
    btn.classList.toggle('active', name === tool);
  });
  document.getElementById('thickness-picker').value = toolThickness[tool];
}

Object.entries(toolButtons).forEach(([name, btn]) => {
  btn.addEventListener('click', () => setActiveTool(name));
});

// Color swatch selection logic
const colorSwatches = document.querySelectorAll('.color-swatch');
let currentColor = colorSwatches[0].getAttribute('data-color');
colorSwatches[0].classList.add('selected');

colorSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    colorSwatches.forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    currentColor = swatch.getAttribute('data-color');
    // If you have a setColor function for your drawing logic, call it here
    if (typeof setColor === 'function') setColor(currentColor);
  });
});

// Update color and thickness logic to use currentColor
function setColor(newColor) {
  color = newColor;
}

document.getElementById('thickness-picker').addEventListener('input', e => {
  toolThickness[currentTool] = +e.target.value;
});

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('export').addEventListener('click', exportImage);

// Drawing logic
canvas.addEventListener('pointerdown', startDraw);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', endDraw);
canvas.addEventListener('pointerleave', endDraw);

// Prevent default browser behavior on canvas for Safari/iPad
['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'contextmenu'].forEach(eventType => {
  canvas.addEventListener(eventType, function(e) {
    e.preventDefault();
  }, { passive: false });
});

// --- Lasso Tool ---
let lassoActive = false;
let lassoPoints = [];
let lassoSelectedStrokes = [];
let lassoOffset = {x: 0, y: 0};
let lassoDragging = false;
let lassoDragStart = null;
let lassoLastPos = null;

canvas.addEventListener('pointerdown', function(e) {
  if (currentTool === 'lasso') {
    // Check if we're clicking inside an existing selection to drag it
    if (lassoSelectedStrokes.length > 0 && pointInPolygon({x: e.offsetX, y: e.offsetY}, lassoPoints)) {
      lassoDragging = true;
      lassoDragStart = {x: e.offsetX, y: e.offsetY};
      lassoLastPos = {x: e.offsetX, y: e.offsetY};
    } else {
      // Start new lasso selection
    lassoActive = true;
    lassoPoints = [{x: e.offsetX, y: e.offsetY}];
    lassoSelectedStrokes = [];
      updateLassoToolbarButtons(); // Hide buttons when starting new selection
    }
  }
});

canvas.addEventListener('pointermove', function(e) {
  if (currentTool === 'lasso') {
    if (lassoDragging && lassoSelectedStrokes.length > 0) {
      // Move selected strokes
      const dx = e.offsetX - lassoLastPos.x;
      const dy = e.offsetY - lassoLastPos.y;
      lassoSelectedStrokes.forEach(stroke => {
        stroke.points.forEach(pt => {
          pt.x += dx;
          pt.y += dy;
        });
      });
      lassoPoints.forEach(pt => {
        pt.x += dx;
        pt.y += dy;
      });
      lassoLastPos = {x: e.offsetX, y: e.offsetY};
      redraw();
      drawLasso(true);
    } else if (lassoActive) {
      // Continue lasso selection
    lassoPoints.push({x: e.offsetX, y: e.offsetY});
    redraw();
    drawLasso();
    }
  }
});

canvas.addEventListener('pointerup', function(e) {
  if (currentTool === 'lasso') {
    if (lassoDragging) {
      // End dragging
      lassoDragging = false;
      lassoDragStart = null;
      lassoLastPos = null;
    } else if (lassoActive) {
      // End lasso selection
    lassoActive = false;
    // Close lasso polygon
    if (lassoPoints.length > 2) {
      lassoPoints.push(lassoPoints[0]);
      lassoSelectedStrokes = strokes.filter(stroke => strokeInLasso(stroke, lassoPoints));
        updateLassoToolbarButtons(); // Show buttons after selection
    }
    redraw();
    drawLasso(true);
    }
  }
});

function drawLasso(final = false) {
  if (lassoPoints.length < 2) return;
  ctx.save();
  ctx.strokeStyle = final ? '#007aff' : '#aaa';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
  for (let i = 1; i < lassoPoints.length; i++) {
    ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  // Highlight selected strokes
  if (final && lassoSelectedStrokes.length > 0) {
    for (const stroke of lassoSelectedStrokes) {
      highlightStroke(stroke);
    }
  }
}

function highlightStroke(stroke) {
  ctx.save();
  ctx.strokeStyle = '#007aff';
  ctx.lineWidth = (stroke.thickness || 3) + 6;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  const pts = stroke.points;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function strokeInLasso(stroke, polygon) {
  // Simple: if any point of stroke is inside polygon
  return stroke.points.some(pt => pointInPolygon(pt, polygon));
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// --- Ruler Tool ---
let rulerActive = false;
let rulerStart = null;
let rulerEnd = null;

canvas.addEventListener('pointerdown', function(e) {
  if (currentTool === 'ruler') {
    rulerActive = true;
    rulerStart = {x: e.offsetX, y: e.offsetY};
    rulerEnd = {x: e.offsetX, y: e.offsetY};
  }
});
canvas.addEventListener('pointermove', function(e) {
  if (currentTool === 'ruler' && rulerActive) {
    rulerEnd = snapToAngle(rulerStart, {x: e.offsetX, y: e.offsetY});
    redraw();
    drawRuler();
  }
});
canvas.addEventListener('pointerup', function(e) {
  if (currentTool === 'ruler' && rulerActive) {
    rulerActive = false;
    // Draw the straight line as a stroke
    strokes.push({
      tool: 'pen',
      color: color,
      thickness: thickness,
      points: [rulerStart, rulerEnd]
    });
    rulerStart = null;
    rulerEnd = null;
    redraw();
  }
});

function drawRuler() {
  if (!rulerStart || !rulerEnd) return;
  ctx.save();
  ctx.strokeStyle = '#007aff';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(rulerStart.x, rulerStart.y);
  ctx.lineTo(rulerEnd.x, rulerEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function snapToAngle(start, end) {
  // Snap to 15-degree increments
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);
  const snap = Math.PI / 12; // 15 degrees
  const snappedAngle = Math.round(angle / snap) * snap;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return {
    x: start.x + Math.cos(snappedAngle) * dist,
    y: start.y + Math.sin(snappedAngle) * dist
  };
}

// Catmull-Rom spline smoothing for Apple Notes-like curves
function getCatmullRomSpline(points, segments = 20) {
  if (points.length < 2) return points;
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1] || points[i];
    const p3 = points[i + 2] || p2;
    for (let t = 0; t < segments; t++) {
      const s = t / segments;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * s + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * s * s + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * s * s * s);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * s + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * s * s + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * s * s * s);
      result.push({ x, y });
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

// Moving average smoothing for points
function movingAverage(points, window = 3) {
  if (points.length <= window) return points;
  const smoothed = [];
  for (let i = 0; i < points.length; i++) {
    let sumX = 0, sumY = 0, count = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(points.length - 1, i + window); j++) {
      sumX += points[j].x;
      sumY += points[j].y;
      count++;
    }
    smoothed.push({ x: sumX / count, y: sumY / count });
  }
  return smoothed;
}

// Remove pressure from drawing logic
function startDraw(e) {
  if (currentTool === 'lasso' || currentTool === 'ruler') return; // handled separately
  if (!isValidPointer(e)) return;
  drawing = true;
  currentStroke = {
    tool: currentTool,
    color: currentTool === 'eraser' ? '#fff' : color,
    thickness: toolThickness[currentTool],
    points: [{ x: e.offsetX, y: e.offsetY }],
  };
}

function addPoint(points, x, y, minDist = 1.5) {
  if (points.length === 0) return points.push({x, y});
  const last = points[points.length - 1];
  const dx = x - last.x, dy = y - last.y;
  if (dx*dx + dy*dy > minDist*minDist) points.push({x, y});
}

function draw(e) {
  if (!drawing || !currentStroke) return;
  if (!isValidPointer(e)) return;
  addPoint(currentStroke.points, e.offsetX, e.offsetY, 1.5);
  redraw();
}

function endDraw(e) {
  if (!drawing || !currentStroke) return;
  strokes.push(currentStroke);
  currentStroke = null;
  drawing = false;
  undoneStrokes = [];
  redraw();
}

// Remove pressure from drawStroke
function drawStroke(stroke) {
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (stroke.tool === 'marker') {
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 8;
  } else if (stroke.tool === 'pen') {
    ctx.globalAlpha = 0.7;
    ctx.shadowBlur = 0;
  } else if (stroke.tool === 'pencil') {
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([0.5, 2]);
    ctx.shadowBlur = 0;
  } else {
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
  const pts = stroke.points;
  if (pts.length < 2) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.thickness / 2, 0, 2 * Math.PI);
    ctx.fillStyle = stroke.color;
    ctx.globalAlpha = 1.0;
    ctx.fill();
    ctx.restore();
    return;
  }
  // Apply moving average, then Catmull-Rom spline for ultra-smoothness
  const smoothPts = getCatmullRomSpline(movingAverage(pts, 3), 20);
  ctx.beginPath();
  ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
  for (let i = 1; i < smoothPts.length; i++) {
    ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
  }
  ctx.lineWidth = stroke.thickness;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Palm rejection helper
function isValidPointer(e) {
  if (e.pointerType === 'touch' && (e.isPrimary === false || e.width > 40 || e.height > 40)) {
    // Ignore non-primary or large touch (likely palm)
    return false;
  }
  return true;
}

// Infinite vertical canvas: allow panning and dynamic height
let panY = 0;
let isPanning = false;
let lastPanY = 0;
canvas.addEventListener('pointerdown', function(e) {
  if (currentTool === 'move' || (e.pointerType === 'touch' && e.button === 1)) {
    isPanning = true;
    lastPanY = e.clientY;
  }
});
canvas.addEventListener('pointermove', function(e) {
  if (isPanning) {
    panY += e.clientY - lastPanY;
    lastPanY = e.clientY;
    redraw();
  }
});
canvas.addEventListener('pointerup', function(e) {
  isPanning = false;
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(0, panY);
  for (const stroke of strokes) {
    drawStroke(stroke);
  }
  if (currentStroke) drawStroke(currentStroke);
  ctx.restore();
  if (rulerActive) drawRuler();
}

// Lasso: allow scaling (shrink/expand) selected strokes
let lassoScale = 1;
canvas.addEventListener('wheel', function(e) {
  if (lassoSelectedStrokes.length > 0 && currentTool === 'lasso') {
    e.preventDefault();
    const scaleAmount = e.deltaY < 0 ? 1.05 : 0.95;
    lassoScale *= scaleAmount;
    lassoSelectedStrokes.forEach(stroke => {
      stroke.points = stroke.points.map(pt => ({
        x: lassoCenter().x + (pt.x - lassoCenter().x) * scaleAmount,
        y: lassoCenter().y + (pt.y - lassoCenter().y) * scaleAmount
      }));
    });
    redraw();
  }
}, { passive: false });
function lassoCenter() {
  // Center of lasso polygon
  if (!lassoPoints.length) return {x: 0, y: 0};
  let sumX = 0, sumY = 0;
  lassoPoints.forEach(pt => { sumX += pt.x; sumY += pt.y; });
  return { x: sumX / lassoPoints.length, y: sumY / lassoPoints.length };
}

function undo() {
  if (strokes.length > 0) {
    undoneStrokes.push(strokes.pop());
    redraw();
  }
}
function redo() {
  if (undoneStrokes.length > 0) {
    strokes.push(undoneStrokes.pop());
    redraw();
  }
}
function exportImage() {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', canvas.width);
  svg.setAttribute('height', canvas.height);
  svg.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Add background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', '#fcfcfa');
  svg.appendChild(background);
  
  // Convert strokes to SVG paths
  strokes.forEach(stroke => {
    if (stroke.points.length < 2) {
      // Single point - create circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', stroke.points[0].x);
      circle.setAttribute('cy', stroke.points[0].y);
      circle.setAttribute('r', stroke.thickness / 2);
      circle.setAttribute('fill', stroke.color);
      svg.appendChild(circle);
    } else {
      // Multiple points - create path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const smoothPts = getCatmullRomSpline(movingAverage(stroke.points, 3), 20);
      
      let pathData = `M ${smoothPts[0].x} ${smoothPts[0].y}`;
      for (let i = 1; i < smoothPts.length; i++) {
        pathData += ` L ${smoothPts[i].x} ${smoothPts[i].y}`;
      }
      
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', stroke.color);
      path.setAttribute('stroke-width', stroke.thickness);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('fill', 'none');
      
      // Add tool-specific effects
      if (stroke.tool === 'marker') {
        path.setAttribute('opacity', '0.3');
        path.setAttribute('filter', 'blur(1px)');
      } else if (stroke.tool === 'pen') {
        path.setAttribute('opacity', '0.7');
      } else if (stroke.tool === 'pencil') {
        path.setAttribute('opacity', '0.6');
        path.setAttribute('stroke-dasharray', '0.5 2');
      }
      
      svg.appendChild(path);
    }
  });
  
  // Create downloadable SVG
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  const link = document.createElement('a');
  link.download = 'sketch.svg';
  link.href = svgUrl;
  link.click();
  
  // Also create PNG fallback
  const link2 = document.createElement('a');
  link2.download = 'sketch.png';
  link2.href = canvas.toDataURL('image/png');
  link2.click();
  
  URL.revokeObjectURL(svgUrl);
}

// --- Lasso Tool: Move, Delete, Copy ---

// --- Draggable and Expandable Toolbar ---
const toolbar = document.querySelector('.toolbar');
let isDraggingToolbar = false;
let toolbarOffset = {x: 0, y: 0};

// Toolbar buttons for delete/copy lasso selection
const deleteBtn = document.createElement('button');
deleteBtn.className = 'toolbar-lasso-delete';
deleteBtn.title = 'Delete Selection';
deleteBtn.innerHTML = '🗑️';
deleteBtn.style.display = 'none';
const copyBtn = document.createElement('button');
copyBtn.className = 'toolbar-lasso-copy';
copyBtn.title = 'Copy Selection';
copyBtn.innerHTML = '📋';
copyBtn.style.display = 'none';
toolbar.appendChild(deleteBtn);
toolbar.appendChild(copyBtn);

function updateLassoToolbarButtons() {
  const show = currentTool === 'lasso' && lassoSelectedStrokes.length > 0;
  deleteBtn.style.display = show ? '' : 'none';
  copyBtn.style.display = show ? '' : 'none';
}

deleteBtn.addEventListener('click', function() {
  if (lassoSelectedStrokes.length > 0) {
    strokes = strokes.filter(stroke => !lassoSelectedStrokes.includes(stroke));
    lassoSelectedStrokes = [];
    lassoPoints = [];
    updateLassoToolbarButtons(); // Hide buttons after delete
    redraw();
  }
});

copyBtn.addEventListener('click', function() {
  if (lassoSelectedStrokes.length > 0) {
    // Deep copy selected strokes and offset them
    const offset = 30;
    const newStrokes = lassoSelectedStrokes.map(stroke => ({
      ...stroke,
      points: stroke.points.map(pt => ({ x: pt.x + offset, y: pt.y + offset }))
    }));
    strokes = strokes.concat(newStrokes);
    updateLassoToolbarButtons(); // Keep buttons visible after copy
    redraw();
  }
});

// Set initial position (center bottom)
toolbar.style.position = 'fixed';
toolbar.style.left = '50%';
toolbar.style.bottom = '40px';
toolbar.style.top = 'auto';
toolbar.style.right = 'auto';
toolbar.style.transform = 'translateX(-50%)';

toolbar.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('toolbar') || e.target.classList.contains('toolbar-drag')) {
    isDraggingToolbar = true;
    toolbarOffset.x = e.clientX - toolbar.getBoundingClientRect().left;
    toolbarOffset.y = e.clientY - toolbar.getBoundingClientRect().top;
    toolbar.style.transition = 'none';
    toolbar.style.transform = '';
  }
});
document.addEventListener('mousemove', function(e) {
  if (isDraggingToolbar) {
    toolbar.style.left = (e.clientX - toolbarOffset.x) + 'px';
    toolbar.style.top = (e.clientY - toolbarOffset.y) + 'px';
    toolbar.style.bottom = 'auto';
    toolbar.style.right = 'auto';
  }
});
document.addEventListener('mouseup', function() {
  isDraggingToolbar = false;
  toolbar.style.transition = '';
});

// Expand/collapse button
let isToolbarCollapsed = false;
const expandBtn = document.createElement('button');
expandBtn.className = 'toolbar-expand';
expandBtn.title = 'Expand/Collapse';
expandBtn.innerHTML = '⤢';
toolbar.insertBefore(expandBtn, toolbar.firstChild);
expandBtn.addEventListener('click', function() {
  isToolbarCollapsed = !isToolbarCollapsed;
  toolbar.classList.toggle('collapsed', isToolbarCollapsed);
});

// TODO: Lasso tool logic
// TODO: Ruler tool logic
// TODO: Advanced pressure/tilt support
// TODO: Color picker UI improvements
// TODO: Touch/mouse/stylus support improvements
// TODO: Save/load sketches

// Initial tool
setActiveTool('pencil'); 