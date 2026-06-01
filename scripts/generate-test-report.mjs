#!/usr/bin/env node
/**
 * TLB Partner Portal — Automation Test Report Generator
 *
 * Usage: node scripts/generate-test-report.mjs
 * Output: test-report.pdf (not committed — see .gitignore)
 *
 * Requirements: puppeteer-core (dev dep), Microsoft Edge installed on system
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── 1. Run tests and capture JSON output ────────────────────────────────────

console.log('Running test suite…');
let rawJson = '';
try {
    const nullRedirect = platform() === 'win32' ? '2>nul' : '2>/dev/null';
    rawJson = execSync(`npm test -- --reporter=json ${nullRedirect}`, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
    });
} catch (err) {
    // vitest exits non-zero on failures — still capture stdout
    rawJson = err.stdout || '';
}

// Strip any leading non-JSON (npm run lines, etc.)
const jsonStart = rawJson.indexOf('{');
if (jsonStart === -1) {
    console.error('Could not find JSON in test output. Aborting.');
    process.exit(1);
}
const results = JSON.parse(rawJson.slice(jsonStart));

// ─── 2. Compute summary ───────────────────────────────────────────────────────

const summary = {
    totalSuites: results.numTotalTestSuites,
    passedSuites: results.numPassedTestSuites,
    failedSuites: results.numFailedTestSuites,
    totalTests: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    duration: results.testResults.reduce((acc, s) => acc + (s.perfStats?.runtime || 0), 0),
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
};

const passRate = summary.totalTests > 0
    ? ((summary.passed / summary.totalTests) * 100).toFixed(1)
    : '0.0';

// Group test suites by module
const MODULE_MAP = {
    'api/__tests__/listings.test': 'API — Listings (Events)',
    'api/__tests__/listings-classes': 'API — Listings (Classes / Programs / Venues)',
    'api/__tests__/auth.test': 'API — Auth',
    'api/__tests__/stats.test': 'API — Statistics',
    'screens/statistics/__tests__/StatCharts': 'Screens — Statistics (Chart Toolkit)',
    'screens/statistics/__tests__': 'Screens — Statistics',
    'screens/events/__tests__': 'Screens — Event Wizard',
    'screens/services/__tests__': 'Screens — Service Listings',
    'screens/classes/__tests__': 'Screens — Class Wizard',
    'screens/programs/__tests__': 'Screens — Program Wizard',
    'screens/enquiries/__tests__': 'Screens — Enquiries',
    'screens/auth/__tests__': 'Screens — Auth',
    'screens/onboarding/__tests__': 'Screens — Onboarding',
};

function getModule(filePath) {
    for (const [key, label] of Object.entries(MODULE_MAP)) {
        if (filePath.replace(/\\/g, '/').includes(key)) return label;
    }
    return 'Other';
}

const moduleGroups = {};
for (const suite of results.testResults) {
    const fp = suite.name || suite.testFilePath || '';
    const mod = getModule(fp);
    if (!moduleGroups[mod]) moduleGroups[mod] = { suites: [], passed: 0, failed: 0, total: 0 };
    const g = moduleGroups[mod];
    const failed = suite.assertionResults?.filter(t => t.status === 'failed') || [];
    const passed = suite.assertionResults?.filter(t => t.status === 'passed') || [];
    g.suites.push({ file: fp.split('/src/')[1] || fp.split('\\src\\')[1] || fp, tests: suite.assertionResults || [], failed: failed.length, passed: passed.length });
    g.failed += failed.length;
    g.passed += passed.length;
    g.total += (suite.assertionResults?.length || 0);
}

// ─── 3. Build HTML ─────────────────────────────────────────────────────────────

function statusBadge(status) {
    if (status === 'passed') return `<span class="badge pass">PASS</span>`;
    if (status === 'failed') return `<span class="badge fail">FAIL</span>`;
    return `<span class="badge skip">SKIP</span>`;
}

function moduleSection(modName, group) {
    const modPass = group.total > 0 ? ((group.passed / group.total) * 100).toFixed(0) : 0;
    const modColor = group.failed === 0 ? '#10b981' : '#ef4444';
    let rows = '';
    for (const suite of group.suites) {
        for (const t of suite.tests) {
            const errMsg = t.failureMessages?.[0]
                ? `<div class="err-msg">${t.failureMessages[0].split('\n')[0].replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 200)}</div>`
                : '';
            rows += `
            <tr class="${t.status === 'failed' ? 'row-fail' : ''}">
                <td class="test-name">${t.fullName.replace(/</g, '&lt;')}</td>
                <td class="center">${statusBadge(t.status)}</td>
                <td class="center">${t.duration != null ? t.duration.toFixed(0) + 'ms' : '—'}</td>
            </tr>
            ${errMsg ? `<tr class="row-err"><td colspan="3">${errMsg}</td></tr>` : ''}`;
        }
    }

    return `
    <div class="module-section">
        <div class="module-header" style="border-left: 4px solid ${modColor}">
            <div>
                <span class="module-name">${modName}</span>
                <span class="module-file-count">${group.suites.length} suite${group.suites.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="module-stats">
                <span class="stat-pass">${group.passed} passed</span>
                ${group.failed > 0 ? `<span class="stat-fail">${group.failed} failed</span>` : ''}
                <span class="stat-pct" style="color:${modColor}">${modPass}%</span>
            </div>
        </div>
        <table class="test-table">
            <thead><tr><th>Test Case</th><th class="center">Result</th><th class="center">Duration</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

const failedTests = results.testResults.flatMap(s =>
    (s.assertionResults || []).filter(t => t.status === 'failed').map(t => ({
        name: t.fullName,
        msg: t.failureMessages?.[0]?.split('\n')[0]?.slice(0, 200) || '',
    }))
);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TLB Partner Portal — Automation Test Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }

  /* ── Cover Page ── */
  .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #141414 0%, #2d1b4e 100%); color: #fff; text-align: center; padding: 60px 40px; break-after: page; }
  .cover-logo { width: 80px; height: 80px; background: #FACC15; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; font-weight: 900; color: #141414; }
  .cover h1 { font-size: 36px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.5px; }
  .cover h2 { font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.7); margin-bottom: 40px; }
  .cover-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 480px; margin: 40px auto 0; }
  .cover-stat { background: rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; }
  .cover-stat .val { font-size: 32px; font-weight: 900; color: #FACC15; }
  .cover-stat .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); margin-top: 4px; }
  .cover-date { margin-top: 48px; color: rgba(255,255,255,0.4); font-size: 11px; }

  /* ── Summary Bar ── */
  .summary-bar { display: flex; gap: 12px; padding: 20px 32px; background: #f8f9fa; border-bottom: 2px solid #e5e7eb; flex-wrap: wrap; }
  .summary-chip { padding: 8px 16px; border-radius: 999px; font-weight: 700; font-size: 12px; }
  .chip-total  { background: #e8e8e8; color: #374151; }
  .chip-pass   { background: #d1fae5; color: #065f46; }
  .chip-fail   { background: #fee2e2; color: #991b1b; }
  .chip-rate   { background: #fef3c7; color: #92400e; }
  .chip-time   { background: #ede9fe; color: #4c1d95; }

  /* ── Section ── */
  .section-title { font-size: 20px; font-weight: 900; padding: 32px 32px 16px; color: #111827; border-top: 1px solid #f3f4f6; margin-top: 16px; }

  /* ── Failed Summary ── */
  .failed-summary { margin: 0 32px 24px; background: #fff5f5; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px; }
  .failed-summary h3 { color: #b91c1c; font-size: 14px; margin-bottom: 12px; }
  .failed-item { padding: 8px 0; border-bottom: 1px solid #fee2e2; }
  .failed-item:last-child { border-bottom: none; }
  .failed-item .fn { font-weight: 700; color: #374151; }
  .failed-item .fm { font-size: 10px; color: #6b7280; margin-top: 2px; font-family: monospace; }

  /* ── Module sections ── */
  .module-section { margin: 0 32px 24px; page-break-inside: avoid; }
  .module-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f9fafb; border-radius: 12px 12px 0 0; margin-bottom: 0; }
  .module-name { font-size: 14px; font-weight: 800; color: #111827; }
  .module-file-count { font-size: 10px; color: #9ca3af; margin-left: 8px; }
  .module-stats { display: flex; gap: 12px; align-items: center; font-size: 11px; font-weight: 700; }
  .stat-pass { color: #059669; }
  .stat-fail { color: #dc2626; }
  .stat-pct { font-size: 16px; font-weight: 900; }

  /* ── Test table ── */
  .test-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; }
  .test-table th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .test-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  .test-table tr:last-child td { border-bottom: none; }
  .test-table .center { text-align: center; }
  .test-name { color: #374151; max-width: 420px; word-break: break-word; }
  .row-fail { background: #fff8f8; }
  .row-err td { padding: 4px 12px 8px; }
  .err-msg { font-family: monospace; font-size: 10px; color: #dc2626; background: #fee2e2; padding: 6px 8px; border-radius: 6px; word-break: break-all; }

  /* ── Badges ── */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge.pass { background: #d1fae5; color: #065f46; }
  .badge.fail { background: #fee2e2; color: #991b1b; }
  .badge.skip { background: #f3f4f6; color: #6b7280; }

  /* ── Footer ── */
  .footer { text-align: center; padding: 32px; color: #9ca3af; font-size: 10px; border-top: 1px solid #f3f4f6; margin-top: 24px; }

  @media print {
    .cover { page-break-after: always; }
    .module-section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover">
    <div class="cover-logo">TLB</div>
    <h1>Automation Test Report</h1>
    <h2>TLB Partner Portal — Full Project Audit</h2>
    <div style="width:120px;height:4px;background:#FACC15;border-radius:2px;margin:0 auto 8px;"></div>
    <div class="cover-meta">
        <div class="cover-stat"><div class="val">${summary.totalTests}</div><div class="lbl">Total Tests</div></div>
        <div class="cover-stat"><div class="val">${passRate}%</div><div class="lbl">Pass Rate</div></div>
        <div class="cover-stat"><div class="val">${summary.passed}</div><div class="lbl">Passed</div></div>
        <div class="cover-stat"><div class="val" style="color:${summary.failed > 0 ? '#f87171' : '#FACC15'}">${summary.failed}</div><div class="lbl">Failed</div></div>
    </div>
    <div class="cover-date">Generated on ${summary.timestamp} IST &nbsp;|&nbsp; ${summary.totalSuites} test suites across ${Object.keys(moduleGroups).length} modules</div>
</div>

<!-- Summary Bar -->
<div class="summary-bar">
    <span class="summary-chip chip-total">📋 ${summary.totalTests} tests</span>
    <span class="summary-chip chip-pass">✅ ${summary.passed} passed</span>
    ${summary.failed > 0 ? `<span class="summary-chip chip-fail">❌ ${summary.failed} failed</span>` : ''}
    <span class="summary-chip chip-rate">📊 ${passRate}% pass rate</span>
    <span class="summary-chip chip-time">⏱ ${(summary.duration / 1000).toFixed(1)}s total</span>
    <span class="summary-chip chip-total">${summary.totalSuites} suites (${summary.passedSuites} passed, ${summary.failedSuites} failed)</span>
</div>

<!-- Failed Tests Summary (if any) -->
${failedTests.length > 0 ? `
<div class="section-title">⚠️ Failed Tests Summary (${failedTests.length})</div>
<div class="failed-summary">
    <h3>Action Required — ${failedTests.length} test${failedTests.length !== 1 ? 's' : ''} failing</h3>
    ${failedTests.map(t => `
    <div class="failed-item">
        <div class="fn">${t.name.replace(/</g, '&lt;')}</div>
        ${t.msg ? `<div class="fm">${t.msg.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
    </div>`).join('')}
</div>` : `
<div class="section-title">✅ All Tests Passing</div>
<div style="margin: 0 32px 24px; padding: 20px; background: #d1fae5; border-radius: 12px; color: #065f46; font-weight: 700; font-size: 14px; text-align: center;">
    All ${summary.totalTests} tests pass. No action required.
</div>`}

<!-- Module Results -->
<div class="section-title">📁 Results by Module</div>
${Object.entries(moduleGroups).sort(([a], [b]) => a.localeCompare(b)).map(([mod, group]) => moduleSection(mod, group)).join('\n')}

<div class="footer">
    TLB Partner Portal — Automation Test Report &nbsp;|&nbsp; Generated ${summary.timestamp} &nbsp;|&nbsp;
    ${summary.totalTests} tests · ${summary.passed} passed · ${summary.failed} failed · ${passRate}% pass rate
</div>

</body>
</html>`;

// ─── 4. Save HTML (optional intermediate artifact) ────────────────────────────

const htmlPath = join(ROOT, 'test-report.html');
writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML report saved: test-report.html`);

// ─── 5. Convert to PDF via Edge ───────────────────────────────────────────────

const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

let executablePath = null;
if (existsSync(EDGE_PATH)) executablePath = EDGE_PATH;
else if (existsSync(CHROME_PATH)) executablePath = CHROME_PATH;

if (!executablePath) {
    console.warn('No Chrome/Edge found. PDF not generated — open test-report.html manually.');
    process.exit(0);
}

console.log(`Launching browser: ${executablePath}`);
const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = join(ROOT, 'test-report.pdf');
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    console.log(`\n✅ PDF report generated: test-report.pdf`);
    console.log(`   Tests: ${summary.totalTests} | Pass: ${summary.passed} | Fail: ${summary.failed} | Rate: ${passRate}%`);
} finally {
    await browser.close();
}
