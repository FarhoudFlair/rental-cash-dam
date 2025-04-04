# Push to GitHub Instructions

Follow these steps to push your local Smith Manoeuvre - Rental Cash Damming Calculator repository to GitHub:

## 1. Create a new GitHub repository

1. Go to https://github.com/new
2. Enter a repository name (e.g., "SmithManeuver-Rental")
3. Add a description (optional)
4. Choose Public or Private visibility
5. Do NOT initialize with README, .gitignore, or license (since you already have files locally)
6. Click "Create repository"

## 2. Connect your local repository to GitHub

After creating the repository, GitHub will show you commands to use. You'll want to use the "push an existing repository" option.

Open a terminal in your project directory and run:

```bash
cd /mnt/e/MortgageCalculators/SmithManeuver-Rental
git remote add origin https://github.com/YOUR-USERNAME/SmithManeuver-Rental.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

## 3. You're done!

Your code is now on GitHub. You can access it from anywhere, share it with others, and continue development.

## Additional options

### Creating a GitHub Personal Access Token (if needed)

If you're using HTTPS instead of SSH, you might need a personal access token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Give it a descriptive name
4. Select the "repo" scope
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)
7. Use this token as your password when pushing to GitHub

### Setting up SSH (alternative to HTTPS)

For easier authentication, you might want to set up SSH:

1. Check if you have existing SSH keys: `ls -la ~/.ssh`
2. If needed, generate new SSH keys: `ssh-keygen -t ed25519 -C "your_email@example.com"`
3. Start the SSH agent: `eval "$(ssh-agent -s)"`
4. Add your SSH key: `ssh-add ~/.ssh/id_ed25519`
5. Copy your public key: `cat ~/.ssh/id_ed25519.pub`
6. Add this key to GitHub: GitHub → Settings → SSH and GPG keys → New SSH key