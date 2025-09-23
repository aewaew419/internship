#!/usr/bin/env node

/**
 * 🔒 CSS Style Guard
 * ==================
 * This script monitors and protects CSS styles from unauthorized modifications.
 * It runs as part of the build process and git hooks.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const styleLockConfig = require('../src/styles/style-lock.config.js');

class StyleGuard {
  constructor() {
    this.config = styleLockConfig;
    this.checksumFile = path.join(__dirname, '../.style-checksums.json');
    this.violations = [];
  }

  /**
   * Generate checksum for a file
   */
  generateChecksum(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`);
      return null;
    }
  }

  /**
   * Load existing checksums
   */
  loadChecksums() {
    try {
      if (fs.existsSync(this.checksumFile)) {
        return JSON.parse(fs.readFileSync(this.checksumFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not load existing checksums');
    }
    return {};
  }

  /**
   * Save checksums
   */
  saveChecksums(checksums) {
    try {
      fs.writeFileSync(this.checksumFile, JSON.stringify(checksums, null, 2));
    } catch (error) {
      console.error('❌ Could not save checksums:', error.message);
    }
  }

  /**
   * Initialize checksums for protected files
   */
  initializeChecksums() {
    console.log('🔒 Initializing CSS Style Guard...');
    
    const checksums = {};
    const protectedFiles = this.config.protectedFiles;

    protectedFiles.forEach(filePath => {
      const fullPath = path.join(__dirname, '../', filePath);
      const checksum = this.generateChecksum(fullPath);
      
      if (checksum) {
        checksums[filePath] = {
          checksum,
          lastModified: new Date().toISOString(),
          protected: true
        };
        console.log(`✅ Protected: ${filePath}`);
      }
    });

    this.saveChecksums(checksums);
    console.log(`🔒 Protected ${Object.keys(checksums).length} CSS files`);
  }

  /**
   * Check for unauthorized modifications
   */
  checkModifications() {
    console.log('🔍 Checking for unauthorized CSS modifications...');
    
    const existingChecksums = this.loadChecksums();
    const currentChecksums = {};
    let modificationsFound = false;

    this.config.protectedFiles.forEach(filePath => {
      const fullPath = path.join(__dirname, '../', filePath);
      const currentChecksum = this.generateChecksum(fullPath);
      
      if (!currentChecksum) return;

      currentChecksums[filePath] = {
        checksum: currentChecksum,
        lastModified: new Date().toISOString(),
        protected: true
      };

      // Check if file was modified
      if (existingChecksums[filePath]) {
        if (existingChecksums[filePath].checksum !== currentChecksum) {
          this.violations.push({
            type: 'UNAUTHORIZED_MODIFICATION',
            file: filePath,
            message: `Protected CSS file was modified without approval`
          });
          modificationsFound = true;
          console.log(`❌ VIOLATION: ${filePath} was modified`);
        }
      }
    });

    if (!modificationsFound) {
      console.log('✅ No unauthorized modifications detected');
    }

    return !modificationsFound;
  }

  /**
   * Analyze CSS content for protected selectors
   */
  analyzeContent(filePath, content) {
    const violations = [];
    
    this.config.protectedSelectors.forEach(selector => {
      // Simple regex check for protected selectors
      const regex = new RegExp(selector.replace('*', '\\w+'), 'g');
      if (regex.test(content)) {
        violations.push({
          type: 'PROTECTED_SELECTOR_USAGE',
          file: filePath,
          selector: selector,
          message: `Usage of protected selector: ${selector}`
        });
      }
    });

    return violations;
  }

  /**
   * Validate CSS files
   */
  validateFiles() {
    console.log('🔍 Validating CSS files...');
    
    const allCssFiles = this.findCssFiles();
    let isValid = true;

    allCssFiles.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const violations = this.analyzeContent(filePath, content);
        
        if (violations.length > 0) {
          this.violations.push(...violations);
          isValid = false;
        }
      } catch (error) {
        console.warn(`⚠️  Could not validate: ${filePath}`);
      }
    });

    return isValid;
  }

  /**
   * Find all CSS files in the project
   */
  findCssFiles() {
    const cssFiles = [];
    const srcDir = path.join(__dirname, '../src');
    
    const findFiles = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            findFiles(filePath);
          } else if (file.endsWith('.css')) {
            cssFiles.push(filePath);
          }
        });
      } catch (error) {
        // Ignore directories we can't read
      }
    };

    findFiles(srcDir);
    return cssFiles;
  }

  /**
   * Generate style report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      protectedFiles: this.config.protectedFiles.length,
      violations: this.violations,
      status: this.violations.length === 0 ? 'CLEAN' : 'VIOLATIONS_FOUND'
    };

    const reportPath = path.join(__dirname, '../.style-guard-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Display violations
   */
  displayViolations() {
    if (this.violations.length === 0) {
      console.log('✅ No style violations found');
      return;
    }

    console.log('\n❌ CSS Style Violations Found:');
    console.log('================================');
    
    this.violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.type}`);
      console.log(`   File: ${violation.file}`);
      console.log(`   Message: ${violation.message}`);
      if (violation.selector) {
        console.log(`   Selector: ${violation.selector}`);
      }
    });

    console.log('\n📝 To fix these violations:');
    console.log('- Use custom-styles.css for new styles');
    console.log('- Create component-specific CSS modules');
    console.log('- Get approval for protected style changes');
    console.log('- Follow the style guide documentation');
  }

  /**
   * Run full style guard check
   */
  run(command = 'check') {
    console.log('🔒 CSS Style Guard v1.0.0');
    console.log('==========================\n');

    switch (command) {
      case 'init':
        this.initializeChecksums();
        break;
        
      case 'check':
        const modificationsOk = this.checkModifications();
        const validationOk = this.validateFiles();
        
        this.displayViolations();
        const report = this.generateReport();
        
        if (!modificationsOk || !validationOk) {
          console.log('\n❌ Style guard check failed');
          process.exit(1);
        } else {
          console.log('\n✅ Style guard check passed');
        }
        break;
        
      case 'report':
        const reportData = this.generateReport();
        console.log('📊 Style Guard Report:');
        console.log(JSON.stringify(reportData, null, 2));
        break;
        
      default:
        console.log('Usage: node style-guard.js [init|check|report]');
        process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2] || 'check';
  const styleGuard = new StyleGuard();
  styleGuard.run(command);
}

module.exports = StyleGuard;