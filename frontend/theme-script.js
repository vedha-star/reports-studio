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

  content = content.replace(/#4F46E5/gi, 'var(--primary)');
  content = content.replace(/#2563EB/gi, 'var(--primary)');
  content = content.replace(/#3730A3/gi, 'var(--primary-dark)');
  content = content.replace(/#1E40AF/gi, 'var(--primary-dark)');
  content = content.replace(/#EEF2FF/gi, 'var(--primary-light)');
  content = content.replace(/#EFF6FF/gi, 'var(--primary-light)');
  content = content.replace(/#E0E7FF/gi, 'var(--primary-light)');
  content = content.replace(/#DBEAFE/gi, 'var(--primary-light)');
  
  content = content.replace(/#10B981/gi, 'var(--accent)');
  content = content.replace(/#16A34A/gi, 'var(--accent)');
  
  content = content.replace(/#F8FAFC/gi, 'var(--background)');
  content = content.replace(/#F1F5F9/gi, 'var(--background)');
  content = content.replace(/#FAFBFF/gi, 'var(--background)');
  
  content = content.replace(/#FFFFFF/gi, 'var(--surface)');
  content = content.replace(/'#fff'/g, '\'var(--surface)\'');
  content = content.replace(/'#FFF'/g, '\'var(--surface)\'');
  
  content = content.replace(/#0F172A/gi, 'var(--text-primary)');
  content = content.replace(/#1E293B/gi, 'var(--text-primary)');
  content = content.replace(/#334155/gi, 'var(--text-primary)');
  content = content.replace(/#475569/gi, 'var(--text-primary)');
  
  content = content.replace(/#64748B/gi, 'var(--text-muted)');
  content = content.replace(/#94A3B8/gi, 'var(--text-muted)');
  
  content = content.replace(/#E2E8F0/gi, 'var(--border)');

  content = content.replace(/fontFamily:\s*['"'][^'"']*['"'],?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated: ' + filePath);
  }
});
