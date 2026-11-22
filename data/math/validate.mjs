import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('math', 10);
export { validatePackage as validateMathPackage, loadPackage as loadMathPackage };
