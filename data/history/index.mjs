import { buildIndex } from '../shared/index.mjs';
import { validatePackage } from './validate.mjs';
export * from './validate.mjs';
export const createIndex = pkg => buildIndex(validatePackage, pkg);
export { createIndex as createHistoryIndex };
