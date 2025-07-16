# SketchWidget - Embeddable Vector Drawing Canvas

A lightweight, embeddable sketch canvas widget that exports vector graphics (SVG). Perfect for adding drawing capabilities to any website.

## Features

- 🎨 **Vector Export**: Exports drawings as scalable SVG files
- 🖌️ **Multiple Tools**: Pencil, pen, marker, eraser, lasso, ruler
- 🎯 **Touch Support**: Works on desktop, tablet, and mobile
- 📦 **Zero Dependencies**: Pure JavaScript, no external libraries
- 🚀 **CDN Ready**: Easy to embed anywhere
- ⚡ **Lightweight**: ~15KB minified
- 🎨 **Customizable**: Configurable colors, tools, and export formats

## Quick Start

### CDN Usage

```html
<!-- Include the widget -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@latest/dist/sketch-widget.min.js"></script>

<!-- Simple usage with data attributes -->
<div data-sketch-widget 
     data-width="800" 
     data-height="600" 
     data-export-format="svg"></div>
```

### NPM Installation

```bash
npm install sketch-widget
```

```javascript
import SketchWidget from 'sketch-widget';

const widget = new SketchWidget('#container', {
  width: 800,
  height: 600,
  exportFormat: 'svg'
});
```

### Manual Initialization

```html
<div id="my-sketch"></div>

<script>
const widget = new SketchWidget('#my-sketch', {
  width: 800,
  height: 600,
  backgroundColor: '#fcfcfa',
  exportFormat: 'svg', // 'svg', 'png', or 'both'
  tools: ['pencil', 'pen', 'marker', 'eraser', 'lasso', 'ruler'],
  colors: ['#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA']
});
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | Number | 800 | Canvas width in pixels |
| `height` | Number | 600 | Canvas height in pixels |
| `backgroundColor` | String | '#fcfcfa' | Canvas background color |
| `exportFormat` | String | 'svg' | Export format: 'svg', 'png', or 'both' |
| `tools` | Array | All tools | Available drawing tools |
| `colors` | Array | Default palette | Available colors |
| `theme` | String | 'light' | UI theme (future feature) |

## API Methods

```javascript
const widget = new SketchWidget('#container');

// Clear the canvas
widget.clear();

// Get all strokes data
const strokes = widget.getStrokes();

// Load strokes data
widget.loadStrokes(strokes);

// Export programmatically
widget.exportDrawing();
```

## Examples

### Basic Drawing Canvas

```html
<div data-sketch-widget></div>
```

### Custom Configuration

```html
<div data-sketch-widget 
     data-width="600" 
     data-height="400" 
     data-background-color="#ffffff" 
     data-export-format="both"></div>
```

### Programmatic Control

```javascript
const widget = new SketchWidget('#sketch', {
  width: 1000,
  height: 800,
  tools: ['pencil', 'pen', 'eraser'], // Limited tools
  colors: ['#000000', '#FF0000', '#00FF00', '#0000FF'], // Custom colors
  exportFormat: 'svg'
});

// Add custom export button
document.getElementById('export-btn').addEventListener('click', () => {
  widget.exportDrawing();
});

// Save/load functionality
document.getElementById('save-btn').addEventListener('click', () => {
  const data = widget.getStrokes();
  localStorage.setItem('sketch-data', JSON.stringify(data));
});

document.getElementById('load-btn').addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem('sketch-data') || '[]');
  widget.loadStrokes(data);
});
```

## Vector Export

The widget exports drawings as SVG files, which are:
- **Scalable**: Vector graphics that scale to any size
- **Editable**: Can be opened in design software
- **Small**: Efficient file sizes
- **Web-friendly**: Supported by all modern browsers

## CDN Links

### Latest Version (Recommended)
```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@latest/dist/sketch-widget.min.js"></script>
```

### Specific Version
```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@v1.0.0/dist/sketch-widget.min.js"></script>
```

### Alternative CDNs
```html
<!-- unpkg -->
<script src="https://unpkg.com/sketch-widget@latest/dist/sketch-widget.min.js"></script>

<!-- jsDelivr NPM -->
<script src="https://cdn.jsdelivr.net/npm/sketch-widget@latest/dist/sketch-widget.min.js"></script>
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with pointer events support

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/sketch-widget.git
cd sketch-widget

# Install dependencies
npm install

# Start development server
npm run dev

# Build minified version
npm run build
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - feel free to use in any project!

## Links

- [GitHub Repository](https://github.com/yourusername/sketch-widget)
- [NPM Package](https://www.npmjs.com/package/sketch-widget)
- [Demo Page](https://yourusername.github.io/sketch-widget/)
- [Issues](https://github.com/yourusername/sketch-widget/issues)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history. 