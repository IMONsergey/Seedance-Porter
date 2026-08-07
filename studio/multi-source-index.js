import { MULTI_SOURCE_CASES as BATCH_1 } from './multi-source-cases.js';
import { MULTI_SOURCE_CASES_BATCH_2 as BATCH_2 } from './multi-source-cases-batch2.js';
import { MULTI_SOURCE_CASES_BATCH_3 as BATCH_3 } from './multi-source-cases-batch3.js';

export const MULTI_SOURCE_CASES = [...BATCH_1, ...BATCH_2, ...BATCH_3];

export const MULTI_SOURCE_BATCH_STATS = {
  batch1: BATCH_1.length,
  batch2: BATCH_2.length,
  batch3: BATCH_3.length,
  total: BATCH_1.length + BATCH_2.length + BATCH_3.length
};
