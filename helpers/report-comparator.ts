/**
 * Utility for comparing API baseline reports
 * Detects differences between pre-deploy and post-deploy test runs
 */

import * as fs from 'fs';
import * as path from 'path';

interface ApiCallData {
  method: string;
  url: string;
  statusCode: number;
  responseBody?: any;
  requestBody?: any;
}

interface TestData {
  testId: string;
  testTitle: string;
  testFile: string;
  status: string;
  apiCalls: ApiCallData[];
}

interface ReportData {
  metadata: {
    timestamp: string;
    environment: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  tests: TestData[];
}

interface Difference {
  type: 'status_code' | 'response_body' | 'new_endpoint' | 'missing_endpoint' | 'test_status';
  severity: 'critical' | 'warning' | 'info';
  endpoint?: string;
  testTitle?: string;
  details: string;
  baseline?: any;
  current?: any;
}

interface ComparisonResult {
  summary: {
    totalDifferences: number;
    criticalDifferences: number;
    warningDifferences: number;
    infoDifferences: number;
    baselineTests: number;
    currentTests: number;
    baselineApiCalls: number;
    currentApiCalls: number;
  };
  differences: Difference[];
  timestamp: string;
}

export class ReportComparator {
  private baselineReport: ReportData;
  private currentReport: ReportData;
  private differences: Difference[] = [];

  constructor(baselinePath: string, currentPath: string) {
    this.baselineReport = this.loadReport(baselinePath);
    this.currentReport = this.loadReport(currentPath);
  }

