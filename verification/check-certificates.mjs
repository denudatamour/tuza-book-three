import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const [script, args, expected] of [
  ['structural_potential_check.mjs', ['--simple780'], 'structural_potential_check_780.json'],
  ['audit-final-gap.mjs', [], 'audit-final-gap.json'],
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args],
    {encoding: 'utf8', timeout: 30000});
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), JSON.parse(readFileSync(new URL(expected, import.meta.url), 'utf8')));
  console.log(script + ': PASS, archived JSON reproduced');
}
