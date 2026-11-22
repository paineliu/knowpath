import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('geography', 4);
export { validatePackage as validateGeographyPackage, loadPackage as loadGeographyPackage };
