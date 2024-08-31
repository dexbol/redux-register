/**
 * @template T
 * @typedef {object} PayloadAction
 * @property {string} type
 * @property {T} payload
 */

export {Register, register} from './register.js';
export {StoreProvider, useStore, storeContext} from './hook.js';
export {createStore} from './tool.js';