  private loadReport(filePath: string): ReportData {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Report file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Compare two reports and generate differences
   */
  public compare(): ComparisonResult {
    this.differences = [];

    // Compare test statuses
    this.compareTestStatuses();

    // Compare API calls
    this.compareApiCalls();

    // Generate summary
    const summary = this.generateSummary();

    return {
      summary,
      differences: this.differences,
      timestamp: new Date().toISOString(),
    };
  }

  private compareTestStatuses() {
    const baselineTestMap = new Map(
      this.baselineReport.tests.map(t => [t.testTitle, t])
    );

    const currentTestMap = new Map(
      this.currentReport.tests.map(t => [t.testTitle, t])
    );

    // Check for test status changes
    for (const [testTitle, baselineTest] of baselineTestMap) {
      const currentTest = currentTestMap.get(testTitle);

      if (!currentTest) {
        this.differences.push({
          type: 'test_status',
          severity: 'warning',
          testTitle,
          details: 'Test missing in current report',
          baseline: baselineTest.status,
          current: 'missing',
        });
      } else if (baselineTest.status !== currentTest.status) {
        this.differences.push({
          type: 'test_status',
          severity: currentTest.status === 'failed' ? 'critical' : 'warning',
          testTitle,
          details: `Test status changed from ${baselineTest.status} to ${currentTest.status}`,
          baseline: baselineTest.status,
          current: currentTest.status,
        });
      }
    }

    // Check for new tests
    for (const testTitle of currentTestMap.keys()) {
      if (!baselineTestMap.has(testTitle)) {
        this.differences.push({
          type: 'test_status',
          severity: 'info',
          testTitle,
          details: 'New test added',
          baseline: 'missing',
          current: currentTestMap.get(testTitle)?.status,
        });
      }
    }
  }

  private compareApiCalls() {
    // Create endpoint maps for comparison
    const baselineEndpoints = this.createEndpointMap(this.baselineReport);
    const currentEndpoints = this.createEndpointMap(this.currentReport);

    // Compare each endpoint
    for (const [endpointKey, baselineCalls] of baselineEndpoints) {
      const currentCalls = currentEndpoints.get(endpointKey);

      if (!currentCalls || currentCalls.length === 0) {
        this.differences.push({
          type: 'missing_endpoint',
          severity: 'warning',
          endpoint: endpointKey,
          details: `Endpoint not called in current report (was called ${baselineCalls.length} times in baseline)`,
          baseline: baselineCalls.length,
          current: 0,
        });
        continue;
      }

      // Compare status codes
      this.compareStatusCodes(endpointKey, baselineCalls, currentCalls);

      // Compare response bodies (sample comparison)
      this.compareResponseBodies(endpointKey, baselineCalls, currentCalls);
    }

    // Check for new endpoints
    for (const [endpointKey, currentCalls] of currentEndpoints) {
      if (!baselineEndpoints.has(endpointKey)) {
        this.differences.push({
          type: 'new_endpoint',
          severity: 'info',
          endpoint: endpointKey,
          details: `New endpoint detected (called ${currentCalls.length} times)`,
          baseline: 0,
          current: currentCalls.length,
        });
      }
    }
  }

  private createEndpointMap(report: ReportData): Map<string, ApiCallData[]> {
    const endpointMap = new Map<string, ApiCallData[]>();

    for (const test of report.tests) {
      for (const call of test.apiCalls) {
        const key = `${call.method} ${call.url}`;
        if (!endpointMap.has(key)) {
          endpointMap.set(key, []);
        }
        endpointMap.get(key)!.push(call);
      }
    }

    return endpointMap;
  }

  private compareStatusCodes(
    endpoint: string,
    baselineCalls: ApiCallData[],
    currentCalls: ApiCallData[]
  ) {
    const baselineStatusCodes = new Set(baselineCalls.map(c => c.statusCode));
    const currentStatusCodes = new Set(currentCalls.map(c => c.statusCode));

    // Check for status code changes
    for (const baselineCode of baselineStatusCodes) {
      if (!currentStatusCodes.has(baselineCode)) {
        this.differences.push({
          type: 'status_code',
          severity: 'critical',
          endpoint,
          details: `Status code ${baselineCode} no longer returned (now returns: ${Array.from(currentStatusCodes).join(', ')})`,
          baseline: baselineCode,
          current: Array.from(currentStatusCodes),
        });
      }
    }

    // Check for new status codes
    for (const currentCode of currentStatusCodes) {
      if (!baselineStatusCodes.has(currentCode)) {
        const severity = currentCode >= 500 ? 'critical' : currentCode >= 400 ? 'warning' : 'info';
        this.differences.push({
          type: 'status_code',
          severity,
          endpoint,
          details: `New status code ${currentCode} detected (baseline had: ${Array.from(baselineStatusCodes).join(', ')})`,
          baseline: Array.from(baselineStatusCodes),
          current: currentCode,
        });
      }
    }
  }

  private compareResponseBodies(
    endpoint: string,
    baselineCalls: ApiCallData[],
    currentCalls: ApiCallData[]
  ) {
    // Sample comparison - compare first successful response
    const baselineSuccess = baselineCalls.find(c => c.statusCode >= 200 && c.statusCode < 300);
    const currentSuccess = currentCalls.find(c => c.statusCode >= 200 && c.statusCode < 300);

    if (baselineSuccess && currentSuccess) {
      const baselineKeys = this.extractObjectKeys(baselineSuccess.responseBody);
      const currentKeys = this.extractObjectKeys(currentSuccess.responseBody);

      // Check for missing fields
      const missingKeys = baselineKeys.filter(k => !currentKeys.includes(k));
      if (missingKeys.length > 0) {
        this.differences.push({
          type: 'response_body',
          severity: 'warning',
          endpoint,
          details: `Response missing fields: ${missingKeys.join(', ')}`,
          baseline: missingKeys,
          current: 'missing',
        });
      }

      // Check for new fields
      const newKeys = currentKeys.filter(k => !baselineKeys.includes(k));
      if (newKeys.length > 0) {
        this.differences.push({
          type: 'response_body',
          severity: 'info',
          endpoint,
          details: `Response has new fields: ${newKeys.join(', ')}`,
          baseline: 'missing',
          current: newKeys,
        });
      }
    }
  }

  private extractObjectKeys(obj: any, prefix = ''): string[] {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    const keys: string[] = [];
    
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        return this.extractObjectKeys(obj[0], prefix);
      }
      return keys;
    }

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys.push(...this.extractObjectKeys(obj[key], fullKey));
      }
    }

    return keys;
  }

  private generateSummary() {
    const criticalDiffs = this.differences.filter(d => d.severity === 'critical');
    const warningDiffs = this.differences.filter(d => d.severity === 'warning');
    const infoDiffs = this.differences.filter(d => d.severity === 'info');

    const baselineApiCalls = this.baselineReport.tests.reduce(
      (sum, t) => sum + t.apiCalls.length,
      0
    );
    const currentApiCalls = this.currentReport.tests.reduce(
      (sum, t) => sum + t.apiCalls.length,
      0
    );

    return {
      totalDifferences: this.differences.length,
      criticalDifferences: criticalDiffs.length,
      warningDifferences: warningDiffs.length,
      infoDifferences: infoDiffs.length,
      baselineTests: this.baselineReport.metadata.totalTests,
      currentTests: this.currentReport.metadata.totalTests,
      baselineApiCalls,
      currentApiCalls,
    };
  }

  /**
   * Save comparison result to file
   */
  public saveComparison(outputPath: string, result: ComparisonResult) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Comparison saved to: ${outputPath}`);
  }

  /**
   * Generate human-readable comparison report
   */
  public generateTextReport(result: ComparisonResult): string {
    let report = `
