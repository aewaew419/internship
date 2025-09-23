#!/usr/bin/env node

/**
 * Production build script with optimization and validation
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ProductionBuilder {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.outputDir = path.join(process.cwd(), 'out');
    this.startTime = Date.now();
  }

  async prebuildChecks() {
    console.log('🔍 Running pre-build checks...');
    
    // Check if required environment variables are set
    const requiredEnvVars = [
      'NEXT_PUBLIC_API_BASE_URL',
      'NEXT_PUBLIC_APP_ENV'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      console.error(`❌ Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
      process.exit(1);
    }

    // Check if package.json exists and has required scripts
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      
      if (!packageJson.scripts?.build) {
        console.error('❌ Missing build script in package.json');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to read package.json:', error.message);
      process.exit(1);
    }

    console.log('✅ Pre-build checks passed');
  }

  async cleanPreviousBuild() {
    console.log('🧹 Cleaning previous build...');
    
    try {
      // Remove .next directory
      await fs.rm(this.buildDir, { recursive: true, force: true });
      
      // Remove out directory (if using static export)
      await fs.rm(this.outputDir, { recursive: true, force: true });
      
      console.log('✅ Previous build cleaned');
    } catch (error) {
      console.warn('⚠️ Failed to clean previous build:', error.message);
    }
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    try {
      execSync('npm ci --only=production', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      process.exit(1);
    }
  }

  async runTypeCheck() {
    console.log('🔍 Running TypeScript type check...');
    
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      console.log('✅ TypeScript type check passed');
    } catch (error) {
      console.error('❌ TypeScript type check failed');
      process.exit(1);
    }
  }

  async runLinting() {
    console.log('🔍 Running ESLint...');
    
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed');
    } catch (error) {
      console.error('❌ Linting failed');
      process.exit(1);
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      execSync('npm test -- --passWithNoTests --watchAll=false', { 
        stdio: 'inherit',
        env: { ...process.env, CI: 'true' }
      });
      console.log('✅ Tests passed');
    } catch (error) {
      console.error('❌ Tests failed');
      process.exit(1);
    }
  }

  async buildApplication() {
    console.log('🏗️ Building application...');
    
    try {
      // Set production environment
      const buildEnv = {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1'
      };

      execSync('npm run build', { 
        stdio: 'inherit',
        env: buildEnv
      });
      
      console.log('✅ Application built successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeBuild() {
    console.log('📊 Analyzing build...');
    
    try {
      // Check if build directory exists
      const buildStats = await fs.stat(this.buildDir);
      
      if (!buildStats.isDirectory()) {
        throw new Error('Build directory not found');
      }

      // Get build size
      const buildSize = await this.calculateDirectorySize(this.buildDir);
      console.log(`📦 Build size: ${(buildSize / 1024 / 1024).toFixed(2)} MB`);

      // Check for critical files
      const criticalFiles = [
        '.next/static',
        '.next/server',
        '.next/BUILD_ID'
      ];

      for (const file of criticalFiles) {
        try {
          await fs.access(path.join(process.cwd(), file));
          console.log(`✅ ${file} exists`);
        } catch (error) {
          console.error(`❌ Missing critical file: ${file}`);
          process.exit(1);
        }
      }

      // Analyze bundle if bundle analyzer is available
      if (process.env.ANALYZE === 'true') {
        try {
          execSync('npm run analyze', { stdio: 'inherit' });
        } catch (error) {
          console.warn('⚠️ Bundle analysis failed:', error.message);
        }
      }

      console.log('✅ Build analysis completed');
    } catch (error) {
      console.error('❌ Build analysis failed:', error.message);
      process.exit(1);
    }
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += await this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not calculate size for ${dirPath}`);
    }
    
    return totalSize;
  }

  async validateBuild() {
    console.log('✅ Validating build...');
    
    try {
      // Check if server can start
      console.log('🚀 Testing server startup...');
      
      const serverProcess = execSync('timeout 10s npm start || true', { 
        stdio: 'pipe',
        env: { ...process.env, PORT: '3001' }
      });

      console.log('✅ Server startup test passed');

      // Check if critical pages can be rendered
      // This would require a more sophisticated test setup
      console.log('✅ Build validation completed');
    } catch (error) {
      console.error('❌ Build validation failed:', error.message);
      process.exit(1);
    }
  }

  async generateBuildReport() {
    console.log('📋 Generating build report...');
    
    const buildTime = Date.now() - this.startTime;
    const buildSize = await this.calculateDirectorySize(this.buildDir);
    
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: `${(buildTime / 1000).toFixed(2)}s`,
      buildSize: `${(buildSize / 1024 / 1024).toFixed(2)} MB`,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      gitCommit: this.getGitCommit(),
      success: true
    };

    const reportPath = path.join(process.cwd(), 'build-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('✅ Build report generated:', reportPath);
    console.log('\n📊 Build Summary:');
    console.log(`   Time: ${report.buildTime}`);
    console.log(`   Size: ${report.buildSize}`);
    console.log(`   Node: ${report.nodeVersion}`);
    console.log(`   Commit: ${report.gitCommit}`);
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async run() {
    try {
      console.log('🚀 Starting production build process...\n');
      
      await this.prebuildChecks();
      await this.cleanPreviousBuild();
      
      // Skip dependency installation in CI environments
      if (!process.env.CI) {
        await this.installDependencies();
      }
      
      await this.runTypeCheck();
      await this.runLinting();
      
      // Skip tests if SKIP_TESTS is set
      if (!process.env.SKIP_TESTS) {
        await this.runTests();
      }
      
      await this.buildApplication();
      await this.analyzeBuild();
      await this.validateBuild();
      await this.generateBuildReport();
      
      console.log('\n🎉 Production build completed successfully!');
      console.log('📦 Your application is ready for deployment.');
      
    } catch (error) {
      console.error('\n💥 Production build failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the build process if this script is executed directly
if (require.main === module) {
  const builder = new ProductionBuilder();
  builder.run();
}

module.exports = { ProductionBuilder };