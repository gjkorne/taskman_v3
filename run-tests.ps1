# PowerShell script to run various test combinations

# Functions to make the output more readable
function Write-Header {
    param($Message)
    Write-Host "`n`n===================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
}

function Write-SubHeader {
    param($Message)
    Write-Host "`n--------------------------------------------------" -ForegroundColor Yellow
    Write-Host " $Message" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------" -ForegroundColor Yellow
}

# Run a specific test file or pattern
function Run-SpecificTest {
    param($Pattern)
    Write-SubHeader "Running tests matching pattern: $Pattern"
    npm test -- -t "$Pattern"
}

Write-Header "TaskMan Test Runner"

$testOption = Read-Host @"
Choose a test option:
1. Run all tests
2. Run unit tests only
3. Run component tests only
4. Run FilterSort tests only
5. Run E2E tests only
6. Run with coverage report
7. Run specific test
Option
"@

switch ($testOption) {
    1 { 
        Write-Header "Running all tests"
        npm test
        Write-Header "Running E2E tests"
        npm run test:e2e
    }
    2 { 
        Write-Header "Running unit tests only" 
        npm test -- --testPathIgnorePatterns=e2e
    }
    3 { 
        Write-Header "Running component tests only"
        npm test -- --testPathPattern=src/components
    }
    4 { 
        Write-Header "Running FilterSort tests only"
        Run-SpecificTest "FilterSort"
    }
    5 { 
        Write-Header "Running E2E tests only"
        npm run test:e2e
    }
    6 { 
        Write-Header "Running with coverage report"
        npm run test:coverage
    }
    7 { 
        $pattern = Read-Host "Enter test pattern"
        Run-SpecificTest $pattern
    }
    default { 
        Write-Host "Invalid option. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Header "Test run completed"
