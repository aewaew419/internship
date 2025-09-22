const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Size Analysis for Mobile Networks
 * Analyzes Next.js build output and provides mobile-specific recommendations
 */

const MOBILE_THRESHOLDS = {
  // Bundle size thresholds for mobile networks (in KB)
  TOTAL_JS: 250,      // Total JavaScript bundle size
  MAIN_JS: 150,       // Main bundle size
  CHUNK_JS: 50,       // Individual chunk size
  CSS: 50,            // CSS bundle size
  FIRST_LOAD: 200,    // First load JS shared by all pages
  
  // Performance budgets for mobile
  GZIP_RATIO: 0.3,    // Expected gzip compression ratio
  PARSE_TIME: 100,    // JS parse time on mobile (ms per KB)
};

const NETWORK_SPEEDS = {
  '2G': { speed: 56, name: 'Slow 2G' },
  '3G': { speed: 384, name: 'Regular 3G' },
  '4G': { speed: 1500, name: 'Fast 4G' },
  'WIFI': { speed: 10000, name: 'WiFi' }
};

function getBuildStats() {
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found. Please run "npm run build" first.');
  }
  
  // Read Next.js build manifest
  const buildManifestPath = path.join(buildDir, 'build-manifest.json');
  const pagesManifestPath = path.join(buildDir, 'server/pages-manifest.json');
  
  let buildManifest = {};
  let pagesManifest = {};
  
  try {
    if (fs.existsSync(buildManifestPath)) {
      buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    }
    if (fs.existsSync(pagesManifestPath)) {
      pagesManifest = JSON.parse(fs.readFileSync(pagesManifestPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Warning: Could not read build manifests:', error.message);
  }
  
  // Analyze static files
  const staticDir = path.join(buildDir, 'static');
  const stats = {
    pages: {},
    chunks: {},
    css: {},
    total: { js: 0, css: 0, count: 0 }
  };
  
  function analyzeDirectory(dir, type = 'js') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      if (file.isDirectory()) {
        analyzeDirectory(path.join(dir, file.name), type);
      } else if (file.isFile()) {
        const filePath = path.join(dir, file.name);
        const fileStats = fs.statSync(filePath);
        const sizeKB = Math.round(fileStats.size / 1024 * 100) / 100;
        
        if (file.name.endsWith('.js')) {
          stats.total.js += sizeKB;
          stats.total.count++;
          
          if (file.name.includes('pages/')) {
            stats.pages[file.name] = sizeKB;
          } else {
            stats.chunks[file.name] = sizeKB;
          }
        } else if (file.name.endsWith('.css')) {
          stats.total.css += sizeKB;
          stats.css[file.name] = sizeKB;
        }
      }
    });
  }
  
  analyzeDirectory(staticDir);
  
  return stats;
}

function calculateLoadTimes(sizeKB) {
  const times = {};
  
  Object.entries(NETWORK_SPEEDS).forEach(([key, { speed, name }]) => {
    // Convert KB to bits, then calculate time in seconds
    const timeSec = (sizeKB * 8) / speed;
    times[key] = {
      name,
      time: Math.round(timeSec * 100) / 100,
      timeMs: Math.round(timeSec * 1000)
    };
  });
  
  return times;
}

function estimateParseTime(jsSize) {
  // Estimate JS parse time on mobile devices
  // Based on research: ~1ms per KB on average mobile device
  return Math.round(jsSize * MOBILE_THRESHOLDS.PARSE_TIME / 100);
}

