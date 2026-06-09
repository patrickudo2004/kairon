import { api } from './convex/_generated/api.js';
const query = api.authQueries.getCurrentUser;
const functionNameSym = Symbol.for("functionName");
console.log('Path name using Symbol:', query[functionNameSym]);
