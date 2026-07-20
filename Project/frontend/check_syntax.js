import fs from 'fs';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';

const parser = acorn.Parser.extend(jsx());
const code = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf-8');

try {
  parser.parse(code, { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Syntax is valid!");
} catch (e) {
  console.error("Syntax Error:", e.message, "at line", e.loc?.line, "column", e.loc?.column);
}
