import { packageValidator } from '../shared/validate.mjs';
export const { validatePackage, loadPackage } = packageValidator('physics', 4);
export { validatePackage as validatePhysicsPackage, loadPackage as loadPhysicsPackage };
