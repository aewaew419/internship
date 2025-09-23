package tests

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestEnhancedCoverage tests enhanced coverage generation and reporting
func TestEnhancedCoverage(t *testing.T) {
	// Get the project root directory
	projectRoot, err := getProjectRoot()
	require.NoError(t, err)

	t.Run("Generate Enhanced Coverage Report", func(t *testing.T) {
		// Create coverage directory if it doesn't exist
		coverageDir := filepath.Join(projectRoot, "coverage")
		err := os.MkdirAll(coverageDir, 0755)
		require.NoError(t, err)

		// Run tests with coverage for specific packages
		packages := []string{
			"./internal/services",
			"./internal/handlers",
			"./internal/middleware",
			"./internal/models",
		}

		for _, pkg := range packages {
			t.Run("Coverage for "+pkg, func(t *testing.T) {
				packageName := strings.ReplaceAll(pkg, "./", "")
				packageName = strings.ReplaceAll(packageName, "/", "_")
				coverageFile := filepath.Join(coverageDir, packageName+"_coverage.out")

				// Skip if package doesn't exist
				if _, err := os.Stat(filepath.Join(projectRoot, strings.TrimPrefix(pkg, "./"))); os.IsNotExist(err) {
					t.Skipf("Package %s does not exist", pkg)
				}

				cmd := exec.Command("go", "test", "-coverprofile="+coverageFile, pkg)
				cmd.Dir = projectRoot
				
				output, err := cmd.CombinedOutput()
				if err != nil {
					t.Logf("Package %s test output: %s", pkg, string(output))
					// Don't fail the test if package has no tests yet
					if strings.Contains(string(output), "no test files") {
						t.Skipf("Package %s has no test files", pkg)
					}
				}

				// Check if coverage file was created
				if _, err := os.Stat(coverageFile); err == nil {
					// Get coverage percentage for this package
					cmd := exec.Command("go", "tool", "cover", "-func="+coverageFile)
					cmd.Dir = projectRoot
					
					output, err := cmd.CombinedOutput()
					if err == nil {
						outputStr := string(output)
						lines := strings.Split(outputStr, "\n")
						
						// Find the total coverage line
						for _, line := range lines {
							if strings.Contains(line, "total:") {
								t.Logf("Package %s coverage: %s", pkg, line)
								break
							}
						}
					}
				}
			})
		}
	})

	t.Run("Generate Comprehensive HTML Report", func(t *testing.T) {
		coverageDir := filepath.Join(projectRoot, "coverage")
		
		// Run all tests with coverage
		allCoverageFile := filepath.Join(coverageDir, "all_coverage.out")
		cmd := exec.Command("go", "test", "-coverprofile="+allCoverageFile, "./...")
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Logf("All tests output: %s", string(output))
		}

		// Generate HTML report if coverage file exists
		if _, err := os.Stat(allCoverageFile); err == nil {
			htmlFile := filepath.Join(coverageDir, "comprehensive_coverage.html")
			cmd := exec.Command("go", "tool", "cover", "-html="+allCoverageFile, "-o", htmlFile)
			cmd.Dir = projectRoot
			
			output, err := cmd.CombinedOutput()
			if err != nil {
				t.Logf("HTML generation output: %s", string(output))
			} else {
				// Check if HTML file was created
				_, err = os.Stat(htmlFile)
				assert.NoError(t, err, "HTML coverage report should be created")
				t.Logf("HTML coverage report generated: %s", htmlFile)
			}
		}
	})

	t.Run("Coverage Summary Report", func(t *testing.T) {
		coverageDir := filepath.Join(projectRoot, "coverage")
		allCoverageFile := filepath.Join(coverageDir, "all_coverage.out")

		// Check if coverage file exists
		if _, err := os.Stat(allCoverageFile); os.IsNotExist(err) {
			t.Skip("Coverage file not found, skipping summary")
		}

		// Get coverage summary
		cmd := exec.Command("go", "tool", "cover", "-func="+allCoverageFile)
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		require.NoError(t, err)

		outputStr := string(output)
		lines := strings.Split(outputStr, "\n")
		
		// Find the total coverage line and extract percentage
		for _, line := range lines {
			if strings.Contains(line, "total:") {
				t.Logf("Total coverage: %s", line)
				
				// Extract percentage
				parts := strings.Fields(line)
				for _, part := range parts {
					if strings.Contains(part, "%") {
						percentageStr := strings.TrimSuffix(part, "%")
						t.Logf("Coverage percentage: %s%%", percentageStr)
						break
					}
				}
				break
			}
		}
	})
}

// getProjectRoot finds the project root directory
func getProjectRoot() (string, error) {
	// Start from current directory and walk up to find go.mod
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", os.ErrNotExist
}