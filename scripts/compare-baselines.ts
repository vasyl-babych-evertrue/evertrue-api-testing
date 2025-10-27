#!/usr/bin/env node
/**
 * CLI script for comparing API baseline reports
 * Usage: npm run compare:baseline -- <baseline-file> <current-file>
 */

import { compareReports } from '../helpers/report-comparator';
import * as path from 'path';
import * as fs from 'fs';

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
Usage: npm run compare:baseline -- [baseline-file] [current-file]

Arguments:
  baseline-file  Path to baseline report (default: api-baseline-reports/baseline-latest.json)
  current-file   Path to current report (default: api-baseline-reports/baseline-latest.json)

Examples:
  # Compare latest with a specific baseline
  npm run compare:baseline -- api-baseline-reports/baseline-2024-01-15.json api-baseline-reports/baseline-latest.json

  # Compare two specific reports
  npm run compare:baseline -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-after-deploy.json
`);
}

function main() {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const defaultBaselineDir = 'api-baseline-reports';
  const defaultBaseline = path.join(defaultBaselineDir, 'baseline-latest.json');

  let baselinePath = args[0] || defaultBaseline;
  let currentPath = args[1] || defaultBaseline;

  // Resolve relative paths
  baselinePath = path.resolve(baselinePath);
  currentPath = path.resolve(currentPath);

  // Validate files exist
  if (!fs.existsSync(baselinePath)) {
    console.error(`❌ Baseline file not found: ${baselinePath}`);
    console.log('\nAvailable baseline files:');
    if (fs.existsSync(defaultBaselineDir)) {
      const files = fs.readdirSync(defaultBaselineDir).filter(f => f.endsWith('.json'));
      files.forEach(f => console.log(`  - ${path.join(defaultBaselineDir, f)}`));
    }
    process.exit(1);
  }

  if (!fs.existsSync(currentPath)) {
    console.error(`❌ Current report file not found: ${currentPath}`);
    process.exit(1);
  }

  const outputDir = path.join(defaultBaselineDir, 'comparisons');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  compareReports(baselinePath, currentPath, outputDir);
}

main();
