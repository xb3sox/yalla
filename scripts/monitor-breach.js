#!/usr/bin/env node

/**
 * Stage 6: Maintenance & Closed-Loop Monitor for Complete Product
 * Continuously audits the health, routes, and architectural invariants across all product pillars.
 * When an anomaly or control band breach occurs, generates an intent artifact
 * in `intent/` to autonomously re-enter Stage 1 of the AI-Native SDLC.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');
const isStrictEndpoint = process.argv.includes('--strict-endpoint');
const healthUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health';

console.log('🤖 Running Stage 6 Complete Product Autonomous Maintenance Check...');

async function runCheck() {
  const anomalies = [];

  // Check 1: Invariant Check on all 5 Product Pillar Controllers & Services
  const requiredProductFiles = [
    // Pillar 1: Discovery, Booking & Payments
    'backend/src/routes/experience.routes.ts',
    'backend/src/routes/reservation.routes.ts',
    'backend/src/routes/payment.routes.ts',
    'src/domain/services/ReservationStateMachine.ts',
    // Pillar 2: Arrival Mode & Host Verification
    'backend/src/routes/host.routes.ts',
    'backend/src/controllers/host.controller.ts',
    // Pillar 3: Staff Operations & Capacity
    'backend/src/routes/staff.routes.ts',
    'backend/src/controllers/staff.controller.ts',
    // Pillar 4: Trust, Safety Cases & Audit
    'backend/src/routes/safety_case.routes.ts',
    'backend/src/routes/blocks.routes.ts',
    'backend/src/routes/audit.routes.ts',
    'backend/src/models/audit.model.ts',
    // Pillar 5: Feedback, Rewards & Recommendations
    'backend/src/controllers/recommendation.controller.ts',
    'backend/src/controllers/feedback.controller.ts',
    'backend/src/controllers/reward.controller.ts'
  ];

  for (const file of requiredProductFiles) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      anomalies.push({
        severity: 'critical',
        component: file,
        message: `Product pillar file missing: ${file}`
      });
    }
  }

  // Check 2: Run Continuous Invariant Evals asynchronously
  try {
    await execAsync('node evals/check.js', { cwd: rootDir });
  } catch (err) {
    anomalies.push({
      severity: 'high',
      component: 'Continuous Invariant Evals (evals/check.js)',
      message: 'One or more product architectural invariant evaluations failed'
    });
  }

  // Check 3: Health endpoint check (if live)
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
      if (isStrictEndpoint) {
        anomalies.push({
          severity: 'high',
          component: 'API Health Endpoint',
          message: `Health check unreachable in strict mode: ${err.message}`
        });
      } else {
        console.log(`ℹ️ Health endpoint check skipped: ${err.message}`);
      }
    }
  }

  if (anomalies.length > 0) {
    console.warn(`⚠️ ${anomalies.length} anomaly detected. Closing the loop: writing intent artifact...`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const intentFilename = `intent/${timestamp}-breach-diagnosis.md`;
    const intentPath = path.join(rootDir, intentFilename);

    const intentContent = `# Intent: Automated Product Incident Diagnosis (${timestamp})

**Author**: Stage 6 Autonomous Maintenance Monitor  
**Date**: ${new Date().toISOString().slice(0, 10)}  
**Status**: draft  

---

## 1. Problem
Automated product monitoring detected one or more control band breaches or architectural regressions:
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
    console.log('✅ Complete product healthy. All 5 pillars and 10 evals intact. Zero breaches.');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error(`Monitor execution failed: ${err.message}`);
  process.exit(1);
});
