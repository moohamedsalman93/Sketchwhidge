/**
 * SketchWidget - A lightweight, embeddable sketch canvas with vector export
 * Version: 1.0.0
 * License: MIT
 * Repository: https://github.com/moohamedsalman93/sketch-widget
 */

(function(window, document) {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    width: 800,
    height: 600,
    backgroundColor: '#fcfcfa',
    tools: ['pencil', 'pen', 'marker', 'eraser', 'lasso', 'ruler'],
    colors: ['#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#0579FF', '#5856D6', '#FFFFFF'],
    exportFormat: 'svg', // 'svg', 'png', 'both', 'json'
    theme: 'light'
  };

  class SketchWidget {
    constructor(container, config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      
      if (!this.container) {
        throw new Error('SketchWidget: Container element not found');
      }

      // Add new state properties
      this.lassoActive = false;
      this.lassoPoints = [];
      this.lassoSelectedStrokes = [];
      this.lassoDragging = false;
      this.lassoDragStart = null;
      this.lassoLastPos = null;
      this.lassoScale = 1;

      this.rulerActive = false;
      this.rulerStart = null;
      this.rulerEnd = null;

      this.panY = 0;
      this.isPanning = false;
      this.lastPanY = 0;

      // Individual thickness for each tool
      this.toolThickness = {
        pencil: 3,
        pen: 5,
        marker: 10,
        eraser: 15
      };

      this.init();
    }

    init() {
      this.createHTML();
      this.setupCanvas();
      this.setupTools();
      this.setupEventListeners();
      this.initializeState();
    }

    createHTML() {
      // Handle percentage dimensions by calculating actual size
      const containerRect = this.container.getBoundingClientRect();
      
      // If container has no dimensions, wait a bit and try again
      if ((containerRect.width === 0 || containerRect.height === 0) && 
          (this.config.width === '100%' || this.config.height === '100%')) {
        setTimeout(() => this.createHTML(), 50);
        return;
      }
      
      const actualWidth = this.config.width === '100%' ? containerRect.width : 
                         (typeof this.config.width === 'string' && this.config.width.includes('%')) ? 
                         (parseFloat(this.config.width) / 100) * containerRect.width : 
                         parseInt(this.config.width);
      const actualHeight = this.config.height === '100%' ? containerRect.height : 
                          (typeof this.config.height === 'string' && this.config.height.includes('%')) ? 
                          (parseFloat(this.config.height) / 100) * containerRect.height : 
                          parseInt(this.config.height);

      // Store actual dimensions for canvas
      this.actualWidth = actualWidth || 800;
      this.actualHeight = actualHeight || 600;

      this.container.innerHTML = `
        <div class="sketch-widget" style="position: relative; display: flex; flex-direction: column; width: ${this.config.width}; height: ${this.config.height};">
          <div class="canvas-container" style="display: flex; justify-content: center; align-items: flex-start; margin-bottom: 20px; flex: 1; width: 100%; height: 100%;">
            <canvas class="sketch-canvas" width="${this.actualWidth}" height="${this.actualHeight}" style="
              background: ${this.config.backgroundColor};
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              border: 1px solid #e0e0e0;
              touch-action: none;
              -webkit-user-select: none;
              user-select: none;
              max-width: 100%;
              max-height: 100%;
              width: ${this.actualWidth}px;
              height: ${this.actualHeight}px;
            "></canvas>
          </div>
          <div class="sketch-toolbar" style="
            display: flex;
            align-items: center;
            background: #fff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            padding: 8px 16px;
            gap: 8px;
            border-radius: 20px;
            justify-content: center;
            margin: 0 auto;
            width: fit-content;
            flex-shrink: 0;
          ">
            <div class="toolbar-tools" style="
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4px;
              border-right: 1px solid #e0e0e0;
              padding-right: 12px;
            ">
              ${this.config.tools.map(tool => `
                <button class="tool-btn" data-tool="${tool}" style="
                  border: none;
                  background: #f4f4f4;
                  border-radius: 50%;
                  width: 32px;
                  height: 32px;
                  font-size: 14px;
                  cursor: pointer;
                  transition: all 0.2s;
                " title="${tool.charAt(0).toUpperCase() + tool.slice(1)}">${this.getToolIcon(tool)}</button>
              `).join('')}
            </div>
            <div class="toolbar-controls" style="
              display: flex;
              gap: 6px;
              align-items: center;
              border-right: 1px solid #e0e0e0;
              padding-right: 12px;
            ">
              <input type="range" class="thickness-slider" min="1" max="30" value="3" style="
                width: 60px;
                height: 4px;
                border-radius: 4px;
                background: #e0e0e0;
              ">
              <button class="undo-btn" style="
                border: none;
                background: #f4f4f4;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 14px;
                cursor: pointer;
              ">↩️</button>
              <button class="redo-btn" style="
                border: none;
                background: #f4f4f4;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 14px;
                cursor: pointer;
              ">↪️</button>
              <button class="export-btn" style="
                border: none;
                background: #f4f4f4;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 14px;
                cursor: pointer;
              ">💾</button>
            </div>
            <div class="color-swatches" style="
              display: flex;
              gap: 4px;
              flex-wrap: wrap;
              max-width: 120px;
            ">
              ${this.config.colors.map(color => `
                <button class="color-swatch" data-color="${color}" style="
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  border: 1px solid #e0e0e0;
                  background: ${color};
                  cursor: pointer;
                  transition: all 0.2s;
                ${color === '#FFFFFF' ? 'border: 1px solid #ccc;' : ''}
                "></button>
              `).join('')}
            </div>
            
            <!-- Add lasso operation buttons -->
            <button class="lasso-delete-btn" style="display: none; border: none; background: #f4f4f4; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; margin-left: 8px;">🗑️</button>
            <button class="lasso-copy-btn" style="display: none; border: none; background: #f4f4f4; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; margin-left: 8px;">📋</button>
            
            <!-- Add expand button -->
            <button class="toolbar-expand" style="border: none; background: #f4f4f4; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; margin-left: 8px;">⤢</button>
          </div>
        </div>
      `;
    }

    getToolIcon(tool) {
      const icons = {
        pencil: '✏️',
        pen: '🖊️',
        marker: '🖍️',
        eraser: '🧽',
        lasso: '🔲',
        ruler: '📏'
      };
      return icons[tool] || '🖊️';
    }

    setupCanvas() {
      this.canvas = this.container.querySelector('.sketch-canvas');
      this.ctx = this.canvas.getContext('2d');
      
      // Initialize drawing state
      this.strokes = [];
      this.undoneStrokes = [];
      this.currentStroke = null;
      this.drawing = false;
      this.currentTool = 'pencil';
      this.currentColor = this.config.colors[0];
      this.thickness = 3;
    }

    setupTools() {
      // Tool selection
      this.container.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setActiveTool(btn.dataset.tool);
        });
      });

      // Color selection
      this.container.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          this.setActiveColor(swatch.dataset.color);
        });
      });

      // Set initial active states
      this.setActiveTool('pencil');
      this.setActiveColor(this.config.colors[0]);
    }

    setupEventListeners() {
      // Drawing events
      this.canvas.addEventListener('pointerdown', (e) => this.startDraw(e));
      this.canvas.addEventListener('pointermove', (e) => this.draw(e));
      this.canvas.addEventListener('pointerup', (e) => this.endDraw(e));
      
      // Control events
      this.container.querySelector('.thickness-slider').addEventListener('input', (e) => {
        this.thickness = parseInt(e.target.value);
      });
      
      this.container.querySelector('.undo-btn').addEventListener('click', () => this.undo());
      this.container.querySelector('.redo-btn').addEventListener('click', () => this.redo());
      this.container.querySelector('.export-btn').addEventListener('click', () => this.exportDrawing());

      // Lasso tool events
      this.canvas.addEventListener('pointerdown', (e) => this.handleLassoStart(e));
      this.canvas.addEventListener('pointermove', (e) => this.handleLassoMove(e));
      this.canvas.addEventListener('pointerup', (e) => this.handleLassoEnd(e));
      
      // Ruler tool events
      this.canvas.addEventListener('pointerdown', (e) => this.handleRulerStart(e));
      this.canvas.addEventListener('pointermove', (e) => this.handleRulerMove(e));
      this.canvas.addEventListener('pointerup', (e) => this.handleRulerEnd(e));
      
      // Panning events
      this.canvas.addEventListener('pointerdown', (e) => this.handlePanStart(e));
      this.canvas.addEventListener('pointermove', (e) => this.handlePanMove(e));
      this.canvas.addEventListener('pointerup', (e) => this.handlePanEnd(e));
      
      // Lasso operations
      this.container.querySelector('.lasso-delete-btn').addEventListener('click', () => this.deleteLassoSelection());
      this.container.querySelector('.lasso-copy-btn').addEventListener('click', () => this.copyLassoSelection());
      
      // Toolbar expand
      this.container.querySelector('.toolbar-expand').addEventListener('click', () => this.toggleToolbar());
      
      // Add window resize listener for responsive canvas
      if (this.config.width === '100%' || this.config.height === '100%' || 
          (typeof this.config.width === 'string' && this.config.width.includes('%')) ||
          (typeof this.config.height === 'string' && this.config.height.includes('%'))) {
        window.addEventListener('resize', () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => this.resize(), 100);
        });
      }
    }

    setActiveTool(tool) {
      this.currentTool = tool;
      this.container.querySelectorAll('.tool-btn').forEach(btn => {
        btn.style.background = btn.dataset.tool === tool ? '#d0eaff' : '#f4f4f4';
      });
    }

    setActiveColor(color) {
      this.currentColor = color;
      this.container.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.style.transform = swatch.dataset.color === color ? 'scale(1.1)' : 'scale(1)';
        swatch.style.border = swatch.dataset.color === color ? '2px solid #007aff' : '1px solid #e0e0e0';
      });
    }

    startDraw(e) {
      if (!this.isValidPointer(e)) return;
      if (this.currentTool === 'lasso' || this.currentTool === 'ruler') return;
      
      this.drawing = true;
      this.currentStroke = {
        tool: this.currentTool,
        color: this.currentTool === 'eraser' ? '#fff' : this.currentColor,
        thickness: this.toolThickness[this.currentTool] || this.thickness,
        points: [{ x: e.offsetX, y: e.offsetY }]
      };
    }

    draw(e) {
      if (!this.drawing || !this.currentStroke) return;
      if (!this.isValidPointer(e)) return;
      
      this.addPoint(this.currentStroke.points, e.offsetX, e.offsetY, 1.5);
      this.redraw();
    }

    addPoint(points, x, y, minDist = 1.5) {
      if (points.length === 0) {
        points.push({x, y});
        return;
      }
      
      const last = points[points.length - 1];
      const dx = x - last.x, dy = y - last.y;
      if (dx*dx + dy*dy > minDist*minDist) {
        points.push({x, y});
      }
    }

    endDraw(e) {
      if (!this.drawing || !this.currentStroke) return;
      
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
      this.drawing = false;
      this.undoneStrokes = [];
      this.redraw();
    }

    redraw() {
      this.ctx.clearRect(0, 0, this.actualWidth, this.actualHeight);
      this.ctx.save();
      this.ctx.translate(0, this.panY);
      
      // Draw all strokes
      for (const stroke of this.strokes) {
        this.drawStroke(stroke);
      }
      
      // Draw current stroke if exists
      if (this.currentStroke) this.drawStroke(this.currentStroke);
      
      this.ctx.restore();
      
      // Draw active tools
      if (this.rulerActive) this.drawRuler();
      if (this.lassoActive || this.lassoSelectedStrokes.length > 0) this.drawLasso(true);
    }

    // Add resize method to handle dynamic container sizing
    resize() {
      const containerRect = this.container.getBoundingClientRect();
      const actualWidth = this.config.width === '100%' ? containerRect.width : 
                         (typeof this.config.width === 'string' && this.config.width.includes('%')) ? 
                         (parseFloat(this.config.width) / 100) * containerRect.width : 
                         parseInt(this.config.width);
      const actualHeight = this.config.height === '100%' ? containerRect.height : 
                          (typeof this.config.height === 'string' && this.config.height.includes('%')) ? 
                          (parseFloat(this.config.height) / 100) * containerRect.height : 
                          parseInt(this.config.height);

      this.actualWidth = actualWidth || 800;
      this.actualHeight = actualHeight || 600;

      // Update canvas dimensions
      this.canvas.width = this.actualWidth;
      this.canvas.height = this.actualHeight;
      this.canvas.style.width = this.actualWidth + 'px';
      this.canvas.style.height = this.actualHeight + 'px';
      
      // Redraw everything
      this.redraw();
    }

    drawStroke(stroke) {
      this.ctx.save();
      
      // Set stroke properties based on tool
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (stroke.tool === 'marker') {
        this.ctx.globalAlpha = 0.3;
        this.ctx.shadowColor = stroke.color;
        this.ctx.shadowBlur = 8;
      } else if (stroke.tool === 'pen') {
        this.ctx.globalAlpha = 0.7;
        this.ctx.shadowBlur = 0;
      } else if (stroke.tool === 'pencil') {
        this.ctx.globalAlpha = 0.6;
        this.ctx.setLineDash([0.5, 2]);
        this.ctx.shadowBlur = 0;
      } else {
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
      }
      
      // Handle single point strokes
      const pts = stroke.points;
      if (pts.length < 2) {
        this.ctx.beginPath();
        this.ctx.arc(pts[0].x, pts[0].y, stroke.thickness / 2, 0, 2 * Math.PI);
        this.ctx.fillStyle = stroke.color;
        this.ctx.globalAlpha = 1.0;
        this.ctx.fill();
        this.ctx.restore();
        return;
      }
      
      // Apply smoothing
      const smoothPts = this.getCatmullRomSpline(
        this.movingAverage(pts, 3), 
        20
      );
      
      // Draw smoothed stroke
      this.ctx.beginPath();
      this.ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
      
      for (let i = 1; i < smoothPts.length; i++) {
        this.ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
      }
      
      this.ctx.lineWidth = stroke.thickness;
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.restore();
    }

    undo() {
      if (this.strokes.length > 0) {
        this.undoneStrokes.push(this.strokes.pop());
        this.redraw();
      }
    }

    redo() {
      if (this.undoneStrokes.length > 0) {
        this.strokes.push(this.undoneStrokes.pop());
        this.redraw();
      }
    }

    exportDrawing() {
      if (this.config.exportFormat === 'svg' || this.config.exportFormat === 'both') {
        this.exportSVG();
      }
      if (this.config.exportFormat === 'png' || this.config.exportFormat === 'both') {
        this.exportPNG();
      }
      if (this.config.exportFormat === 'json') {
        this.exportJSON();
      }
    }

    exportSVG() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', this.actualWidth);
      svg.setAttribute('height', this.actualHeight);
      svg.setAttribute('viewBox', `0 0 ${this.actualWidth} ${this.actualHeight}`);
      
      // Add background
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', this.config.backgroundColor);
      svg.appendChild(background);
      
      // Convert strokes to SVG with smoothing
      this.strokes.forEach(stroke => {
        if (stroke.points.length < 2) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', stroke.points[0].x);
          circle.setAttribute('cy', stroke.points[0].y);
          circle.setAttribute('r', stroke.thickness / 2);
          circle.setAttribute('fill', stroke.color);
          svg.appendChild(circle);
        } else {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          // Apply same smoothing as canvas rendering
          const smoothPts = this.getCatmullRomSpline(
            this.movingAverage(stroke.points, 3),
            20
          );
          
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
            path.setAttribute('filter', 'url(#marker-filter)');
          } else if (stroke.tool === 'pen') {
            path.setAttribute('opacity', '0.7');
          } else if (stroke.tool === 'pencil') {
            path.setAttribute('opacity', '0.6');
            path.setAttribute('stroke-dasharray', '0.5 2');
          }
          
          svg.appendChild(path);
        }
      });
      
      // Add marker filter definition
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'marker-filter');
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '200%');
      
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '1');
      filter.appendChild(blur);
      defs.appendChild(filter);
      svg.insertBefore(defs, svg.firstChild);
      
      // Download SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.download = 'sketch.svg';
      link.href = svgUrl;
      link.click();
      
      URL.revokeObjectURL(svgUrl);
    }

    exportPNG() {
      const link = document.createElement('a');
      link.download = 'sketch.png';
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    }

    exportJSON() {
      const sketchData = {
        version: "1.0",
        width: this.actualWidth,
        height: this.actualHeight,
        backgroundColor: this.config.backgroundColor,
        strokes: this.strokes.map(stroke => ({
          tool: stroke.tool,
          color: stroke.color,
          thickness: stroke.thickness,
          points: stroke.points
        }))
      };

      const json = JSON.stringify(sketchData);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = 'sketch.json';
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }

    // Public API methods
    clear() {
      this.strokes = [];
      this.undoneStrokes = [];
      this.redraw();
    }

    getStrokes() {
      return [...this.strokes];
    }

    loadStrokes(strokes) {
      this.strokes = strokes;
      // Ensure canvas is properly sized before redrawing
      if (this.config.width === '100%' || this.config.height === '100%') {
        this.resize();
      } else {
        this.redraw();
      }
    }

    initializeState() {
      // Any initialization logic
    }

    // --- New Lasso Tool Methods ---
    handleLassoStart(e) {
      if (this.currentTool !== 'lasso') return;
      
      if (this.lassoSelectedStrokes.length > 0 && this.pointInPolygon(
        {x: e.offsetX, y: e.offsetY}, this.lassoPoints)) {
        this.lassoDragging = true;
        this.lassoDragStart = {x: e.offsetX, y: e.offsetY};
        this.lassoLastPos = {x: e.offsetX, y: e.offsetY};
      } else {
        this.lassoActive = true;
        this.lassoPoints = [{x: e.offsetX, y: e.offsetY}];
        this.lassoSelectedStrokes = [];
        this.updateLassoButtons(false);
      }
    }

    handleLassoMove(e) {
      if (this.currentTool !== 'lasso') return;
      
      if (this.lassoDragging && this.lassoSelectedStrokes.length > 0) {
        const dx = e.offsetX - this.lassoLastPos.x;
        const dy = e.offsetY - this.lassoLastPos.y;
        
        this.lassoSelectedStrokes.forEach(stroke => {
          stroke.points.forEach(pt => {
            pt.x += dx;
            pt.y += dy;
          });
        });
        
        this.lassoPoints.forEach(pt => {
          pt.x += dx;
          pt.y += dy;
        });
        
        this.lassoLastPos = {x: e.offsetX, y: e.offsetY};
        this.redraw();
        this.drawLasso(true);
      } else if (this.lassoActive) {
        this.lassoPoints.push({x: e.offsetX, y: e.offsetY});
        this.redraw();
        this.drawLasso();
      }
    }

    handleLassoEnd(e) {
      if (this.currentTool !== 'lasso') return;
      
      if (this.lassoDragging) {
        this.lassoDragging = false;
        this.lassoDragStart = null;
        this.lassoLastPos = null;
      } else if (this.lassoActive) {
        this.lassoActive = false;
        if (this.lassoPoints.length > 2) {
          this.lassoPoints.push(this.lassoPoints[0]);
          this.lassoSelectedStrokes = this.strokes.filter(stroke => 
            this.strokeInLasso(stroke, this.lassoPoints));
          this.updateLassoButtons(true);
        }
        this.redraw();
        this.drawLasso(true);
      }
    }

    drawLasso(final = false) {
      if (this.lassoPoints.length < 2) return;
      
      this.ctx.save();
      this.ctx.strokeStyle = final ? '#007aff' : '#aaa';
      this.ctx.setLineDash([4, 4]);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
      
      for (let i = 1; i < this.lassoPoints.length; i++) {
        this.ctx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.restore();
      
      if (final && this.lassoSelectedStrokes.length > 0) {
        for (const stroke of this.lassoSelectedStrokes) {
          this.highlightStroke(stroke);
        }
      }
    }

    highlightStroke(stroke) {
      this.ctx.save();
      this.ctx.strokeStyle = '#007aff';
      this.ctx.lineWidth = (stroke.thickness || 3) + 6;
      this.ctx.globalAlpha = 0.2;
      this.ctx.beginPath();
      const pts = stroke.points;
      this.ctx.moveTo(pts[0].x, pts[0].y);
      
      for (let i = 1; i < pts.length; i++) {
        this.ctx.lineTo(pts[i].x, pts[i].y);
      }
      
      this.ctx.stroke();
      this.ctx.restore();
    }

    strokeInLasso(stroke, polygon) {
      return stroke.points.some(pt => this.pointInPolygon(pt, polygon));
    }

    pointInPolygon(point, polygon) {
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

    updateLassoButtons(show) {
      this.container.querySelector('.lasso-delete-btn').style.display = 
        show ? 'block' : 'none';
      this.container.querySelector('.lasso-copy-btn').style.display = 
        show ? 'block' : 'none';
    }

    deleteLassoSelection() {
      if (this.lassoSelectedStrokes.length > 0) {
        this.strokes = this.strokes.filter(stroke => 
          !this.lassoSelectedStrokes.includes(stroke));
        this.lassoSelectedStrokes = [];
        this.lassoPoints = [];
        this.updateLassoButtons(false);
        this.redraw();
      }
    }

    copyLassoSelection() {
      if (this.lassoSelectedStrokes.length > 0) {
        const offset = 30;
        const newStrokes = this.lassoSelectedStrokes.map(stroke => ({
          ...stroke,
          points: stroke.points.map(pt => ({ 
            x: pt.x + offset, 
            y: pt.y + offset 
          }))
        }));
        
        this.strokes = this.strokes.concat(newStrokes);
        this.redraw();
      }
    }

    // --- New Ruler Tool Methods ---
    handleRulerStart(e) {
      if (this.currentTool !== 'ruler') return;
      
      this.rulerActive = true;
      this.rulerStart = {x: e.offsetX, y: e.offsetY};
      this.rulerEnd = {x: e.offsetX, y: e.offsetY};
    }

    handleRulerMove(e) {
      if (this.currentTool !== 'ruler' || !this.rulerActive) return;
      
      this.rulerEnd = this.snapToAngle(
        this.rulerStart, 
        {x: e.offsetX, y: e.offsetY}
      );
      
      this.redraw();
      this.drawRuler();
    }

    handleRulerEnd(e) {
      if (this.currentTool !== 'ruler' || !this.rulerActive) return;
      
      this.rulerActive = false;
      this.strokes.push({
        tool: 'pen',
        color: this.currentColor,
        thickness: this.thickness,
        points: [this.rulerStart, this.rulerEnd]
      });
      
      this.rulerStart = null;
      this.rulerEnd = null;
      this.redraw();
    }

    drawRuler() {
      if (!this.rulerStart || !this.rulerEnd) return;
      
      this.ctx.save();
      this.ctx.strokeStyle = '#007aff';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([8, 8]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.rulerStart.x, this.rulerStart.y);
      this.ctx.lineTo(this.rulerEnd.x, this.rulerEnd.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.restore();
    }

    snapToAngle(start, end) {
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

    // --- New Smoothing Functions ---
    getCatmullRomSpline(points, segments = 20) {
      if (points.length < 2) return points;
      
      const result = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1] || points[i];
        const p3 = points[i + 2] || p2;
        
        for (let t = 0; t < segments; t++) {
          const s = t / segments;
          const x = 0.5 * ((2 * p1.x) + 
            (-p0.x + p2.x) * s + 
            (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * s * s + 
            (-p0.x + 3*p1.x - 3*p2.x + p3.x) * s * s * s);
          
          const y = 0.5 * ((2 * p1.y) + 
            (-p0.y + p2.y) * s + 
            (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * s * s + 
            (-p0.y + 3*p1.y - 3*p2.y + p3.y) * s * s * s);
          
          result.push({ x, y });
        }
      }
      
      result.push(points[points.length - 1]);
      return result;
    }

    movingAverage(points, window = 3) {
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

    // --- Palm Rejection ---
    isValidPointer(e) {
      if (e.pointerType === 'touch' && 
          (e.isPrimary === false || e.width > 40 || e.height > 40)) {
        return false;
      }
      return true;
    }

    // --- Panning Methods ---
    handlePanStart(e) {
      if (this.currentTool === 'move' || (e.pointerType === 'touch' && e.button === 1)) {
        this.isPanning = true;
        this.lastPanY = e.clientY;
      }
    }

    handlePanMove(e) {
      if (this.isPanning) {
        this.panY += e.clientY - this.lastPanY;
        this.lastPanY = e.clientY;
        this.redraw();
      }
    }

    handlePanEnd() {
      this.isPanning = false;
    }

    // --- Toolbar Methods ---
    toggleToolbar() {
      const toolbar = this.container.querySelector('.sketch-toolbar');
      toolbar.classList.toggle('collapsed');
    }
  }

  // Expose to global scope
  window.SketchWidget = SketchWidget;

  // Auto-initialize if data-sketch-widget attribute is found
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-sketch-widget]').forEach(element => {
      const config = {};
      
      // Parse configuration from data attributes
      if (element.dataset.width) config.width = parseInt(element.dataset.width);
      if (element.dataset.height) config.height = parseInt(element.dataset.height);
      if (element.dataset.backgroundColor) config.backgroundColor = element.dataset.backgroundColor;
      if (element.dataset.exportFormat) config.exportFormat = element.dataset.exportFormat;
      
      new SketchWidget(element, config);
    });
  });

})(window, document); 