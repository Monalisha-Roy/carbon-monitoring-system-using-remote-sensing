# 📦 Publishing to GitHub - Complete Guide

## Step-by-Step Instructions

### Step 1: Initialize Git Repository (if not already done)

Open PowerShell in your project directory and run:

```powershell
cd C:\Users\monal\Desktop\land-classification
git init
```

### Step 2: Configure Git (First Time Only)

If you haven't configured Git before:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Create Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name:** `land-classification` (or your preferred name)
   - **Description:** "Land Classification & Carbon Credit Analyzer using Google Earth Engine"
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have them)
5. Click **"Create repository"**

### Step 4: Verify Your .gitignore

Make sure these files are in your `.gitignore`:

```
.env*
service-account-key.json
node_modules/
.next/
```

### Step 5: Stage All Files

```powershell
git add .
```

### Step 6: Make Your First Commit

```powershell
git commit -m "Initial commit: Land Classification & Carbon Credit Analyzer"
```

### Step 7: Add Remote Repository

Replace `YOUR_USERNAME` with your actual GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/land-classification.git
```

### Step 8: Push to GitHub

```powershell
git branch -M main
git push -u origin main
```

You may be prompted to enter your GitHub credentials. If you have 2FA enabled, you'll need to use a Personal Access Token instead of your password.

---

## 🔑 Creating a Personal Access Token (if needed)

If you get authentication errors:

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: "Land Classification App"
4. Select scopes: Check **`repo`** (all sub-items)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token instead of your password when pushing

---

## 📝 Updating README for GitHub

Replace the placeholder README with the GitHub version:

```powershell
Remove-Item README.md -Force
Rename-Item README_GITHUB.md README.md
git add README.md
git commit -m "Update README for GitHub"
git push
```

---

## 🚀 Optional: Deploy to Vercel

After pushing to GitHub:

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your `land-classification` repository
4. **Add Environment Variables:**
   - `GEE_SERVICE_ACCOUNT_EMAIL`
   - `GEE_PRIVATE_KEY`
   - `GEE_PROJECT_ID`
5. Click **"Deploy"**
6. Your app will be live in ~2 minutes!

---

## 📋 Quick Command Summary

```powershell
# Initialize and commit
git init
git add .
git commit -m "Initial commit: Land Classification & Carbon Credit Analyzer"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/land-classification.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## ✅ Verification Checklist

- [ ] .gitignore includes `.env*` and `service-account-key.json`
- [ ] No sensitive data in committed files
- [ ] README.md is comprehensive
- [ ] LICENSE file is present
- [ ] Repository is created on GitHub
- [ ] Code is pushed successfully
- [ ] Repository is visible on GitHub

---

## 🔄 Future Updates

When making changes:

```powershell
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Description of your changes"

# Push to GitHub
git push
```

---

## 🆘 Troubleshooting

### Error: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/land-classification.git
```

### Error: "failed to push some refs"

```powershell
git pull origin main --rebase
git push
```

### Error: "Authentication failed"

Use a Personal Access Token instead of your password (see section above).

---

## 📧 Need Help?

If you encounter issues:
1. Check [GitHub Docs](https://docs.github.com)
2. Search on [Stack Overflow](https://stackoverflow.com)
3. Ask in [GitHub Community](https://github.community)

---

Good luck with your project! 🎉
