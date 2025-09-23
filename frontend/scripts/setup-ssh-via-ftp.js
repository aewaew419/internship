#!/usr/bin/env node

/**
 * Setup SSH Key via FTP
 * Upload SSH setup script via FTP and execute via SSH with password
 */

const fs = require('fs');
const { execSync } = require('child_process');

// FTP Configuration
const FTP_CONFIG = {
  server: 'rb-csl-4f15.hostatom.com',
  port: 21,
  user: 'v62882',
  pass: 'gWE9DqlnJLVdBn'
};

// VPS Configuration
const VPS_CONFIG = {
  host: '203.170.129.199',
  user: 'root',
  pass: 'rp4QkUUvmbi5qBIP',
  port: 22
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

// Create SSH setup script for VPS
function createSSHSetupScript() {
  logStep('SCRIPT', 'Creating SSH setup script...');
  
  // Read the public key
  const publicKeyPath = `${process.env.HOME}/.ssh/id_rsa.pub`;
  
  if (!fs.existsSync(publicKeyPath)) {
    logError('SSH public key not found. Please run: npm run setup:ssh first');
    process.exit(1);
  }
  
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();
  
  const setupScript = `#!/bin/bash

# SSH Key Setup Script for VPS
# This script sets up SSH key authentication

echo "🔐 Setting up SSH key authentication..."

# Create .ssh directory
mkdir -p ~/.ssh

# Add public key to authorized_keys
echo '${publicKey}' >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Remove duplicates (if any)
sort ~/.ssh/authorized_keys | uniq > ~/.ssh/authorized_keys.tmp
mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys

# Verify setup
echo ""
echo "✅ SSH key setup completed!"
echo "📋 Authorized keys:"
cat ~/.ssh/authorized_keys
echo ""
echo "🔧 Permissions:"
ls -la ~/.ssh/

# Test SSH service
echo ""
echo "🔍 SSH service status:"
systemctl status ssh || systemctl status sshd || echo "SSH service check failed"

echo ""
echo "✅ Setup completed successfully!"
echo "You can now connect without password using SSH key"
`;
  
  fs.writeFileSync('/tmp/setup-ssh-key.sh', setupScript);
  fs.chmodSync('/tmp/setup-ssh-key.sh', '755');
  
  logSuccess('SSH setup script created');
  return '/tmp/setup-ssh-key.sh';
}

// Create FTP upload script
function createFTPUploadScript(scriptPath) {
  logStep('FTP', 'Creating FTP upload script...');
  
  const ftpScript = `#!/bin/bash

# FTP Upload Script
echo "📤 Uploading SSH setup script via FTP..."

# Use lftp for better FTP handling
if ! command -v lftp &> /dev/null; then
    echo "Installing lftp..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install lftp || echo "Please install lftp: brew install lftp"
    else
        sudo apt-get update && sudo apt-get install -y lftp || echo "Please install lftp"
    fi
fi

# Upload file via FTP
lftp -c "
set ftp:ssl-allow no;
open -u ${FTP_CONFIG.user},${FTP_CONFIG.pass} ${FTP_CONFIG.server};
put ${scriptPath} -o setup-ssh-key.sh;
ls -la;
quit
"

echo "✅ File uploaded via FTP"
`;
  
  fs.writeFileSync('/tmp/ftp-upload.sh', ftpScript);
  fs.chmodSync('/tmp/ftp-upload.sh', '755');
  
  logSuccess('FTP upload script created');
  return '/tmp/ftp-upload.sh';
}

// Create password-based SSH execution script
function createSSHExecuteScript() {
  logStep('SSH', 'Creating SSH execution script...');
  
  const sshScript = `#!/bin/bash

# SSH Execute Script with Password
echo "🔑 Executing SSH setup on VPS..."

# Use sshpass for password authentication
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sshpass || echo "Please install sshpass: brew install sshpass"
    else
        sudo apt-get update && sudo apt-get install -y sshpass || echo "Please install sshpass"
    fi
fi

# Execute setup script on VPS
echo "Connecting to VPS and running setup..."
sshpass -p '${VPS_CONFIG.pass}' ssh -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} '
    # Download the script from FTP location or create it directly
    curl -o setup-ssh-key.sh ftp://${FTP_CONFIG.user}:${FTP_CONFIG.pass}@${FTP_CONFIG.server}/setup-ssh-key.sh 2>/dev/null || 
    wget ftp://${FTP_CONFIG.user}:${FTP_CONFIG.pass}@${FTP_CONFIG.server}/setup-ssh-key.sh 2>/dev/null ||
    echo "Could not download script, creating directly..."
    
    # If download failed, create script directly
    if [ ! -f setup-ssh-key.sh ]; then
        cat > setup-ssh-key.sh << '"'"'EOF'"'"'
#!/bin/bash
echo "🔐 Setting up SSH key authentication..."
mkdir -p ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDFDn20rUHFiJP1R/U2vVIbzmC0m1t5I53nAgk+FOQj1C+zn0SWW3Ks84KD6KzhyxitIhxrQkCBGwWp9mNBLbRU4tNcYncAqOmEhg7tG1q20MBK/lnsx1ozh0Hp9OT5yVyMd4x51Q1cl3hQrj5RwfvaqqaotAhck6Chf10eo0f2KV/NGPgBPjakuq8mQlZBXUs7Aa07Oa85BZkt9DZL64VuefE7DNeu8c5z4kKFsQK0eh5wxNx/Cx0jVoLFTXOUhfuaVfLY+8cFg3EtWzEVAAf1AGhu7uj9i8HM8EFwHe/foXuK6E2Plr+PFn77DdvIhLzNeJ5fWHXFSV+Q/RY0Mcq7es24hBQKcWj0+kedndK6+ufBrjlAaY/qnDi/0vf2KXNAauL2SVtOIRaWUyJN/7/qwXfUkJaH6wUJIYVmRV/70A4YMI+iY+J//6oppo/W5q/w5Kz3jKhExO2YvbKf0wHIjXGoEOVtoYyB/ljifw3Lj9G5C/Gsr77n1icX1Vwcr0omKDvXO5rCXZ5WSxX3bloOQpyf/3P0T1YWsWwqO+46HqlSqvaTMndFkDVI7dho5fMPGYcQpMaZciZ6gWyItjNk/3S42Bd/gDp1dfmdUTtyTqqo0sZGcQVxR+BpIuqFczzAB33SQswqg10PoRP6H9gWZl8SET0c4b2zxWGb8gN0IQ== deployment@Macbooks-MacBook-Pro.local" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
sort ~/.ssh/authorized_keys | uniq > ~/.ssh/authorized_keys.tmp
mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys
echo "✅ SSH key setup completed!"
EOF
    fi
    
    # Make executable and run
    chmod +x setup-ssh-key.sh
    ./setup-ssh-key.sh
'

echo "✅ SSH setup completed on VPS"
`;
  
  fs.writeFileSync('/tmp/ssh-execute.sh', sshScript);
  fs.chmodSync('/tmp/ssh-execute.sh', '755');
  
  logSuccess('SSH execution script created');
  return '/tmp/ssh-execute.sh';
}

// Test SSH connection after setup
function testSSHConnection() {
  logStep('TEST', 'Testing SSH key authentication...');
  
  try {
    const result = execSync(`ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host} "echo 'SSH key authentication successful'"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logSuccess('SSH key authentication is working!');
    log(result.trim(), 'green');
    return true;
  } catch (error) {
    logWarning('SSH key authentication not working yet');
    return false;
  }
}

// Main function
async function main() {
  log('🔐 Setting up SSH Key via FTP', 'bright');
  log('=' .repeat(50), 'blue');
  
  try {
    // Step 1: Create SSH setup script
    const scriptPath = createSSHSetupScript();
    
    // Step 2: Create and run FTP upload
    const ftpScript = createFTPUploadScript(scriptPath);
    
    // Step 3: Create SSH execution script
    const sshScript = createSSHExecuteScript();
    
    log('', 'reset');
    log('📋 Manual steps (choose one method):', 'bright');
    log('', 'reset');
    
    log('🔧 Method 1: Direct SSH with password', 'yellow');
    log('Run this command and enter password when prompted:', 'reset');
    log(`sshpass -p '${VPS_CONFIG.pass}' ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    log('Then run these commands on VPS:', 'reset');
    log('mkdir -p ~/.ssh', 'cyan');
    log(`echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDFDn20rUHFiJP1R/U2vVIbzmC0m1t5I53nAgk+FOQj1C+zn0SWW3Ks84KD6KzhyxitIhxrQkCBGwWp9mNBLbRU4tNcYncAqOmEhg7tG1q20MBK/lnsx1ozh0Hp9OT5yVyMd4x51Q1cl3hQrj5RwfvaqqaotAhck6Chf10eo0f2KV/NGPgBPjakuq8mQlZBXUs7Aa07Oa85BZkt9DZL64VuefE7DNeu8c5z4kKFsQK0eh5wxNx/Cx0jVoLFTXOUhfuaVfLY+8cFg3EtWzEVAAf1AGhu7uj9i8HM8EFwHe/foXuK6E2Plr+PFn77DdvIhLzNeJ5fWHXFSV+Q/RY0Mcq7es24hBQKcWj0+kedndK6+ufBrjlAaY/qnDi/0vf2KXNAauL2SVtOIRaWUyJN/7/qwXfUkJaH6wUJIYVmRV/70A4YMI+iY+J//6oppo/W5q/w5Kz3jKhExO2YvbKf0wHIjXGoEOVtoYyB/ljifw3Lj9G5C/Gsr77n1icX1Vwcr0omKDvXO5rCXZ5WSxX3bloOQpyf/3P0T1YWsWwqO+46HqlSqvaTMndFkDVI7dho5fMPGYcQpMaZciZ6gWyItjNk/3S42Bd/gDp1dfmdUTtyTqqo0sZGcQVxR+BpIuqFczzAB33SQswqg10PoRP6H9gWZl8SET0c4b2zxWGb8gN0IQ== deployment@Macbooks-MacBook-Pro.local' >> ~/.ssh/authorized_keys`, 'cyan');
    log('chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys', 'cyan');
    
    log('', 'reset');
    log('🔧 Method 2: Use FTP + SSH (if you have lftp and sshpass)', 'yellow');
    log('bash /tmp/ftp-upload.sh', 'cyan');
    log('bash /tmp/ssh-execute.sh', 'cyan');
    
    log('', 'reset');
    log('🔧 Method 3: Manual FTP upload', 'yellow');
    log('1. Use FTP client to connect:', 'reset');
    log(`   Server: ${FTP_CONFIG.server}`, 'cyan');
    log(`   User: ${FTP_CONFIG.user}`, 'cyan');
    log(`   Pass: ${FTP_CONFIG.pass}`, 'cyan');
    log('2. Upload the script: /tmp/setup-ssh-key.sh', 'cyan');
    log('3. SSH to VPS and run: bash setup-ssh-key.sh', 'cyan');
    
    log('', 'reset');
    log('🧪 After setup, test with:', 'bright');
    log(`ssh -p ${VPS_CONFIG.port} ${VPS_CONFIG.user}@${VPS_CONFIG.host}`, 'cyan');
    
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
  createSSHSetupScript,
  testSSHConnection,
  VPS_CONFIG,
  FTP_CONFIG
};