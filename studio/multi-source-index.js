import { MULTI_SOURCE_CASES as BATCH_1 } from './multi-source-cases.js';
import { MULTI_SOURCE_CASES_BATCH_2 as BATCH_2 } from './multi-source-cases-batch2.js';

export const MULTI_SOURCE_CASES = [...BATCH_1, ...BATCH_2];

export const MULTI_SOURCE_BATCH_STATS = {
  batch1: BATCH_1.length,
  batch2: BATCH_2.length,
  total: BATCH_1.length + BATCH_2.length
};
