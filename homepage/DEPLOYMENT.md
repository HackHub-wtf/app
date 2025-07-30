# 🌐 Custom Domain Deployment Guide

This guide explains how to deploy the HackHub homepage to a custom domain using GitHub Pages.

## 🎯 **Target URLs**
- Primary: `https://hackhub.wtf`
- WWW: `https://www.hackhub.wtf`

## 📋 **Setup Checklist**

### ✅ **1. CNAME File** (Already Done)
The `CNAME` file has been added to the homepage directory:
```
homepage/CNAME
```
Contains: `hackhub.wtf`

### 🔧 **2. DNS Configuration** (Required - External)

Configure these DNS records with your domain provider:

#### **A Records for Apex Domain (hackhub.wtf)**
```dns
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

#### **CNAME Record for WWW Subdomain**
```dns
Type: CNAME
Name: www
Value: hackhub-wtf.github.io
```

### ⚙️ **3. GitHub Repository Settings**

1. **Navigate to Repository Settings**:
   ```
   https://github.com/HackHub-wtf/app/settings
   ```

2. **Configure Pages Section**:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/homepage`
   - **Custom domain**: `hackhub.wtf`
   - **Enforce HTTPS**: ✅ Enable

3. **Save Configuration**

### 🚀 **4. GitHub Actions** (Already Configured)

The deployment workflow is already set up:
- **File**: `.github/workflows/deploy-homepage.yml`
- **Trigger**: Pushes to `homepage/` directory
- **Action**: Automatically deploys to GitHub Pages

## 🔍 **Verification Steps**

### **1. Check DNS Propagation**
```bash
# Check A records
dig hackhub.wtf A

# Check CNAME record
dig www.hackhub.wtf CNAME

# Check GitHub Pages IPs
nslookup hackhub.wtf
```

### **2. Verify GitHub Pages Status**
- Go to repository Settings → Pages
- Check for green checkmark and "Your site is live at https://hackhub.wtf"

### **3. Test URLs**
- Primary: https://hackhub.wtf
- WWW: https://www.hackhub.wtf
- GitHub: https://hackhub-wtf.github.io/app/homepage/

## ⏱️ **Timeline**

1. **DNS Propagation**: 5 minutes - 48 hours (typically 1-4 hours)
2. **GitHub Pages SSL**: 5-10 minutes after DNS
3. **Total Time**: Usually 1-4 hours for full propagation

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. DNS Not Resolving**
```bash
# Check current DNS
dig hackhub.wtf

# If not working, verify:
# - DNS records are correct
# - TTL has expired
# - Domain provider settings
```

#### **2. SSL Certificate Issues**
- Wait 10-15 minutes after DNS propagation
- GitHub automatically provisions SSL certificates
- Check repository Settings → Pages for SSL status

#### **3. 404 Errors**
- Verify CNAME file contains correct domain
- Check GitHub Pages source is set to `/homepage`
- Ensure index.html is in homepage directory

#### **4. WWW Not Redirecting**
- Verify CNAME record points to `hackhub-wtf.github.io`
- Check DNS propagation for www subdomain

### **Debug Commands**

```bash
# Check DNS propagation
dig hackhub.wtf A +trace
dig www.hackhub.wtf CNAME +trace

# Test HTTP response
curl -I https://hackhub.wtf
curl -I https://www.hackhub.wtf

# Check SSL certificate
openssl s_client -connect hackhub.wtf:443 -servername hackhub.wtf
```

## 📱 **Testing Checklist**

After deployment, verify:

- [ ] **Primary domain works**: `https://hackhub.wtf`
- [ ] **WWW redirects**: `https://www.hackhub.wtf` → `https://hackhub.wtf`
- [ ] **HTTPS enabled**: SSL certificate is valid
- [ ] **All assets load**: Images, CSS, JavaScript
- [ ] **Mobile responsive**: Test on mobile devices
- [ ] **Navigation works**: All internal links function
- [ ] **GitHub links work**: External links to repository

## 🔄 **Deployment Process**

1. **Make changes** to files in `homepage/` directory
2. **Commit and push** to main branch
3. **GitHub Actions** automatically deploys
4. **Site updates** within 1-2 minutes

## 📊 **Monitoring**

### **Analytics Setup** (Optional)
Add to `homepage/index.html` before `</head>`:

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

### **Performance Monitoring**
- Use Google PageSpeed Insights
- Monitor Core Web Vitals
- Check mobile performance

## 🎉 **Success!**

Once configured, your HackHub homepage will be live at:
- **https://hackhub.wtf** (primary)
- **https://www.hackhub.wtf** (redirects to primary)

The site will automatically update whenever you push changes to the `homepage/` directory!

---

**Need help?** Check the [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for additional troubleshooting.
