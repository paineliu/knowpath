import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('history', 4);
export { validatePackage as validateHistoryPackage, loadPackage as loadHistoryPackage };
