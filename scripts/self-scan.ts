import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { scanArtifacts } from '../src/utils/scannerEngine';

const projectRoot = process.cwd();
const traversalExclusions = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
const supported = /\.(html?|jsx?|tsx?|json|css|env|bat|cmd|ps1|ya?ml)$/i;

async function collectFiles(directory: string): Promise<File[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const collected: File[] = [];
  for (const entry of entries) {
    if (traversalExclusions.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collected.push(...await collectFiles(absolute));
      continue;
    }
    if (!supported.test(entry.name) && !entry.name.startsWith('.env')) continue;
    const relative = path.relative(projectRoot, absolute).replace(/\\/g, '/');
    collected.push(new File([await readFile(absolute)], relative));
  }
  return collected;
}

async function run() {
  const files = await collectFiles(projectRoot);
  const result = await scanArtifacts(files, 'external');
  const runtimeActionable = result.issues.filter((issue) => issue.sourceContext === 'runtime' && (issue.severity === 'critical' || issue.severity === 'high'));
  const contextual = result.issues.filter((issue) => issue.sourceContext !== 'runtime');

  console.log(`VibeGuard self-scan: score=${result.score}, files=${result.scannedFiles}, runtime-actionable=${runtimeActionable.length}, contextual=${contextual.length}`);
  for (const issue of runtimeActionable) console.log(`- [${issue.severity}] ${issue.title} (${issue.location})`);
  if (runtimeActionable.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
