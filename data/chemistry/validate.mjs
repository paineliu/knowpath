import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('chemistry', 4);
export { validatePackage as validateChemistryPackage, loadPackage as loadChemistryPackage };
