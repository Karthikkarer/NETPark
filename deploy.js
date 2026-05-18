import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const run = (cmd, options = {}) => {
    try {
        return execSync(cmd, { stdio: 'inherit', ...options });
    } catch (e) {
        return null;
    }
};

console.log("\n==================================================");
2: console.log("🚀 NETPARK AUTONOMOUS GITHUB DEPLOYMENT PIPELINE");
3: console.log("==================================================\n");

// Check if Git is installed
let gitInstalled = false;
try {
    execSync('git --version', { stdio: 'ignore' });
    gitInstalled = true;
} catch (e) {
    gitInstalled = false;
}

if (!gitInstalled) {
    console.error("❌ Git command line utility is not installed or not in your system PATH.");
    console.log("Please install Git using one of these options:");
    console.log("1. Download Git for Windows: https://git-scm.com/download/win");
    console.log("2. Or install via Windows Terminal (Run as Admin): winget install --id Git.Git\n");
    console.log("After installing Git, restart your VS Code/Terminal and run this script again!\n");
    rl.close();
    process.exit(1);
}

console.log("✅ Git is installed on your system!");

// Check if .git exists, if not initialize
if (!fs.existsSync('.git')) {
    console.log("📦 Initializing local Git repository...");
    run('git init');
    run('git branch -M main');
}

// Stage files
console.log("📝 Staging files for deployment...");
run('git add .');

rl.question('🔑 Please enter your GitHub Personal Access Token (PAT): ', (token) => {
    if (!token || token.trim().length === 0) {
        console.error("❌ Token is required to authenticate with GitHub!");
        rl.close();
        process.exit(1);
    }

    const username = "Karthikkarer";
    const repoName = "NETPark";
    const remoteUrl = `https://${username}:${token.trim()}@github.com/${username}/${repoName}.git`;

    console.log(`\n🔗 Linking repository to https://github.com/${username}/${repoName}...`);
    
    // Remove existing origin if present
    try {
        execSync('git remote remove origin', { stdio: 'ignore' });
    } catch (e) {}

    try {
        run(`git remote add origin ${remoteUrl}`);
    } catch (e) {
        console.error("❌ Failed to link remote origin.");
        rl.close();
        process.exit(1);
    }

    console.log("💾 Committing files...");
    try {
        run('git commit -m "feat: deploy NETPark booking system with 3-day window limit and admin date logs"');
    } catch (e) {
        console.log("ℹ️ Nothing new to commit or branch already up to date.");
    }

    console.log("📤 Uploading codebase to GitHub...");
    try {
        run('git push -u origin main');
        console.log("\n==================================================");
        console.log("🎉 SUCCESS! Your NETPark project is now LIVE on GitHub!");
        console.log(`🔗 Repository link: https://github.com/${username}/${repoName}`);
        console.log("==================================================\n");
    } catch (e) {
        console.error("\n❌ Push failed. Please check if:");
        console.log("1. You created a repository named 'NETPark' on your GitHub account (https://github.com/new).");
        console.log("2. Your Personal Access Token has the 'repo' scope permission enabled.");
    }

    rl.close();
});
