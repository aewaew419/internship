/**
 * Jest Results Processor
 * Custom processor for test results formatting and reporting
 */

module.exports = (results) => {
  // Log test summary
  console.log('\n📊 Test Results Summary:')
  console.log(`Total Tests: ${results.numTotalTests}`)
  console.log(`Passed: ${results.numPassedTests}`)
  console.log(`Failed: ${results.numFailedTests}`)
  console.log(`Skipped: ${results.numPendingTests}`)
  console.log(`Test Suites: ${results.numTotalTestSuites}`)
  
  // Calculate coverage summary if available
  if (results.coverageMap) {
    const coverage = results.coverageMap.getCoverageSummary()
    console.log('\n📈 Coverage Summary:')
    console.log(`Lines: ${coverage.lines.pct}%`)
    console.log(`Functions: ${coverage.functions.pct}%`)
    console.log(`Branches: ${coverage.branches.pct}%`)
    console.log(`Statements: ${coverage.statements.pct}%`)
  }
  
  // Log failed tests details
  if (results.numFailedTests > 0) {
    console.log('\n❌ Failed Tests:')
    results.testResults.forEach(testResult => {
      if (testResult.numFailingTests > 0) {
        console.log(`  ${testResult.testFilePath}`)
        testResult.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`    - ${test.title}`)
            if (test.failureMessages.length > 0) {
              console.log(`      ${test.failureMessages[0].split('\n')[0]}`)
            }
          }
        })
      }
    })
  }
  
  // Performance metrics
  const duration = results.testResults.reduce((total, result) => {
    return total + (result.perfStats?.end - result.perfStats?.start || 0)
  }, 0)
  
  console.log(`\n⏱️  Total execution time: ${duration}ms`)
  
  // Return results for further processing
  return results
}