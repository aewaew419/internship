#!/usr/bin/env node

/**
 * Deployment script for production environments
 * Supports multiple deployment targets (Vercel, Netlify, Docker, etc.)
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DeploymentManager {
  constructor() {
    this.deploymentTarget = process.env.DEPLOYMENT_TARGET || 'vercel';
    this.environment = process.env.DEPLOY_ENV || 'production';
    this.projectRoot = process.cwd();
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if build exists
    const buildPath = path.join(this.projectRoot, '.next');
    try {
      await fs.access(buildPath);
      console.log('✅ Build directory found');
    } catch (error) {
      console.error('❌ Build directory not found. Run build first.');
      process.exit(1);
    }

    // Check environment variables
    const requiredVars = this.getRequiredEnvVars();
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables for deployment:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    // Check deployment target configuration
    await this.validateDeploymentTarget();
    
    console.log('✅ Pre-deployment checks passed');
  }

  getRequiredEnvVars() {
    const baseVars = [
      'NEXT_PUBLIC_API_BASE_URL',
      'NEXT_PUBLIC_APP_ENV'
    ];

    switch (this.deploymentTarget) {
      case 'vercel':
        return [...baseVars, 'VERCEL_TOKEN'];
      case 'netlify':
        return [...baseVars, 'NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'];
      case 'docker':
        return [...baseVars, 'DOCKER_REGISTRY'];
      case 'aws':
        return [...baseVars, 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
      default:
        return baseVars;
    }
  }

  async validateDeploymentTarget() {
    console.log(`🎯 Validating deployment target: ${this.deploymentTarget}`);
    
    switch (this.deploymentTarget) {
      case 'vercel':
        await this.validateVercelConfig();
        break;
      case 'netlify':
        await this.validateNetlifyConfig();
        break;
      case 'docker':
        await this.validateDockerConfig();
        break;
      case 'aws':
        await this.validateAWSConfig();
        break;
      default:
        console.warn(`⚠️ Unknown deployment target: ${this.deploymentTarget}`);
    }
  }

  async validateVercelConfig() {
    try {
      // Check if Vercel CLI is installed
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI found');
      
      // Check if vercel.json exists
      try {
        await fs.access(path.join(this.projectRoot, 'vercel.json'));
        console.log('✅ vercel.json configuration found');
      } catch (error) {
        console.log('ℹ️ No vercel.json found, using default configuration');
      }
    } catch (error) {
      console.error('❌ Vercel CLI not found. Install with: npm i -g vercel');
      process.exit(1);
    }
  }

  async validateNetlifyConfig() {
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI found');
      
      try {
        await fs.access(path.join(this.projectRoot, 'netlify.toml'));
        console.log('✅ netlify.toml configuration found');
      } catch (error) {
        console.log('ℹ️ No netlify.toml found, using default configuration');
      }
    } catch (error) {
      console.error('❌ Netlify CLI not found. Install with: npm i -g netlify-cli');
      process.exit(1);
    }
  }

  async validateDockerConfig() {
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker found');
      
      const dockerfilePath = path.join(this.projectRoot, 'Dockerfile');
      try {
        await fs.access(dockerfilePath);
        console.log('✅ Dockerfile found');
      } catch (error) {
        console.error('❌ Dockerfile not found');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Docker not found. Please install Docker');
      process.exit(1);
    }
  }

  async validateAWSConfig() {
    try {
      execSync('aws --version', { stdio: 'pipe' });
      console.log('✅ AWS CLI found');
    } catch (error) {
      console.error('❌ AWS CLI not found. Please install AWS CLI');
      process.exit(1);
    }
  }

  async createDeploymentArtifacts() {
    console.log('📦 Creating deployment artifacts...');
    
    // Create deployment info file
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      target: this.deploymentTarget,
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      version: this.getPackageVersion(),
      buildId: await this.getBuildId()
    };

    const deploymentInfoPath = path.join(this.projectRoot, 'public', 'deployment-info.json');
    await fs.writeFile(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('✅ Deployment artifacts created');
    return deploymentInfo;
  }

  async deploy() {
    console.log(`🚀 Deploying to ${this.deploymentTarget}...`);
    
    switch (this.deploymentTarget) {
      case 'vercel':
        return await this.deployToVercel();
      case 'netlify':
        return await this.deployToNetlify();
      case 'docker':
        return await this.deployToDocker();
      case 'aws':
        return await this.deployToAWS();
      default:
        throw new Error(`Unsupported deployment target: ${this.deploymentTarget}`);
    }
  }

  async deployToVercel() {
    console.log('📤 Deploying to Vercel...');
    
    try {
      const deployCommand = this.environment === 'production' 
        ? 'vercel --prod --yes'
        : 'vercel --yes';
      
      const output = execSync(deployCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : 'Unknown';
      
      console.log('✅ Deployed to Vercel successfully');
      console.log(`🌐 Deployment URL: ${deploymentUrl}`);
      
      return { success: true, url: deploymentUrl };
    } catch (error) {
      console.error('❌ Vercel deployment failed:', error.message);
      throw error;
    }
  }

  async deployToNetlify() {
    console.log('📤 Deploying to Netlify...');
    
    try {
      const deployCommand = this.environment === 'production'
        ? 'netlify deploy --prod --dir=.next'
        : 'netlify deploy --dir=.next';
      
      const output = execSync(deployCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : 'Unknown';
      
      console.log('✅ Deployed to Netlify successfully');
      console.log(`🌐 Deployment URL: ${deploymentUrl}`);
      
      return { success: true, url: deploymentUrl };
    } catch (error) {
      console.error('❌ Netlify deployment failed:', error.message);
      throw error;
    }
  }

  async deployToDocker() {
    console.log('📤 Building and deploying Docker image...');
    
    try {
      const imageName = `${process.env.DOCKER_REGISTRY || 'internship-app'}:${this.getPackageVersion()}`;
      
      // Build Docker image
      execSync(`docker build -t ${imageName} .`, { stdio: 'inherit' });
      console.log(`✅ Docker image built: ${imageName}`);
      
      // Push to registry if configured
      if (process.env.DOCKER_REGISTRY) {
        execSync(`docker push ${imageName}`, { stdio: 'inherit' });
        console.log(`✅ Docker image pushed to registry`);
      }
      
      return { success: true, image: imageName };
    } catch (error) {
      console.error('❌ Docker deployment failed:', error.message);
      throw error;
    }
  }

  async deployToAWS() {
    console.log('📤 Deploying to AWS...');
    
    try {
      // This is a simplified AWS deployment
      // In practice, you'd use AWS CDK, CloudFormation, or specific services
      
      const bucketName = process.env.AWS_S3_BUCKET;
      if (bucketName) {
        // Deploy static files to S3
        execSync(`aws s3 sync .next/static s3://${bucketName}/static --delete`, { stdio: 'inherit' });
        console.log('✅ Static files deployed to S3');
      }
      
      return { success: true, bucket: bucketName };
    } catch (error) {
      console.error('❌ AWS deployment failed:', error.message);
      throw error;
    }
  }

  async postDeploymentTasks(deploymentResult) {
    console.log('🔧 Running post-deployment tasks...');
    
    // Health check
    if (deploymentResult.url) {
      await this.performHealthCheck(deploymentResult.url);
    }
    
    // Clear CDN cache if configured
    if (process.env.CDN_CACHE_CLEAR_URL) {
      await this.clearCDNCache();
    }
    
    // Send deployment notification
    await this.sendDeploymentNotification(deploymentResult);
    
    console.log('✅ Post-deployment tasks completed');
  }

  async performHealthCheck(url) {
    console.log(`🏥 Performing health check on ${url}...`);
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ Health check passed');
      } else {
        console.warn(`⚠️ Health check returned status: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Health check failed:', error.message);
    }
  }

  async clearCDNCache() {
    console.log('🗑️ Clearing CDN cache...');
    
    try {
      // This would depend on your CDN provider (CloudFlare, AWS CloudFront, etc.)
      console.log('ℹ️ CDN cache clearing not implemented');
    } catch (error) {
      console.warn('⚠️ Failed to clear CDN cache:', error.message);
    }
  }

  async sendDeploymentNotification(deploymentResult) {
    console.log('📢 Sending deployment notification...');
    
    const notification = {
      environment: this.environment,
      target: this.deploymentTarget,
      success: deploymentResult.success,
      url: deploymentResult.url,
      timestamp: new Date().toISOString(),
      commit: this.getGitCommit(),
      branch: this.getGitBranch()
    };
    
    // Here you would integrate with your notification system
    // (Slack, Discord, email, etc.)
    console.log('ℹ️ Deployment notification:', JSON.stringify(notification, null, 2));
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getPackageVersion() {
    try {
      const packageJson = require(path.join(this.projectRoot, 'package.json'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  async getBuildId() {
    try {
      const buildIdPath = path.join(this.projectRoot, '.next', 'BUILD_ID');
      return await fs.readFile(buildIdPath, 'utf8');
    } catch (error) {
      return 'unknown';
    }
  }

  async run() {
    try {
      console.log(`🚀 Starting deployment to ${this.deploymentTarget} (${this.environment})...\n`);
      
      await this.preDeploymentChecks();
      const deploymentInfo = await this.createDeploymentArtifacts();
      const deploymentResult = await this.deploy();
      await this.postDeploymentTasks(deploymentResult);
      
      console.log('\n🎉 Deployment completed successfully!');
      console.log('📊 Deployment Summary:');
      console.log(`   Target: ${this.deploymentTarget}`);
      console.log(`   Environment: ${this.environment}`);
      console.log(`   Version: ${deploymentInfo.version}`);
      console.log(`   Commit: ${deploymentInfo.gitCommit.substring(0, 8)}`);
      console.log(`   Branch: ${deploymentInfo.gitBranch}`);
      
      if (deploymentResult.url) {
        console.log(`   URL: ${deploymentResult.url}`);
      }
      
    } catch (error) {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new DeploymentManager();
  deployer.run();
}

module.exports = { DeploymentManager };