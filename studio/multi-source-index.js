import { MULTI_SOURCE_CASES as BATCH_1 } from './multi-source-cases.js';
import { MULTI_SOURCE_CASES_BATCH_2 as BATCH_2 } from './multi-source-cases-batch2.js';
import { MULTI_SOURCE_CASES_BATCH_3 as BATCH_3 } from './multi-source-cases-batch3.js';
import { MULTI_SOURCE_CASES_BATCH_4 as BATCH_4 } from './multi-source-cases-batch4.js';
import { MULTI_SOURCE_CASES_BATCH_5 as BATCH_5 } from './multi-source-cases-batch5.js';

export const MULTI_SOURCE_CASES = [...BATCH_1, ...BATCH_2, ...BATCH_3, ...BATCH_4, ...BATCH_5];

export const MULTI_SOURCE_BATCH_STATS = {
  batch1: BATCH_1.length,
  batch2: BATCH_2.length,
  batch3: BATCH_3.length,
  batch4: BATCH_4.length,
  batch5: BATCH_5.length,
  total: BATCH_1.length + BATCH_2.length + BATCH_3.length + BATCH_4.length + BATCH_5.length
};
