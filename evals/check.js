#!/usr/bin/env node

/**
 * AI Agent Configuration & Architecture Eval Runner
 * Verifies that critical repository invariants, security rules, and architectural patterns
 * remain intact across agent commits and prompt/rule modifications.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const evalsPath = path.join(__dirname, 'evals.json');
const evals = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));

console.log(`🔍 Running ${evals.length} AI agent evals against repository...`);

let passed = 0;
let failed = 0;

for (const test of evals) {
  try {
    if (test.target === 'directory_check') {
      const missing = [];
      for (const item of test.must_exist || []) {
        if (!fs.existsSync(path.join(rootDir, item))) {
          missing.push(item);
        }
      }
      if (missing.length > 0) {
        console.error(`❌ [${test.id}] ${test.name}: Missing paths -> ${missing.join(', ')}`);
        failed++;
        continue;
      }
    } else {
      const targetPath = path.join(rootDir, test.target);
      if (!fs.existsSync(targetPath)) {
        console.error(`❌ [${test.id}] ${test.name}: Target file not found -> ${test.target}`);
        failed++;
        continue;
      }

      const content = fs.readFileSync(targetPath, 'utf8');

      if (test.must_contain) {
        const missingPhrases = test.must_contain.filter(phrase => !content.includes(phrase));
        if (missingPhrases.length > 0) {
          console.error(`❌ [${test.id}] ${test.name}: Target missing required phrases: ${missingPhrases.join(', ')}`);
          failed++;
          continue;
        }
      }

      if (test.must_not_contain) {
        const forbiddenPhrases = test.must_not_contain.filter(phrase => content.includes(phrase));
        if (forbiddenPhrases.length > 0) {
          console.error(`❌ [${test.id}] ${test.name}: Target contains forbidden phrases: ${forbiddenPhrases.join(', ')}`);
          failed++;
          continue;
        }
      }
    }

    console.log(`✅ [${test.id}] ${test.name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [${test.id}] ${test.name}: Execution error: ${err.message}`);
    failed++;
  }
}

console.log(`\nEval Summary: ${passed} passed, ${failed} failed (${evals.length} total)`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
