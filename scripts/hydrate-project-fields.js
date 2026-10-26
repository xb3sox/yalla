import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ISSUE_DATA = {
  41: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Phase 3 (Real-Time)',
    module: 'Realtime & Comms',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  42: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Phase 3 (Real-Time)',
    module: 'Realtime & Comms',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  },
  43: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Phase 3 (Real-Time)',
    module: 'Realtime & Comms',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  },
  44: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Phase 3 (Real-Time)',
    module: 'Discovery & Booking',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  45: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Phase 4 (Expansion)',
    module: 'Location & Multi-City',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  46: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Phase 4 (Expansion)',
    module: 'Host Portal',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 13
  },
  47: {
    priority: 'P2 - Medium',
    label: 'p2-medium',
    phase: 'Phase 4 (Expansion)',
    module: 'Recommendations',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  48: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Phase 4 (Expansion)',
    module: 'Platform & Infrastructure',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  49: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Phase 5 (Mobile)',
    module: 'Mobile & Wallet',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 13
  },
  50: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Phase 5 (Mobile)',
    module: 'Mobile & Wallet',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  51: {
    priority: 'P2 - Medium',
    label: 'p2-medium',
    phase: 'Phase 5 (Mobile)',
    module: 'Mobile & Wallet',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  },
  52: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Platform Engineering',
    module: 'Testing & Quality',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  53: {
    priority: 'P1 - High',
    label: 'p1-high',
    phase: 'Platform Engineering',
    module: 'Platform & Infrastructure',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  },
  54: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Platform Engineering',
    module: 'Platform & Infrastructure',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  },
  55: {
    priority: 'P0 - Critical',
    label: 'p0-critical',
    phase: 'Platform Engineering',
    module: 'Security & Privacy',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 8
  },
  56: {
    priority: 'P2 - Medium',
    label: 'p2-medium',
    phase: 'Platform Engineering',
    module: 'Realtime & Comms',
    sdlc: 'Stage 3: Plan/Build',
    estimate: 5
  }
};

async function run() {
  console.log('🚀 Hydrating custom fields on Project 13 & labels on issues #41–#56...');

  for (const [numStr, data] of Object.entries(ISSUE_DATA)) {
    const num = Number(numStr);
    const url = `https://github.com/xb3sox/yalla/issues/${num}`;
    console.log(`\n📌 Processing Issue #${num}...`);

    // 1. Add priority label to issue
    try {
      await execFileAsync('gh', ['issue', 'edit', String(num), '--add-label', data.label]);
      console.log(`  🏷️ Added label "${data.label}"`);
    } catch (err) {
      console.warn(`  ⚠️ Could not add label: ${err.message}`);
    }

    // 2. Set Priority field
    try {
      await execFileAsync('gh', ['project', 'item-edit', '13', '--owner', 'xb3sox', '--url', url, '--field', 'Priority', '--value', data.priority]);
      console.log(`  ⚡ Set Priority: ${data.priority}`);
    } catch (err) {
      console.warn(`  ⚠️ Priority update failed: ${err.message}`);
    }

    // 3. Set Phase field
    try {
      await execFileAsync('gh', ['project', 'item-edit', '13', '--owner', 'xb3sox', '--url', url, '--field', 'Phase', '--value', data.phase]);
      console.log(`  🎯 Set Phase: ${data.phase}`);
    } catch (err) {
      console.warn(`  ⚠️ Phase update failed: ${err.message}`);
    }

    // 4. Set Module field
    try {
      await execFileAsync('gh', ['project', 'item-edit', '13', '--owner', 'xb3sox', '--url', url, '--field', 'Module', '--value', data.module]);
      console.log(`  🏛️ Set Module: ${data.module}`);
    } catch (err) {
      console.warn(`  ⚠️ Module update failed: ${err.message}`);
    }

    // 5. Set Estimate field
    try {
      await execFileAsync('gh', ['project', 'item-edit', '13', '--owner', 'xb3sox', '--url', url, '--field', 'Estimate', '--number', String(data.estimate)]);
      console.log(`  📊 Set Estimate: ${data.estimate}`);
    } catch (err) {
      console.warn(`  ⚠️ Estimate update failed: ${err.message}`);
    }

    // 6. Set SDLC Stage field
    try {
      await execFileAsync('gh', ['project', 'item-edit', '13', '--owner', 'xb3sox', '--url', url, '--field', 'SDLC Stage', '--value', data.sdlc]);
      console.log(`  🔄 Set SDLC Stage: ${data.sdlc}`);
    } catch (err) {
      console.warn(`  ⚠️ SDLC Stage update failed: ${err.message}`);
    }
  }

  console.log('\n✅ All 16 issues hydrated successfully on Project 13!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
