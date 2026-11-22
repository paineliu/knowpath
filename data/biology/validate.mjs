import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('biology', 4);
export { validatePackage as validateBiologyPackage, loadPackage as loadBiologyPackage };
