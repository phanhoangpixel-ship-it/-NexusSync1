import * as fs from 'fs';
import * as path from 'path';

const filePath = 'src/modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We will just do some basic extraction of interfaces to types.ts to start.
// This is complex to do automatically with regex. I will use TS Morph.
