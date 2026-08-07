#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyFinalEvidencePackage } from '../studio/evidence-package-engine.js';

const file=process.argv[2];
if(!file){console.error('Usage: node scripts/verify-final-evidence-package.mjs <final-evidence-package.json>');process.exit(2);}
const pkg=JSON.parse(await readFile(resolve(file),'utf8'));
const validation=await verifyFinalEvidencePackage(pkg);
console.log(JSON.stringify(validation,null,2));
if(!validation.ok)process.exitCode=1;
