/**
 * Custom Playwright Reporter for API Response Tracking
 * Saves all API request/response data for baseline comparison
 */

import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface ApiCallData {
  method: string;
  url: string;
  headers: Record<string, string>;
  requestBody?: any;
  statusCode: number;
  responseHeaders: Record<string, string>;
  responseBody?: any;
  duration: number;
  timestamp: string;
}

interface TestData {
  testId: string;
  testTitle: string;
  testFile: string;
  status: string;
  duration: number;
  apiCalls: ApiCallData[];
  errors?: string[];
}

interface ReportData {
  metadata: {
    timestamp: string;
    environment: string;
    baseUrl: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
  };
  tests: TestData[];
}

export default class ApiResponseReporter implements Reporter {
  private reportData: ReportData;
  private outputDir: string;
  private startTime: number = 0;

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'api-baseline-reports';
    this.reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.API_BASE_URL || 'https://stage-api.evertrue.com',
        baseUrl: process.env.API_BASE_URL || 'https://stage-api.evertrue.com',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
      },
      tests: [],
    };
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    console.log(`\n🔍 API Response Reporter: Starting test run...`);
    console.log(`📁 Reports will be saved to: ${this.outputDir}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const testData: TestData = {
      testId: test.id,
      testTitle: test.title,
      testFile: test.location.file,
      status: result.status,
      duration: result.duration,
      apiCalls: [],
      errors: result.errors.length > 0 ? result.errors.map(e => e.message || 'Unknown error') : undefined,
    };

    // Extract API call data from test attachments
    for (const attachment of result.attachments) {
      if (attachment.name === 'api-call-data' && attachment.body) {
        try {
          const apiCall = JSON.parse(attachment.body.toString());
          testData.apiCalls.push(apiCall);
        } catch (e) {
          console.error('Failed to parse API call data:', e);
        }
      }
    }

    this.reportData.tests.push(testData);
    this.reportData.metadata.totalTests++;
    if (result.status === 'passed') {
      this.reportData.metadata.passedTests++;
    } else if (result.status === 'failed') {
      this.reportData.metadata.failedTests++;
    }
  }

  async onEnd(result: FullResult) {
    this.reportData.metadata.duration = Date.now() - this.startTime;

    // Generate timestamp-based filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const reportFileName = `baseline-${timestamp}.json`;
    const reportPath = path.join(this.outputDir, reportFileName);

    // Save detailed report
    fs.writeFileSync(reportPath, JSON.stringify(this.reportData, null, 2));

    // Also save as "latest" for easy access
    const latestPath = path.join(this.outputDir, 'baseline-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(this.reportData, null, 2));

    // Generate summary
    const summary = this.generateSummary();
    const summaryPath = path.join(this.outputDir, `summary-${timestamp}.txt`);
    fs.writeFileSync(summaryPath, summary);

    console.log(`\n✅ API Response Reporter: Report saved`);
    console.log(`📄 Detailed report: ${reportPath}`);
    console.log(`📄 Latest baseline: ${latestPath}`);
    console.log(`📊 Summary: ${summaryPath}`);
    console.log(`\n${summary}`);
  }

  private generateSummary(): string {
    const totalApiCalls = this.reportData.tests.reduce(
      (sum, test) => sum + test.apiCalls.length,
      0
    );

    const statusCodeDistribution: Record<number, number> = {};
    const endpointCalls: Record<string, number> = {};

    this.reportData.tests.forEach(test => {
      test.apiCalls.forEach(call => {
        // Count status codes
        statusCodeDistribution[call.statusCode] = 
          (statusCodeDistribution[call.statusCode] || 0) + 1;

        // Count endpoint calls
        const endpoint = `${call.method} ${call.url}`;
        endpointCalls[endpoint] = (endpointCalls[endpoint] || 0) + 1;
      });
    });

    let summary = `
╔════════════════════════════════════════════════════════════════╗
║           API BASELINE REPORT SUMMARY                          ║
╚════════════════════════════════════════════════════════════════╝

📅 Timestamp: ${this.reportData.metadata.timestamp}
🌐 Environment: ${this.reportData.metadata.environment}
⏱️  Duration: ${(this.reportData.metadata.duration / 1000).toFixed(2)}s

📊 TEST RESULTS:
   Total Tests: ${this.reportData.metadata.totalTests}
   ✅ Passed: ${this.reportData.metadata.passedTests}
   ❌ Failed: ${this.reportData.metadata.failedTests}

🔗 API CALLS:
   Total API Calls: ${totalApiCalls}
   
📈 STATUS CODE DISTRIBUTION:
`;

    Object.entries(statusCodeDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([code, count]) => {
        const percentage = ((count / totalApiCalls) * 100).toFixed(1);
        summary += `   ${code}: ${count} (${percentage}%)\n`;
      });

    summary += `\n🎯 TOP ENDPOINTS:\n`;
    Object.entries(endpointCalls)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([endpoint, count]) => {
        summary += `   ${count}x - ${endpoint}\n`;
      });

    return summary;
  }
}
