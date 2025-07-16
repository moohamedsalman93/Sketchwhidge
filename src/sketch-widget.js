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
    exportFormat: 'svg', // 'svg', 'png', 'both'
    theme: 'light'
  };

  class SketchWidget {
    constructor(container, config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      
      if (!this.container) {
        throw new Error('SketchWidget: Container element not found');
      }

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
      this.container.innerHTML = `
        <div class="sketch-widget" style="position: relative; display: inline-block;">
          <div class="canvas-container" style="display: flex; justify-content: center; align-items: flex-start; margin-bottom: 20px;">
            <canvas class="sketch-canvas" width="${this.config.width}" height="${this.config.height}" style="
              background: ${this.config.backgroundColor};
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              border: 1px solid #e0e0e0;
              touch-action: none;
              -webkit-user-select: none;
              user-select: none;
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
      this.drawing = true;
      this.currentStroke = {
        tool: this.currentTool,
        color: this.currentColor,
        thickness: this.thickness,
        points: [{ x: e.offsetX, y: e.offsetY }]
      };
    }

    draw(e) {
      if (!this.drawing || !this.currentStroke) return;
      
      const point = { x: e.offsetX, y: e.offsetY };
      this.currentStroke.points.push(point);
      this.redraw();
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
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      [...this.strokes, this.currentStroke].filter(Boolean).forEach(stroke => {
        this.drawStroke(stroke);
      });
    }

    drawStroke(stroke) {
      this.ctx.save();
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (stroke.points.length < 2) {
        this.ctx.beginPath();
        this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.thickness / 2, 0, 2 * Math.PI);
        this.ctx.fillStyle = stroke.color;
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        this.ctx.stroke();
      }
      
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
    }

    exportSVG() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', this.canvas.width);
      svg.setAttribute('height', this.canvas.height);
      svg.setAttribute('viewBox', `0 0 ${this.canvas.width} ${this.canvas.height}`);
      
      // Add background
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', this.config.backgroundColor);
      svg.appendChild(background);
      
      // Convert strokes to SVG
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
          let pathData = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
          for (let i = 1; i < stroke.points.length; i++) {
            pathData += ` L ${stroke.points[i].x} ${stroke.points[i].y}`;
          }
          
          path.setAttribute('d', pathData);
          path.setAttribute('stroke', stroke.color);
          path.setAttribute('stroke-width', stroke.thickness);
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('fill', 'none');
          svg.appendChild(path);
        }
      });
      
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
      this.redraw();
    }

    initializeState() {
      // Any initialization logic
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