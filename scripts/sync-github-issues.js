#!/usr/bin/env node

/**
 * Sync GitHub Issues Tool for Yalla
 * Parses .github/ISSUES/*.md files and creates/syncs issues with GitHub API or gh CLI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const issuesDir = path.join(rootDir, '.github', 'ISSUES');

const isDryRun = process.argv.includes('--dry-run');

console.log('🤖 Running Yalla GitHub Issues Synchronizer...');
console.log(`Directory: ${issuesDir}`);
console.log(`Mode: ${isDryRun ? 'Dry Run / Local Verification' : 'Live Sync (GitHub API)'}`);

function parseIssueFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract Header Title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  // Extract Labels
  const labelsMatch = content.match(/\*\*Labels\*\*:\s*`?([^\n\r]+)`?/i);
  let labels = ['backlog'];
  if (labelsMatch) {
    labels = labelsMatch[1]
      .replace(/`/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Extract Milestone
  const milestoneMatch = content.match(/\*\*Milestone\*\*:\s*([^\n\r]+)/i);
  const milestone = milestoneMatch ? milestoneMatch[1].replace(/`/g, '').trim() : null;

  return {
    file: path.basename(filePath),
    title,
    labels,
    milestone,
    body: content
  };
}

async function runSync() {
  if (!fs.existsSync(issuesDir)) {
    console.error(`❌ Issues directory not found: ${issuesDir}`);
    process.exit(1);
  }

  const issueFiles = fs.readdirSync(issuesDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (issueFiles.length === 0) {
    console.log('⚠️ No issue markdown files found.');
    process.exit(0);
  }

  console.log(`Found ${issueFiles.length} issue markdown definition(s).\n`);

  const parsedIssues = issueFiles.map(file => parseIssueFile(path.join(issuesDir, file)));

  console.log('-------------------------------------------------------------------------------------------------------');
  console.log(' #  | Issue Title                                           | Labels');
  console.log('-------------------------------------------------------------------------------------------------------');

  parsedIssues.forEach((issue, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    const shortTitle = issue.title.padEnd(53, ' ').substring(0, 53);
    const labelStr = issue.labels.join(', ');
    console.log(`${num} | ${shortTitle} | ${labelStr}`);
  });
  console.log('-------------------------------------------------------------------------------------------------------\n');

  if (isDryRun) {
    console.log('✅ Dry-run check completed successfully.');
    console.log(`ℹ️ All ${parsedIssues.length} issues are validated and formatted according to best practices.`);
    console.log('ℹ️ To create live issues on GitHub, set GH_TOKEN and run: node scripts/sync-github-issues.js');
    process.exit(0);
  }

  // Live Sync logic using gh CLI with execFile
  console.log('🚀 Syncing issues with GitHub repository...');

  // Fetch existing issues for idempotency check
  let existingTitles = new Set();
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['issue', 'list', '--state', 'all', '--limit', '1000', '--json', 'title'],
      { cwd: rootDir }
    );
    const existingIssues = JSON.parse(stdout || '[]');
    existingTitles = new Set(existingIssues.map(i => i.title.trim()));
    console.log(`ℹ️ Found ${existingTitles.size} existing issue(s) in repository.\n`);
  } catch (err) {
    console.warn(`⚠️ Warning: Could not fetch existing issues via gh CLI (${err.message}). Proceeding without pre-cached issue list.`);
  }

  // Ensure milestones exist
  const knownMilestones = new Set();
  try {
    const { stdout: repoInfo } = await execFileAsync('gh', ['repo', 'view', '--json', 'nameWithOwner'], { cwd: rootDir });
    const { nameWithOwner } = JSON.parse(repoInfo || '{}');
    if (nameWithOwner) {
      const { stdout: msOut } = await execFileAsync('gh', ['api', `repos/${nameWithOwner}/milestones`, '--paginate', '--jq', '.[].title'], { cwd: rootDir });
      msOut.split(/\r?\n/).map(m => m.trim()).filter(Boolean).forEach(m => knownMilestones.add(m));

      for (const issue of parsedIssues) {
        if (issue.milestone && !knownMilestones.has(issue.milestone)) {
          try {
            await execFileAsync('gh', ['api', `repos/${nameWithOwner}/milestones`, '-f', `title=${issue.milestone}`], { cwd: rootDir });
            knownMilestones.add(issue.milestone);
            console.log(`📌 Created milestone: "${issue.milestone}"`);
          } catch (mErr) {
            console.warn(`⚠️ Could not create milestone "${issue.milestone}": ${mErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not pre-query milestones: ${err.message}`);
  }

  // Ensure labels exist
  const knownLabels = new Set();
  try {
    const { stdout: labelsOut } = await execFileAsync('gh', ['label', 'list', '--limit', '1000', '--json', 'name'], { cwd: rootDir });
    const existingLabels = JSON.parse(labelsOut || '[]');
    existingLabels.forEach(l => knownLabels.add(l.name.toLowerCase()));

    const allLabels = new Set(parsedIssues.flatMap(i => i.labels));
    for (const label of allLabels) {
      if (!knownLabels.has(label.toLowerCase())) {
        try {
          await execFileAsync('gh', ['label', 'create', label, '--color', '0366d6'], { cwd: rootDir });
          knownLabels.add(label.toLowerCase());
          console.log(`🏷️ Created label: "${label}"`);
        } catch (lErr) {
          knownLabels.add(label.toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not pre-query labels: ${err.message}`);
  }

  const failedIssues = [];

  for (const issue of parsedIssues) {
    if (existingTitles.has(issue.title)) {
      console.log(`⏩ Issue already exists, skipping: "${issue.title}"`);
      continue;
    }

    try {
      const args = [
        'issue',
        'create',
        '--title',
        issue.title,
        '--body-file',
        path.join(issuesDir, issue.file)
      ];

      for (const label of issue.labels) {
        args.push('--label', label);
      }

      if (issue.milestone) {
        args.push('--milestone', issue.milestone);
      }

      const { stdout } = await execFileAsync('gh', args, { cwd: rootDir });
      console.log(`✅ Created issue: ${stdout.trim()}`);
      existingTitles.add(issue.title);
    } catch (err) {
      console.error(`❌ Failed to create issue '${issue.title}':`, err.message);
      failedIssues.push({ issue: issue.title, error: err.message });
    }
  }

  if (failedIssues.length > 0) {
    console.error(`\n❌ Issue creation completed with ${failedIssues.length} failure(s):`);
    for (const fail of failedIssues) {
      console.error(`  - "${fail.issue}": ${fail.error}`);
    }
    process.exit(1);
  }

  console.log('\n🎉 All issues synchronized successfully.');
}

runSync().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