function analyzeBundle(stats) {
  const analysis = {
    summary: {
      totalJS: Math.round(stats.total.js * 100) / 100,
      totalCSS: Math.round(stats.total.css * 100) / 100,
      fileCount: stats.total.count,
      estimatedGzipJS: Math.round(stats.total.js * MOBILE_THRESHOLDS.GZIP_RATIO * 100) / 100,
      estimatedGzipCSS: Math.round(stats.total.css * MOBILE_THRESHOLDS.GZIP_RATIO * 100) / 100
    },
    performance: {
      loadTimes: calculateLoadTimes(stats.total.js + stats.total.css),
      parseTime: estimateParseTime(stats.total.js),
      firstLoadJS: 0 // Will be calculated from largest chunks
    },
    issues: [],
    recommendations: []
  };
  
  // Calculate first load JS (main bundle + largest chunks)
  const sortedChunks = Object.entries(stats.chunks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3); // Top 3 chunks likely to be in first load
  
  analysis.performance.firstLoadJS = sortedChunks.reduce((sum, [, size]) => sum + size, 0);
  
  // Analyze against thresholds
  if (analysis.summary.totalJS > MOBILE_THRESHOLDS.TOTAL_JS) {
    analysis.issues.push({
      type: 'BUNDLE_SIZE',
      severity: 'HIGH',
      message: `Total JS bundle (${analysis.summary.totalJS}KB) exceeds mobile threshold (${MOBILE_THRESHOLDS.TOTAL_JS}KB)`,
      impact: 'Slow loading on mobile networks'
    });
  }
  
  if (analysis.performance.firstLoadJS > MOBILE_THRESHOLDS.FIRST_LOAD) {
    analysis.issues.push({
      type: 'FIRST_LOAD',
      severity: 'HIGH',
      message: `First load JS (${Math.round(analysis.performance.firstLoadJS)}KB) exceeds threshold (${MOBILE_THRESHOLDS.FIRST_LOAD}KB)`,
      impact: 'Poor initial page load performance'
    });
  }
  
  if (analysis.summary.totalCSS > MOBILE_THRESHOLDS.CSS) {
    analysis.issues.push({
      type: 'CSS_SIZE',
      severity: 'MEDIUM',
      message: `CSS bundle (${analysis.summary.totalCSS}KB) exceeds mobile threshold (${MOBILE_THRESHOLDS.CSS}KB)`,
      impact: 'Render blocking on mobile'
    });
  }
  
  // Check individual chunks
  Object.entries(stats.chunks).forEach(([filename, size]) => {
    if (size > MOBILE_THRESHOLDS.CHUNK_JS) {
      analysis.issues.push({
        type: 'LARGE_CHUNK',
        severity: 'MEDIUM',
        message: `Chunk ${filename} (${size}KB) exceeds threshold (${MOBILE_THRESHOLDS.CHUNK_JS}KB)`,
        impact: 'Potential loading bottleneck'
      });
    }
  });
  
  // Generate recommendations
  if (analysis.issues.length > 0) {
    analysis.recommendations.push(
      'Consider code splitting to reduce bundle sizes',
      'Implement dynamic imports for non-critical features',
      'Use Next.js built-in optimizations (next/dynamic)',
      'Analyze and remove unused dependencies',
      'Enable compression (gzip/brotli) on your server'
    );
    
    if (analysis.summary.totalJS > MOBILE_THRESHOLDS.TOTAL_JS * 1.5) {
      analysis.recommendations.push(
        'Bundle size is significantly large - consider major refactoring',
        'Implement lazy loading for heavy components',
        'Use tree shaking to eliminate dead code'
      );
    }
  }
  
  return analysis;
}

function printBundleReport(stats, analysis) {
  console.log('\n📦 Bundle Size Analysis for Mobile Networks');
  console.log('=' .repeat(60));
  
  // Summary
  console.log('\n📊 Bundle Summary:');
  console.log(`  JavaScript: ${analysis.summary.totalJS}KB (gzipped: ~${analysis.summary.estimatedGzipJS}KB)`);
  console.log(`  CSS: ${analysis.summary.totalCSS}KB (gzipped: ~${analysis.summary.estimatedGzipCSS}KB)`);
  console.log(`  Total Files: ${analysis.summary.fileCount}`);
  console.log(`  First Load JS: ~${Math.round(analysis.performance.firstLoadJS)}KB`);
  
  // Performance Impact
  console.log('\n⏱️  Load Time Estimates:');
  Object.entries(analysis.performance.loadTimes).forEach(([key, { name, time, timeMs }]) => {
    const status = timeMs > 3000 ? '❌' : timeMs > 1000 ? '⚠️' : '✅';
    console.log(`  ${status} ${name}: ${time}s (${timeMs}ms)`);
  });
  
  console.log(`\n🧠 Estimated Parse Time: ${analysis.performance.parseTime}ms`);
  
  // Issues
  if (analysis.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    analysis.issues.forEach(issue => {
      const icon = issue.severity === 'HIGH' ? '🔴' : '🟡';
      console.log(`  ${icon} ${issue.message}`);
      console.log(`     Impact: ${issue.impact}`);
    });
  }
  
  // Top chunks
  console.log('\n📁 Largest Chunks:');
  const sortedChunks = Object.entries(stats.chunks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  sortedChunks.forEach(([filename, size]) => {
    const status = size > MOBILE_THRESHOLDS.CHUNK_JS ? '❌' : '✅';
    console.log(`  ${status} ${filename}: ${size}KB`);
  });
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Overall status
  const criticalIssues = analysis.issues.filter(i => i.severity === 'HIGH').length;
  if (criticalIssues > 0) {
    console.log(`❌ Bundle analysis failed: ${criticalIssues} critical issues found`);
    return false;
  } else if (analysis.issues.length > 0) {
    console.log(`⚠️  Bundle analysis passed with warnings: ${analysis.issues.length} issues found`);
    return true;
  } else {
    console.log('✅ Bundle analysis passed: Optimized for mobile networks');
    return true;
  }
}

function generateBundleReport() {
  try {
    console.log('📦 Analyzing bundle for mobile optimization...');
    
    const stats = getBuildStats();
    const analysis = analyzeBundle(stats);
    const passed = printBundleReport(stats, analysis);
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      analysis
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return passed;
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  const success = generateBundleReport();
  process.exit(success ? 0 : 1);
}

module.exports = { getBuildStats, analyzeBundle, generateBundleReport };