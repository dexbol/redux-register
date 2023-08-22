import {createStore as createReduxStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import {Register, rootReducer} from './index.js';

export {Register, register, collectServerState} from './index.js';
export {StoreProvider, useStore} from './hook.js';

export function createStore(initalState) {
    return createReduxStore(
        null,
        initalState,
        compose(Register(), applyMiddleware(thunk.default || thunk))
    );
}
