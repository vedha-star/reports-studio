const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix broken syntax from previous regex
  content = content.replace(/Outfit',\s*sans-serif",\s*/g, '');
  content = content.replace(/DM Sans',\s*system-ui,\s*sans-serif",\s*/g, '');
  content = content.replace(/DM Sans',\s*sans-serif",\s*/g, '');
  
  // Clean up the stray import if any
  content = content.replace(/import \{ Outfit \} from 'next\/dist\/compiled\/@next\/font\/dist\/google';\r?\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed syntax in: ' + filePath);
  }
});
