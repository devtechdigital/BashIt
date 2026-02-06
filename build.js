const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;

function readFile(name) {
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}

function writeFile(name, data) {
  fs.writeFileSync(path.join(ROOT, name), data, 'utf8');
}

// Rewrite .md links to hash links for SPA
function rewriteLessonLinks(html) {
  return html.replace(/href="(\d{2})-([^"]+)\.md"/g, (_, num) => {
    return 'href="#lesson-' + num + '"';
  });
}

// Add IDs to headings for anchor links (marked doesn't do this by default in a simple way)
function addHeadingIds(html) {
  return html.replace(/<h([1-6])>([^<]+)<\/h\1>/g, (_, level, text) => {
    const id = text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
  });
}

// Add language-bash to code blocks that have no class (marked leaves them plain for ```)
function ensureCodeClass(html) {
  return html.replace(/<pre><code>\s*>/g, '<pre><code class="language-bash">>');
}

// Footer for each lesson: "Mark as complete" button
const LESSON_FOOTER = `
<div class="lesson-complete-wrap">
  <button type="button" class="lesson-complete-btn" onclick="window.bashLessons.markComplete()">Mark lesson complete</button>
</div>
`;

marked.setOptions({
  gfm: true,
  breaks: false
});

function convert(md, options = {}) {
  let html = marked.parse(md);
  html = addHeadingIds(html);
  html = ensureCodeClass(html);
  if (options.rewriteLinks) html = rewriteLessonLinks(html);
  return html.trim();
}

function main() {
  const template = readFile('index.template.html');

  const landingMd = readFile('00-cover-and-index.md');
  const landingHtml = convert(landingMd, { rewriteLinks: true });

  const replacements = {
    '{{LANDING_HTML}}': landingHtml
  };

  for (let i = 1; i <= 12; i++) {
    const num = String(i).padStart(2, '0');
    const filename = num + '-*.md';
    const files = fs.readdirSync(ROOT).filter(f => f.startsWith(num + '-') && f.endsWith('.md'));
    if (files.length === 0) throw new Error('Lesson file not found: ' + filename);
    const lessonMd = readFile(files[0]);
    let lessonHtml = convert(lessonMd);
    lessonHtml += LESSON_FOOTER;
    replacements['{{LESSON_' + num + '_HTML}}'] = lessonHtml;
  }

  let output = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    output = output.split(placeholder).join(value);
  }

  writeFile('index.html', output);
  console.log('Built index.html');
}

main();
