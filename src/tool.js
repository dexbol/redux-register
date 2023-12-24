import {createStore as createReduxStore, applyMiddleware, compose} from 'redux';
import {thunk} from 'redux-thunk';
import {internalStore, Register} from './register.js';

/**
 * Create redux store with some middlewares (thunk and Redux Register).
 * @function
 * @param {Object} initalState
 * @returns {Object} Redux store object.
 */
export function createStore(initalState) {
    var store = createReduxStore(
        (state) => state,
        initalState,
        compose(Register(), applyMiddleware(thunk))
    );

    // If register store namespace after the store object created,
    // we need replaceReducer to recreate the state, otherwise the state
    // don't include the namespace's initial state.
    internalStore.subscribe(() => store.reload());

    return store;
}
