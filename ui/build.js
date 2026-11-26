// Builds ui/ui.js by concatenating ui/src/*.js in name order. No transpile, no dependencies.
// Usage: node ui/build.js
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const src = path.join(dir, 'src');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
let out = '/* 빛의 원정대 UI — generated from ui/src by build.js. Edit ui/src/*.js, then run: node ui/build.js */\n';
for (const f of files) out += '\n/* ---- src/' + f + ' ---- */\n' + fs.readFileSync(path.join(src, f), 'utf8') + '\n';
new Function(out); // syntax check (throws on error)
fs.writeFileSync(path.join(dir, 'ui.js'), out);
console.log('built ui.js from ' + files.length + ' files, ' + out.length + ' chars');
