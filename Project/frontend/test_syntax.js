import * as acorn from 'acorn';
import jsx from 'acorn-jsx';

const parser = acorn.Parser.extend(jsx());
const code = `
const App = () => (
  <div>
    {activeTab === 'users' && (() => {
      return (
        <div>test</div>
      );
    })()}
  </div>
);
`;

try {
  parser.parse(code, { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Syntax is valid!");
} catch (e) {
  console.error("Syntax Error:", e.message);
}
