const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf-8');
const sourceFile = ts.createSourceFile('src/App.tsx', code, ts.ScriptTarget.Latest, true);

function traverse(node) {
    // just looking for where the error starts
}
console.log("No syntax error parsing? ", sourceFile.parseDiagnostics.length === 0);
if (sourceFile.parseDiagnostics.length > 0) {
    const d = sourceFile.parseDiagnostics[0];
    const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
    console.log("First error at:", pos.line + 1, pos.character + 1, d.messageText);
}
