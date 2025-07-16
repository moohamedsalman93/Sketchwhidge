# Contributing to SketchWidget

Thank you for your interest in contributing to SketchWidget! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/moohamedsalman93/sketch-widget.git
   cd sketch-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
sketch-widget/
├── src/
│   └── sketch-widget.js      # Main source file
├── dist/                     # Built/minified files (auto-generated)
├── demo.html                 # Demo page
├── README.md                 # Documentation
├── package.json              # Package configuration
└── LICENSE                   # MIT License
```

## Development Guidelines

### Code Style
- Use ES6+ features where appropriate
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices and tablets
- Ensure touch events work properly
- Test vector export functionality

### Performance
- Keep the bundle size small
- Avoid unnecessary DOM manipulations
- Use efficient drawing algorithms
- Minimize memory usage

## Making Changes

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Edit `src/sketch-widget.js` for core functionality
   - Update documentation if needed
   - Add tests if applicable

4. **Test your changes**
   ```bash
   npm run build
   # Open demo.html in browser to test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

## Pull Request Guidelines

- **Clear description**: Explain what changes you made and why
- **Test coverage**: Ensure your changes work across browsers
- **Documentation**: Update README.md if you add new features
- **Small commits**: Keep changes focused and atomic
- **No breaking changes**: Maintain backward compatibility

## Feature Requests

Before implementing a new feature:

1. **Check existing issues** to avoid duplicates
2. **Create an issue** to discuss the feature
3. **Wait for approval** from maintainers
4. **Implement the feature** following these guidelines

## Bug Reports

When reporting bugs:

1. **Use the issue template**
2. **Provide steps to reproduce**
3. **Include browser/device information**
4. **Add screenshots if helpful**
5. **Check console for errors**

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's goals and vision

## Release Process

1. **Version bump** in package.json
2. **Update CHANGELOG.md**
3. **Build and test** thoroughly
4. **Create GitHub release**
5. **Publish to npm**
6. **Update CDN links**

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions and ideas
- **Email**: For private concerns

Thank you for contributing to SketchWidget! 🎨 