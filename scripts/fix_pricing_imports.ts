import * as fs from 'fs';
import * as path from 'path';

function findAndReplace(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findAndReplace(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("from './utils'")) {
               const relativePathToUtils = path.relative(path.dirname(fullPath), path.join(process.cwd(), 'src', 'utils', 'pricingCalculator')).replace(/\\/g, '/');
               content = content.replace(/from '\.\/utils'/g, `from '${relativePathToUtils.startsWith('.') ? relativePathToUtils : './' + relativePathToUtils}'`);
               fs.writeFileSync(fullPath, content);
               console.log(`Updated ${fullPath}`);
            }
        }
    }
}

findAndReplace('src');
