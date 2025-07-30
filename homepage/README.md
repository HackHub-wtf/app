# HackHub Landing Page

A modern, responsive landing page for HackHub - the ultimate hackathon management platform.

## 🚀 Features

- **Responsive Design**: Looks great on all devices
- **Modern UI**: Clean, professional design with smooth animations
- **Performance Optimized**: Fast loading with lazy loading and optimized assets
- **SEO Friendly**: Semantic HTML with proper meta tags
- **Accessibility**: WCAG compliant with keyboard navigation support
- **GitHub Pages Ready**: Configured for easy deployment

## 📁 Project Structure

```
homepage/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality and interactions
├── README.md           # This file
└── assets/             # Brand assets (logos, banners)
    ├── green_logo.svg
    ├── green_banner.svg
    ├── black_banner.svg
    └── ...
```

## 🎨 Design Features

### Hero Section
- Gradient background with modern typography
- Interactive 3D dashboard preview
- Animated statistics counter
- Responsive call-to-action buttons

### Features Grid
- 6 key feature cards with hover effects
- Icon-based visual hierarchy
- Smooth scroll animations

### Pricing Section
- 3-tier pricing structure
- Featured plan highlighting
- Interactive hover states

### Contact Form
- Glassmorphism design
- Form validation
- Success/error notifications

## 🚀 Deployment to GitHub Pages

### Option 1: GitHub Pages (Recommended)

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Source: Deploy from a branch
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)` or `/homepage` if you want to serve from the homepage directory

2. **Custom Domain (Optional)**:
   - Add a `CNAME` file with your domain
   - Configure DNS settings

3. **Your site will be available at**:
   - `https://username.github.io/repository-name/homepage/`
   - Or your custom domain

### Option 2: Alternative Deployment

You can also deploy to:
- **Netlify**: Drag and drop the homepage folder
- **Vercel**: Connect your GitHub repo
- **Surge.sh**: `npm install -g surge && surge homepage/`

## 🛠 Customization

### Colors
The main brand color is defined in CSS variables. Update these in `styles.css`:

```css
:root {
  --primary-color: #10b981;    /* Green */
  --primary-dark: #059669;     /* Darker green */
  --secondary-color: #64748b;  /* Gray */
}
```

### Content
- Update text content in `index.html`
- Replace placeholder links with actual URLs
- Modify contact information
- Update social media links

### Assets
- Replace logo files in the assets directory
- Ensure SVG files are optimized
- Update favicon reference in HTML

### Analytics
Add your analytics code before the closing `</body>` tag:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari (latest)
- Chrome Mobile (latest)

## 🔧 Development

### Local Development
1. Clone the repository
2. Navigate to the homepage directory
3. Open `index.html` in your browser
4. Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with serve)
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

### Making Changes
1. Edit HTML in `index.html`
2. Update styles in `styles.css`
3. Add functionality in `script.js`
4. Test across different devices and browsers
5. Commit and push to deploy via GitHub Pages

## 🎯 Performance Tips

- Images are optimized and use SVG where possible
- CSS and JS are minified for production
- Lazy loading implemented for images
- Smooth scroll behavior with performance considerations

## 📊 SEO Optimization

- Semantic HTML structure
- Meta descriptions and titles
- Open Graph tags for social sharing
- Structured data markup
- Fast loading times
- Mobile-first responsive design

## 🚀 Next Steps

1. Set up Google Analytics
2. Configure custom domain
3. Add real contact form backend
4. Implement A/B testing
5. Set up monitoring and error tracking

## 📞 Support

For questions about the landing page:
- Open an issue in the repository
- Contact: hello@hackhub.wtf
- Join our Discord community

---

Built with ❤️ for the developer community
