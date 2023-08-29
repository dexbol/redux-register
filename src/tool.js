import {createStore as createReduxStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import {internalStore, Register, rootReducer} from './index.js';

export {Register, register, collectServerState} from './index.js';
export {StoreProvider, useStore} from './hook.js';

export function createStore(initalState) {
    var store = createReduxStore(
        null,
        initalState,
        compose(Register(), applyMiddleware(thunk.default || thunk))
    );

    // If register store namespace after the store object created,
    // we need replaceReducer to recreate the state, otherwise the state
    // don't include the namespace's initial state.
    internalStore.subscribe(() => store.reload());

    return store;
}
