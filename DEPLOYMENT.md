# Deployment Guide

This guide explains how to deploy SketchWidget to GitHub for jsdelivr CDN distribution.

## Prerequisites

- GitHub account
- NPM account (for npm publishing)
- Git installed locally
- Node.js 18+ installed

## Step 1: Prepare the Repository

1. **Create a new GitHub repository**
   ```bash
   # On GitHub, create a new repository named "sketch-widget"
   # Don't initialize with README (we have our own)
   ```

2. **Initialize local repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SketchWidget v1.0.0"
   git branch -M main
   git remote add origin https://github.com/yourusername/sketch-widget.git
   git push -u origin main
   ```

## Step 2: Build and Test

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Test the build**
   ```bash
   # Check that files were created
   ls -la dist/
   # Should see: sketch-widget.min.js and sketch-widget.min.js.map
   
   # Test the demo
   npm run dev
   # Open http://localhost:8000/demo.html
   ```

## Step 3: Create a Release

1. **Tag the release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build the project
   - Run tests
   - Create a GitHub release
   - Publish to npm (if configured)
   - Update jsdelivr cache

## Step 4: Configure Secrets (Optional)

For automated npm publishing, add these secrets to your GitHub repository:

1. Go to `Settings > Secrets and variables > Actions`
2. Add `NPM_TOKEN` with your npm auth token

## Step 5: Verify CDN Access

After deployment, verify these URLs work:

### GitHub CDN (jsdelivr)
```
https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@latest/dist/sketch-widget.min.js
https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@v1.0.0/dist/sketch-widget.min.js
```

### NPM CDN (if published to npm)
```
https://cdn.jsdelivr.net/npm/sketch-widget@latest/dist/sketch-widget.min.js
https://unpkg.com/sketch-widget@latest/dist/sketch-widget.min.js
```

## Step 6: Update Documentation

1. **Replace placeholders** in README.md:
   - Replace `yourusername` with your GitHub username
   - Update repository URLs
   - Update author information in package.json

2. **Test CDN links** in demo.html:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/yourusername/sketch-widget@latest/dist/sketch-widget.min.js"></script>
   ```

## Step 7: Set up GitHub Pages (Optional)

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Select "/ (root)" folder

2. **Access your demo**
   - Visit: `https://yourusername.github.io/sketch-widget/demo.html`

## Release Process

For future releases:

1. **Update version** in package.json
2. **Update CHANGELOG.md** with new features
3. **Commit changes**
   ```bash
   git add .
   git commit -m "Release v1.1.0"
   ```
4. **Create and push tag**
   ```bash
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```
5. **GitHub Actions handles the rest**

## CDN Cache Management

jsdelivr caches files for 7 days. To force refresh:

```bash
# Purge specific version
curl -X POST "https://purge.jsdelivr.net/gh/yourusername/sketch-widget@v1.0.0/dist/sketch-widget.min.js"

# Purge latest
curl -X POST "https://purge.jsdelivr.net/gh/yourusername/sketch-widget@latest/dist/sketch-widget.min.js"
```

## Troubleshooting

### CDN Not Working
- Check that the file exists in the repository
- Verify the path is correct (case-sensitive)
- Wait up to 10 minutes for jsdelivr to sync

### Build Failing
- Check Node.js version (requires 18+)
- Ensure all dependencies are installed
- Check for syntax errors in source files

### NPM Publishing Issues
- Verify NPM_TOKEN is set in GitHub secrets
- Check package name isn't already taken
- Ensure version number is incremented

## Security Considerations

- Never commit sensitive tokens to the repository
- Use GitHub secrets for automation tokens
- Regularly update dependencies
- Monitor for security vulnerabilities

## Performance Tips

- Enable gzip compression on your CDN
- Use specific version tags for production
- Consider using integrity hashes for security
- Monitor bundle size in CI/CD pipeline

## Support

- [GitHub Issues](https://github.com/yourusername/sketch-widget/issues)
- [GitHub Discussions](https://github.com/yourusername/sketch-widget/discussions)
- [jsdelivr Support](https://github.com/jsdelivr/jsdelivr) 