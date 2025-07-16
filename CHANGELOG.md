# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of SketchWidget
- Vector SVG export functionality
- Multiple drawing tools (pencil, pen, marker, eraser, lasso, ruler)
- Touch and pointer event support
- Configurable color palette
- Undo/redo functionality
- CDN-ready distribution
- Auto-initialization with data attributes
- Programmatic API for advanced control
- Responsive toolbar with grid layout
- Cross-browser compatibility
- Zero dependencies implementation

### Features
- **Drawing Tools**: Six different tools with unique characteristics
- **Vector Export**: Export drawings as scalable SVG files
- **Touch Support**: Full mobile and tablet compatibility
- **Customizable**: Configure colors, tools, canvas size, and export format
- **Lightweight**: ~15KB minified bundle size
- **Easy Integration**: Simple CDN inclusion or npm install

### Browser Support
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with pointer events

### API Methods
- `clear()` - Clear the canvas
- `getStrokes()` - Get drawing data
- `loadStrokes(strokes)` - Load drawing data
- `exportDrawing()` - Export as configured format

### Configuration Options
- `width` - Canvas width in pixels
- `height` - Canvas height in pixels
- `backgroundColor` - Canvas background color
- `exportFormat` - Export format ('svg', 'png', 'both')
- `tools` - Available drawing tools array
- `colors` - Available color palette array

---

## Future Releases

### Planned Features
- [ ] Advanced brush settings
- [ ] Layer support
- [ ] Shape tools (rectangle, circle, line)
- [ ] Text tool
- [ ] Image import/paste
- [ ] Collaborative editing
- [ ] Cloud save/load
- [ ] Keyboard shortcuts
- [ ] Dark theme support
- [ ] Performance optimizations

### Breaking Changes
None planned for v1.x series. All changes will maintain backward compatibility.

---

## Release Notes Format

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Now removed features

#### Fixed
- Bug fixes

#### Security
- Vulnerability fixes 