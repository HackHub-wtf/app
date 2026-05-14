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
   - **Enforce HTTPS**: ✅ **IMPORTANT: Enable this checkbox**

3. **Save Configuration**

> **⚠️ Note**: The "Enforce HTTPS" option may be grayed out initially. It becomes available after:
> - DNS records are properly configured
> - Domain ownership is verified
> - SSL certificate is provisioned (usually 5-15 minutes)

### 🔒 **HTTPS Enforcement Steps**

#### **Step 1: Wait for SSL Certificate**
After DNS propagation, GitHub will automatically:
1. Verify domain ownership
2. Request SSL certificate from Let's Encrypt
3. Install certificate on GitHub's CDN

#### **Step 2: Enable HTTPS Enforcement**
Once the certificate is ready:
1. Go back to repository Settings → Pages
2. Check "Enforce HTTPS" checkbox
3. Save settings

#### **Step 3: Verify HTTPS is Working**
```bash
# Test HTTPS connectivity
curl -I https://hackhub.wtf

# Check SSL certificate details
openssl s_client -connect hackhub.wtf:443 -servername hackhub.wtf
```

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
2. **Domain Verification**: 5-10 minutes after DNS
3. **SSL Certificate Provisioning**: 5-15 minutes after verification
4. **HTTPS Enforcement Available**: Immediately after certificate
5. **Total Time**: Usually 1-4 hours for full HTTPS setup

## 🔒 **HTTPS Troubleshooting Guide**

### **Issue: "Enforce HTTPS" is Grayed Out**

**Cause**: SSL certificate not yet provisioned

**Solutions**:
1. **Wait**: Certificate provisioning takes 5-15 minutes
2. **Check DNS**: Verify A records are correct
3. **Verify Domain**: Check green checkmark in Pages settings
4. **Refresh**: Remove and re-add custom domain

### **Issue: Mixed Content Warnings**

**Cause**: Some resources loading over HTTP instead of HTTPS

**Solutions**:
```html
<!-- Ensure all assets use HTTPS or relative URLs -->
<img src="https://example.com/image.png"> <!-- ✅ Good -->
<img src="//example.com/image.png">      <!-- ✅ Good -->
<img src="/assets/image.png">            <!-- ✅ Good -->
<img src="http://example.com/image.png"> <!-- ❌ Bad -->
```

### **Issue: Certificate Errors**

**Cause**: DNS not fully propagated or certificate renewal issues

**Solutions**:
1. Wait 24-48 hours for full DNS propagation
2. Check DNS with multiple tools (dig, nslookup, online checkers)
3. Contact GitHub Support if persistent

### **Quick HTTPS Status Check**

```bash
# One-liner to check HTTPS status
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://hackhub.wtf
# Expected: 301 https://hackhub.wtf/

curl -s -o /dev/null -w "%{http_code}\n" https://hackhub.wtf
# Expected: 200
```

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
- **Wait 10-15 minutes** after DNS propagation
- GitHub automatically provisions SSL certificates from **Let's Encrypt**
- Check repository Settings → Pages for SSL status
- **Common indicators**:
  - ✅ "Enforce HTTPS" checkbox is available and checked
  - ✅ Green checkmark next to custom domain
  - ✅ "Your site is published at https://hackhub.wtf"

#### **3. HTTPS Not Available**
If "Enforce HTTPS" is grayed out:
```bash
# Check DNS propagation first
dig hackhub.wtf A

# Verify GitHub's IPs are returned
# Should show: 185.199.108.153, 185.199.109.153, etc.
```

**Solutions**:
- Wait for DNS propagation (up to 48 hours, usually 1-4 hours)
- Verify A records point to correct GitHub IPs
- Remove and re-add custom domain in settings
- Wait 15-30 minutes and try again

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

- [ ] **DNS propagated**: `dig hackhub.wtf A` returns GitHub IPs
- [ ] **Domain verified**: Green checkmark in GitHub Pages settings
- [ ] **SSL certificate**: "Enforce HTTPS" checkbox is available
- [ ] **Primary domain works**: `https://hackhub.wtf` (note HTTPS)
- [ ] **WWW redirects**: `https://www.hackhub.wtf` → `https://hackhub.wtf`
- [ ] **HTTPS enforced**: HTTP redirects to HTTPS automatically
- [ ] **SSL certificate valid**: No browser warnings
- [ ] **All assets load**: Images, CSS, JavaScript over HTTPS
- [ ] **Mobile responsive**: Test on mobile devices
- [ ] **Navigation works**: All internal links function
- [ ] **GitHub links work**: External links to repository

### 🔒 **HTTPS-Specific Tests**

```bash
# Test HTTP → HTTPS redirect
curl -I http://hackhub.wtf
# Should return 301/302 redirect to https://

# Test HTTPS directly
curl -I https://hackhub.wtf
# Should return 200 OK

# Check SSL certificate
curl -vI https://hackhub.wtf 2>&1 | grep -E "(SSL|TLS|certificate)"

# Verify certificate issuer (should be Let's Encrypt)
echo | openssl s_client -connect hackhub.wtf:443 2>/dev/null | openssl x509 -noout -issuer
```

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
