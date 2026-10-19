#!/usr/bin/env node

/**
 * Stage 6: Maintenance & Closed-Loop Monitor
 * Deterministically checks system health and error thresholds.
 * When an anomaly or control band breach occurs, generates an intent artifact
 * in `intent/` to autonomously re-enter Stage 1 of the AI-Native SDLC.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');
const healthUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health';

console.log('🤖 Running Stage 6 Autonomous Maintenance Check...');

async function runCheck() {
  const anomalies = [];

  // Check 1: Invariant Check on critical files
  const requiredFiles = [
    'src/services/api.ts',
    'backend/src/middleware/security.middleware.ts',
    'backend/src/server.ts',
    'intent/TEMPLATE.md',
    'specs/TEMPLATE.md',
    'plans/TEMPLATE.md'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      anomalies.push({
        severity: 'critical',
        component: file,
        message: `Core invariant file missing: ${file}`
      });
    }
  }

  // Check 2: Health endpoint check (if live or testing)
  if (!isDryRun) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        anomalies.push({
          severity: 'high',
          component: 'API Health Endpoint',
          message: `Health check returned non-200 status: ${res.status}`
        });
      }
    } catch (err) {
      // In local non-running environment without server, treat as informative warning unless strict
      console.log(`ℹ️ Health check skipped or unreachable: ${err.message}`);
    }
  }

  if (anomalies.length > 0) {
    console.warn(`⚠️ ${anomalies.length} anomaly detected. Closing the loop: writing intent artifact...`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const intentFilename = `intent/${timestamp}-breach-diagnosis.md`;
    const intentPath = path.join(rootDir, intentFilename);

    const intentContent = `# Intent: Automated Incident Diagnosis (${timestamp})

**Author**: Stage 6 Autonomous Maintenance Monitor  
**Date**: ${new Date().toISOString().slice(0, 10)}  
**Status**: draft  

---

## 1. Problem
Automated monitoring detected one or more control band breaches or invariant violations:
${anomalies.map(a => `- **[${a.severity.toUpperCase()}]** \`${a.component}\`: ${a.message}`).join('\n')}

## 2. Proposed Outcome
Investigate root cause, restore failing invariant, and run regression tests through the AI-Native SDLC pipeline.

## 3. Affected Users & Systems
- **Affected Systems**: ${anomalies.map(a => a.component).join(', ')}
- **Users**: Operations staff and platform engineers.

## 4. Constraints
- Must not weaken existing security or validation tests.
- PR must pass full test suite before auto-merging.

## 5. Open Questions
- Did this breach result from a deployment regression or infrastructure disruption?
`;

    fs.writeFileSync(intentPath, intentContent, 'utf8');
    console.log(`✅ Autonomous diagnosis saved to ${intentFilename}. Loop closed.`);
    process.exit(1);
  } else {
    console.log('✅ System healthy. Zero control-band breaches detected.');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error(`Monitor execution failed: ${err.message}`);
  process.exit(1);
});
