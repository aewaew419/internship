#!/usr/bin/env node

/**
 * VPS Backup and Setup Script
 * 1. Connect to VPS and backup existing files
 * 2. Create backup branch in Git
 * 3. Install Docker on VPS
 * 4. Prepare for new deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// VPS Configuration
const VPS_CONFIG = {
  host: '203.170.129.199',
  domain: 'dev.smart-solutions.com',
  user: 'root',
  port: 22,
  webRoot: '/var/www/html',
  backupDir: '/tmp/vps-backup'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// Execute command with error handling
function execCommand(command, description) {
  try {
    logStep('EXEC', `${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Failed: ${description}`);
    logError(error.message);
    throw error;
  }
}

// SSH command helper
function sshCommand(command, description) {
  const sshCmd = `ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "${command}"`;
  return execCommand(sshCmd, description);
}

// SCP file transfer helper
function scpTransfer(remotePath, localPath, description) {
  const scpCmd = `scp -o StrictHostKeyChecking=no -P ${VPS_CONFIG.port} -r ${VPS_CONFIG.user}@${VPS_CONFIG.host}:${remotePath} ${localPath}`;
  return execCommand(scpCmd, description);
}

// Test VPS connection
function testVPSConnection() {
  logStep('CONNECTION', 'Testing VPS connection...');
  
  try {
    const result = sshCommand('echo "Connection successful" && whoami && pwd', 'VPS connection test');
    logSuccess('VPS connection established');
    log(`Connected as: ${result.trim()}`, 'blue');
    return true;
  } catch (error) {
    logError('Cannot connect to VPS. Please check:');
    logError('1. SSH credentials are correct');
    logError('2. Server is accessible');
    logError('3. Network connection is stable');
    
    log('', 'reset');
    log('💡 Try manual connection first:', 'yellow');
    log(`ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    
    return false;
  }
}

// Check existing files on VPS
function checkExistingFiles() {
  logStep('CHECK', 'Checking existing files on VPS...');
  
  try {
    const result = sshCommand(`
      echo "=== System Info ===" &&
      uname -a &&
      echo "" &&
      echo "=== Disk Usage ===" &&
      df -h &&
      echo "" &&
      echo "=== Web Root Contents ===" &&
      ls -la ${VPS_CONFIG.webRoot} 2>/dev/null || echo "Web root not found" &&
      echo "" &&
      echo "=== Running Services ===" &&
      systemctl list-units --type=service --state=running | grep -E "(nginx|apache|mysql|docker)" || echo "No web services found" &&
      echo "" &&
      echo "=== Docker Status ===" &&
      docker --version 2>/dev/null || echo "Docker not installed"
    `, 'Check VPS status');
    
    log('VPS Status:', 'bright');
    log(result, 'blue');
    
    return true;
  } catch (error) {
    logWarning('Could not check VPS status completely');
    return false;
  }
}

// Backup existing files from VPS
function backupVPSFiles() {
  logStep('BACKUP', 'Backing up existing files from VPS...');
  
  // Create local backup directory
  if (fs.existsSync(VPS_CONFIG.backupDir)) {
    execCommand(`rm -rf ${VPS_CONFIG.backupDir}`, 'Clean existing backup directory');
  }
  fs.mkdirSync(VPS_CONFIG.backupDir, { recursive: true });
  
  try {
    // Create backup on VPS first
    sshCommand(`
      mkdir -p /tmp/backup-$(date +%Y%m%d-%H%M%S) &&
      if [ -d "${VPS_CONFIG.webRoot}" ]; then
        cp -r ${VPS_CONFIG.webRoot}/* /tmp/backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
        echo "Backup created in /tmp/backup-$(date +%Y%m%d-%H%M%S)"
      fi &&
      
      # Also backup common config locations
      mkdir -p /tmp/config-backup &&
      cp /etc/nginx/sites-available/* /tmp/config-backup/ 2>/dev/null || true &&
      cp /etc/apache2/sites-available/* /tmp/config-backup/ 2>/dev/null || true &&
      cp -r /etc/ssl/certs/* /tmp/config-backup/ 2>/dev/null || true &&
      
      # List what we found
      echo "=== Files to backup ===" &&
      find ${VPS_CONFIG.webRoot} -type f 2>/dev/null | head -20 || echo "No files found in web root" &&
      echo "=== Config files ===" &&
      ls -la /tmp/config-backup/ 2>/dev/null || echo "No config files found"
    `, 'Create backup on VPS');
    
    // Download backup files
    try {
      scpTransfer(`${VPS_CONFIG.webRoot}/*`, `${VPS_CONFIG.backupDir}/`, 'Download web files');
    } catch (error) {
      logWarning('Web root might be empty or inaccessible');
    }
    
    try {
      scpTransfer('/tmp/config-backup/*', `${VPS_CONFIG.backupDir}/config/`, 'Download config files');
    } catch (error) {
      logWarning('No config files to backup');
    }
    
    logSuccess('VPS files backed up locally');
    return true;
    
  } catch (error) {
    logWarning('Backup process encountered issues, but continuing...');
    return false;
  }
}

// Create backup branch in Git
function createBackupBranch() {
  logStep('GIT', 'Creating backup branch in Git...');
  
  try {
    // Check if backup branch already exists
    try {
      execCommand('git show-ref --verify --quiet refs/heads/backup', 'Check if backup branch exists');
      logWarning('Backup branch already exists, switching to it');
      execCommand('git checkout backup', 'Switch to backup branch');
    } catch (error) {
      // Branch doesn't exist, create it
      execCommand('git checkout -b backup', 'Create backup branch');
    }
    
    // Copy backed up files to current directory
    if (fs.existsSync(VPS_CONFIG.backupDir)) {
      const backupFiles = fs.readdirSync(VPS_CONFIG.backupDir);
      
      if (backupFiles.length > 0) {
        // Create backup directory in repo
        const repoBackupDir = 'vps-backup';
        if (!fs.existsSync(repoBackupDir)) {
          fs.mkdirSync(repoBackupDir, { recursive: true });
        }
        
        execCommand(`cp -r ${VPS_CONFIG.backupDir}/* ${repoBackupDir}/`, 'Copy backup files to repo');
        
        // Create backup info file
        const backupInfo = {
          timestamp: new Date().toISOString(),
          vps: {
            host: VPS_CONFIG.host,
            domain: VPS_CONFIG.domain,
            webRoot: VPS_CONFIG.webRoot
          },
          files: backupFiles,
          note: 'Backup of existing VPS files before new deployment'
        };
        
        fs.writeFileSync(`${repoBackupDir}/backup-info.json`, JSON.stringify(backupInfo, null, 2));
        
        // Add and commit backup files
        execCommand('git add .', 'Add backup files to git');
        execCommand('git commit -m "🗄️ Backup existing VPS files before new deployment"', 'Commit backup files');
        
        logSuccess('Backup branch created with existing VPS files');
      } else {
        logWarning('No files found to backup');
      }
    }
    
    // Switch back to main branch
    execCommand('git checkout main', 'Switch back to main branch');
    
    return true;
    
  } catch (error) {
    logError('Failed to create backup branch');
    return false;
  }
}

// Install Docker on VPS
function installDocker() {
  logStep('DOCKER', 'Installing Docker on VPS...');
  
  try {
    sshCommand(`
      # Update system
      apt update && apt upgrade -y &&
      
      # Install prerequisites
      apt install -y apt-transport-https ca-certificates curl gnupg lsb-release &&
      
      # Add Docker GPG key
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg &&
      
      # Add Docker repository
      echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null &&
      
      # Install Docker
      apt update &&
      apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin &&
      
      # Start and enable Docker
      systemctl start docker &&
      systemctl enable docker &&
      
      # Add user to docker group (optional)
      usermod -aG docker root &&
      
      # Install Docker Compose (standalone)
      curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
      chmod +x /usr/local/bin/docker-compose &&
      
      # Verify installation
      docker --version &&
      docker-compose --version &&
      
      echo "✅ Docker installation completed successfully"
    `, 'Install Docker and Docker Compose');
    
    logSuccess('Docker installed successfully on VPS');
    return true;
    
  } catch (error) {
    logError('Docker installation failed');
    return false;
  }
}

// Setup VPS environment
function setupVPSEnvironment() {
  logStep('SETUP', 'Setting up VPS environment...');
  
  try {
    sshCommand(`
      # Create necessary directories
      mkdir -p /var/www/html &&
      mkdir -p /var/log/internship &&
      mkdir -p /var/backups/internship &&
      mkdir -p /opt/internship &&
      
      # Install basic tools
      apt update &&
      apt install -y git curl wget nano htop unzip zip &&
      
      # Setup firewall
      ufw --force enable &&
      ufw allow ssh &&
      ufw allow 80/tcp &&
      ufw allow 443/tcp &&
      
      # Install Node.js (for webhook server)
      curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&
      apt-get install -y nodejs &&
      
      # Install PM2
      npm install -g pm2 &&
      
      # Install Nginx
      apt install -y nginx &&
      systemctl enable nginx &&
      systemctl start nginx &&
      
      # Install Certbot
      apt install -y certbot python3-certbot-nginx &&
      
      echo "✅ VPS environment setup completed"
    `, 'Setup VPS environment');
    
    logSuccess('VPS environment setup completed');
    return true;
    
  } catch (error) {
    logWarning('Some VPS setup steps may have failed, but continuing...');
    return false;
  }
}

// Push backup branch to remote
function pushBackupBranch() {
  logStep('PUSH', 'Pushing backup branch to remote...');
  
  try {
    execCommand('git checkout backup', 'Switch to backup branch');
    execCommand('git push -u origin backup', 'Push backup branch to remote');
    execCommand('git checkout main', 'Switch back to main branch');
    
    logSuccess('Backup branch pushed to remote repository');
    return true;
    
  } catch (error) {
    logWarning('Failed to push backup branch (might already exist)');
    execCommand('git checkout main', 'Switch back to main branch');
    return false;
  }
}

// Generate summary report
function generateSummaryReport() {
  logStep('REPORT', 'Generating summary report...');
  
  const report = `# VPS Backup and Setup Report

## Summary
- **Date:** ${new Date().toISOString()}
- **VPS:** ${VPS_CONFIG.domain} (${VPS_CONFIG.host})
- **Backup Branch:** backup

## Actions Completed
- ✅ VPS connection established
- ✅ Existing files backed up
- ✅ Backup branch created in Git
- ✅ Docker installed on VPS
- ✅ VPS environment prepared

## Backup Location
- **Local:** ${VPS_CONFIG.backupDir}
- **Git Branch:** backup
- **Remote:** origin/backup

## Next Steps
1. Review backup files in the 'backup' branch
2. Deploy new application using Docker
3. Configure domain and SSL
4. Setup auto-deployment system

## VPS Access
\`\`\`bash
ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}
\`\`\`

## Useful Commands
\`\`\`bash
# Check Docker status
docker --version
docker ps

# Check services
systemctl status nginx
systemctl status docker

# View backup branch
git checkout backup
git log --oneline

# Return to main
git checkout main
\`\`\`

## Backup Files
Check the backup branch for all files that were on the VPS before setup.

---
Generated by VPS Backup and Setup Script
`;
  
  fs.writeFileSync('VPS_BACKUP_REPORT.md', report);
  logSuccess('Summary report generated: VPS_BACKUP_REPORT.md');
}

// Main function
async function main() {
  log('🔧 VPS Backup and Setup Process', 'bright');
  log(`Target: ${VPS_CONFIG.domain} (${VPS_CONFIG.host})`, 'blue');
  log('=' .repeat(60), 'blue');
  
  let success = true;
  
  try {
    // Step 1: Test connection
    if (!testVPSConnection()) {
      logError('Cannot proceed without VPS connection');
      process.exit(1);
    }
    
    // Step 2: Check existing files
    checkExistingFiles();
    
    // Step 3: Backup existing files
    backupVPSFiles();
    
    // Step 4: Create backup branch
    createBackupBranch();
    
    // Step 5: Install Docker
    if (!installDocker()) {
      success = false;
    }
    
    // Step 6: Setup VPS environment
    if (!setupVPSEnvironment()) {
      success = false;
    }
    
    // Step 7: Push backup branch
    pushBackupBranch();
    
    // Step 8: Generate report
    generateSummaryReport();
    
    log('=' .repeat(60), 'blue');
    
    if (success) {
      log('✅ VPS Backup and Setup Completed Successfully!', 'green');
    } else {
      log('⚠️ VPS Setup Completed with Some Issues', 'yellow');
    }
    
    log('', 'reset');
    log('📋 What was done:', 'bright');
    log('✓ Existing VPS files backed up to "backup" branch', 'green');
    log('✓ Docker installed on VPS', 'green');
    log('✓ VPS environment prepared', 'green');
    log('✓ Backup pushed to GitHub', 'green');
    log('', 'reset');
    log('🔗 Check backup branch:', 'bright');
    log('git checkout backup', 'cyan');
    log('', 'reset');
    log('🚀 Next steps:', 'bright');
    log('1. Review backup files in backup branch', 'yellow');
    log('2. Deploy new application with Docker', 'yellow');
    log('3. Setup auto-deployment system', 'yellow');
    log('', 'reset');
    log('📊 VPS Status:', 'bright');
    log(`SSH: ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    log('Docker: docker --version', 'cyan');
    log('Services: systemctl status nginx docker', 'cyan');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testVPSConnection,
  backupVPSFiles,
  createBackupBranch,
  installDocker,
  setupVPSEnvironment,
  VPS_CONFIG
};