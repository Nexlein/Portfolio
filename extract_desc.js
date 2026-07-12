import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Just simple regex extraction
const content = fs.readFileSync('src/data/projects.ts', 'utf-8');

const projectBlocks = content.split('id:').slice(1);
const enObj = {};
const frObj = {};

for (const block of projectBlocks) {
    const idMatch = block.match(/^\s*'([^']+)'/);
    if (!idMatch) continue;
    const id = idMatch[1];

    // find en:
    const enMatch = block.match(/en:\s*(['"`])(.*?)\1/s);
    const frMatch = block.match(/fr:\s*(['"`])(.*?)\1/s);

    if (enMatch) enObj[id] = enMatch[2].replace(/\n\s*/g, ' ');
    if (frMatch) frObj[id] = frMatch[2].replace(/\n\s*/g, ' ');
}

fs.writeFileSync('extracted_en.json', JSON.stringify(enObj, null, 4));
fs.writeFileSync('extracted_fr.json', JSON.stringify(frObj, null, 4));
