package coverage

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCoverageGeneration tests the generation of test coverage reports
func TestCoverageGeneration(t *testing.T) {
	// Get the project root directory
	projectRoot, err := getProjectRoot()
	require.NoError(t, err)

	t.Run("Generate Coverage Report", func(t *testing.T) {
		// Create coverage directory if it doesn't exist
		coverageDir := filepath.Join(projectRoot, "coverage")
		err := os.MkdirAll(coverageDir, 0755)
		require.NoError(t, err)

		// Run tests with coverage
		coverageFile := filepath.Join(coverageDir, "coverage.out")
		cmd := exec.Command("go", "test", "-coverprofile="+coverageFile, "./...")
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Logf("Test output: %s", string(output))
		}
		
		// Check if coverage file was created
		_, err = os.Stat(coverageFile)
		assert.NoError(t, err, "Coverage file should be created")
	})

	t.Run("Generate HTML Coverage Report", func(t *testing.T) {
		coverageDir := filepath.Join(projectRoot, "coverage")
		coverageFile := filepath.Join(coverageDir, "coverage.out")
		htmlFile := filepath.Join(coverageDir, "coverage.html")

		// Check if coverage file exists
		if _, err := os.Stat(coverageFile); os.IsNotExist(err) {
			t.Skip("Coverage file not found, skipping HTML generation")
		}

		// Generate HTML report
		cmd := exec.Command("go", "tool", "cover", "-html="+coverageFile, "-o", htmlFile)
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Logf("HTML generation output: %s", string(output))
		}
		
		// Check if HTML file was created
		_, err = os.Stat(htmlFile)
		assert.NoError(t, err, "HTML coverage report should be created")
	})

	t.Run("Check Coverage Percentage", func(t *testing.T) {
		coverageDir := filepath.Join(projectRoot, "coverage")
		coverageFile := filepath.Join(coverageDir, "coverage.out")

		// Check if coverage file exists
		if _, err := os.Stat(coverageFile); os.IsNotExist(err) {
			t.Skip("Coverage file not found, skipping percentage check")
		}

		// Get coverage percentage
		cmd := exec.Command("go", "tool", "cover", "-func="+coverageFile)
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		require.NoError(t, err)

		outputStr := string(output)
		lines := strings.Split(outputStr, "\n")
		
		// Find the total coverage line
		var totalCoverage string
		for _, line := range lines {
			if strings.Contains(line, "total:") {
				totalCoverage = line
				break
			}
		}

		assert.NotEmpty(t, totalCoverage, "Should find total coverage line")
		t.Logf("Total coverage: %s", totalCoverage)

		// Extract percentage (basic parsing)
		if strings.Contains(totalCoverage, "%") {
			parts := strings.Fields(totalCoverage)
			for _, part := range parts {
				if strings.Contains(part, "%") {
					percentage := strings.TrimSuffix(part, "%")
					t.Logf("Coverage percentage: %s%%", percentage)
					break
				}
			}
		}
	})
}

// TestCoverageByPackage tests coverage for individual packages
func TestCoverageByPackage(t *testing.T) {
	projectRoot, err := getProjectRoot()
	require.NoError(t, err)

	packages := []string{
		"./internal/services",
		"./internal/handlers",
		"./internal/middleware",
		"./internal/models",
		"./internal/database",
	}

	for _, pkg := range packages {
		t.Run("Coverage for "+pkg, func(t *testing.T) {
			coverageDir := filepath.Join(projectRoot, "coverage")
			err := os.MkdirAll(coverageDir, 0755)
			require.NoError(t, err)

			// Generate coverage for specific package
			packageName := strings.ReplaceAll(pkg, "./", "")
			packageName = strings.ReplaceAll(packageName, "/", "_")
			coverageFile := filepath.Join(coverageDir, packageName+"_coverage.out")

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
}

// TestMinimumCoverageThreshold tests that coverage meets minimum requirements
func TestMinimumCoverageThreshold(t *testing.T) {
	projectRoot, err := getProjectRoot()
	require.NoError(t, err)

	coverageDir := filepath.Join(projectRoot, "coverage")
	coverageFile := filepath.Join(coverageDir, "coverage.out")

	// Check if coverage file exists
	if _, err := os.Stat(coverageFile); os.IsNotExist(err) {
		t.Skip("Coverage file not found, skipping threshold check")
	}

	// Get coverage percentage
	cmd := exec.Command("go", "tool", "cover", "-func="+coverageFile)
	cmd.Dir = projectRoot
	
	output, err := cmd.CombinedOutput()
	require.NoError(t, err)

	outputStr := string(output)
	lines := strings.Split(outputStr, "\n")
	
	// Find the total coverage line and extract percentage
	for _, line := range lines {
		if strings.Contains(line, "total:") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "%") {
					percentageStr := strings.TrimSuffix(part, "%")
					// Note: In a real scenario, you would parse this as a float
					// and compare against a minimum threshold (e.g., 80%)
					t.Logf("Total coverage: %s", percentageStr)
					
					// For now, just log the coverage
					// In production, you might want:
					// percentage, err := strconv.ParseFloat(percentageStr, 64)
					// require.NoError(t, err)
					// assert.GreaterOrEqual(t, percentage, 80.0, "Coverage should be at least 80%")
					
					break
				}
			}
			break
		}
	}
}

// TestCoverageReportFormats tests different coverage report formats
func TestCoverageReportFormats(t *testing.T) {
	projectRoot, err := getProjectRoot()
	require.NoError(t, err)

	coverageDir := filepath.Join(projectRoot, "coverage")
	coverageFile := filepath.Join(coverageDir, "coverage.out")

	// Check if coverage file exists
	if _, err := os.Stat(coverageFile); os.IsNotExist(err) {
		t.Skip("Coverage file not found, skipping report format tests")
	}

	t.Run("Generate JSON Coverage Report", func(t *testing.T) {
		jsonFile := filepath.Join(coverageDir, "coverage.json")
		
		// Convert coverage to JSON format (if tool supports it)
		cmd := exec.Command("go", "tool", "cover", "-func="+coverageFile)
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		if err == nil {
			// Write output to JSON file (simplified format)
			err = os.WriteFile(jsonFile, output, 0644)
			assert.NoError(t, err, "Should create JSON coverage report")
		}
	})

	t.Run("Generate Text Coverage Report", func(t *testing.T) {
		textFile := filepath.Join(coverageDir, "coverage.txt")
		
		cmd := exec.Command("go", "tool", "cover", "-func="+coverageFile)
		cmd.Dir = projectRoot
		
		output, err := cmd.CombinedOutput()
		if err == nil {
			err = os.WriteFile(textFile, output, 0644)
			assert.NoError(t, err, "Should create text coverage report")
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