╔════════════════════════════════════════════════════════════════╗
║           API BASELINE COMPARISON REPORT                       ║
╚════════════════════════════════════════════════════════════════╝

📅 Comparison Date: ${result.timestamp}

📊 SUMMARY:
   Total Differences: ${result.summary.totalDifferences}
   🔴 Critical: ${result.summary.criticalDifferences}
   🟡 Warnings: ${result.summary.warningDifferences}
   🔵 Info: ${result.summary.infoDifferences}

📈 TEST STATISTICS:
   Baseline Tests: ${result.summary.baselineTests}
   Current Tests: ${result.summary.currentTests}
   Baseline API Calls: ${result.summary.baselineApiCalls}
   Current API Calls: ${result.summary.currentApiCalls}

`;

    if (result.differences.length === 0) {
      report += `✅ No differences found! API behavior is consistent.\n`;
      return report;
    }

    // Group differences by severity
    const critical = result.differences.filter(d => d.severity === 'critical');
    const warnings = result.differences.filter(d => d.severity === 'warning');
    const info = result.differences.filter(d => d.severity === 'info');

    if (critical.length > 0) {
      report += `\n🔴 CRITICAL DIFFERENCES:\n`;
      critical.forEach((diff, i) => {
        report += `\n${i + 1}. ${diff.type.toUpperCase()}\n`;
        report += `   Endpoint: ${diff.endpoint || diff.testTitle || 'N/A'}\n`;
        report += `   Details: ${diff.details}\n`;
        if (diff.baseline !== undefined) {
          report += `   Baseline: ${JSON.stringify(diff.baseline)}\n`;
        }
        if (diff.current !== undefined) {
          report += `   Current: ${JSON.stringify(diff.current)}\n`;
        }
      });
    }

    if (warnings.length > 0) {
      report += `\n🟡 WARNINGS:\n`;
      warnings.forEach((diff, i) => {
        report += `\n${i + 1}. ${diff.type.toUpperCase()}\n`;
        report += `   Endpoint: ${diff.endpoint || diff.testTitle || 'N/A'}\n`;
        report += `   Details: ${diff.details}\n`;
      });
    }

    if (info.length > 0) {
      report += `\n🔵 INFORMATIONAL:\n`;
      info.forEach((diff, i) => {
        report += `\n${i + 1}. ${diff.type.toUpperCase()}\n`;
        report += `   Endpoint: ${diff.endpoint || diff.testTitle || 'N/A'}\n`;
        report += `   Details: ${diff.details}\n`;
      });
    }

    return report;
  }
}

/**
 * CLI utility for comparing reports
 */
export function compareReports(baselinePath: string, currentPath: string, outputDir: string) {
  console.log('🔍 Starting API baseline comparison...\n');
  console.log(`📁 Baseline: ${baselinePath}`);
  console.log(`📁 Current: ${currentPath}\n`);

  const comparator = new ReportComparator(baselinePath, currentPath);
  const result = comparator.compare();

  // Save JSON comparison
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const jsonPath = path.join(outputDir, `comparison-${timestamp}.json`);
  comparator.saveComparison(jsonPath, result);

  // Generate and save text report
  const textReport = comparator.generateTextReport(result);
  const textPath = path.join(outputDir, `comparison-${timestamp}.txt`);
  fs.writeFileSync(textPath, textReport);

  console.log(textReport);
  console.log(`\n📄 Detailed comparison: ${jsonPath}`);
  console.log(`📄 Text report: ${textPath}`);

  // Exit with error code if critical differences found
  if (result.summary.criticalDifferences > 0) {
    console.log('\n❌ Critical differences detected!');
    process.exit(1);
  } else if (result.summary.warningDifferences > 0) {
    console.log('\n⚠️  Warnings detected, but no critical issues.');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  }
}
