const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];
const basePath = process.argv[3] || 'src';

if (!moduleName) {
  console.error('Usage: node scaffold-module.cjs <moduleName> [basePath]');
  process.exit(1);
}

const dirs = [
  path.join(basePath, 'routes'),
  path.join(basePath, 'controllers'),
  path.join(basePath, 'services'),
  path.join(basePath, 'validators')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const routeFile = path.join(basePath, 'routes', `${moduleName}.js`);
if (!fs.existsSync(routeFile)) {
  fs.writeFileSync(routeFile, `const express = require('express');\nconst router = express.Router();\n\nmodule.exports = router;\n`);
  console.log(`Created file: ${routeFile}`);
}

console.log(`Successfully scaffolded module: ${moduleName}`);
