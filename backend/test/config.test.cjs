const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('NestJS/Fastify backend build entrypoint exists', () => {
  assert.ok(fs.existsSync(path.join(root, 'src', 'main.ts')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'app.module.ts')));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['@nestjs/platform-fastify'] !== undefined, true);
  assert.equal(pkg.dependencies['pg'] !== undefined, true);
});
