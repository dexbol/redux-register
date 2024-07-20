import {legacy_createStore as createStore} from 'redux';
import {produce} from 'immer';

/**
 * @template T
 * @typedef {{[key: string]: T | Structure<T>}} Structure
 */

/** @typedef {Structure<import('redux').Reducer>} ReducerStructure */

/**
 * @typedef {{
 *     getServerState: (...any) => Promise;
 *     initialState: (any) => any;
 * }} ServerStateStructureNode
 */

/** @typedef {Structure<ServerStateStructureNode>} ServerStateStructure */

export const namespaceKey = Symbol('redux-namespace');
/** @type {ReducerStructure} */
export const reducerStructure = {};
/** @type {ServerStateStructure} */
export const serverStateStructure = {};
export const internalStore = createStore((state) => state);

/**
 * Traval the reducer structure and make the final state.
 *
 * @param {ReducerStructure | import('redux').Reducer} node
 * @param {string[]} path
 * @param {object} result
 * @param {object} state
 * @param {import('redux').UnknownAction} action
 */
export function makeFinalStateByReducerStructure(
    node,
    path,
    result,
    state,
    action
) {
    if (typeof node === 'function') {
        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i];

            result = result[key] =
                typeof result[key] === 'undefined' ? {} : result[key];
            state = (state && state[key]) || undefined;
        }

        result[path[path.length - 1]] = node(
            state && state[path[path.length - 1]],
            action
        );
    } else if (node && typeof node === 'object') {
        Object.keys(node).forEach((key) => {
            makeFinalStateByReducerStructure(
                node[key],
                path.concat(key),
                result,
                state,
                action
            );
        });
    }
}

/**
 * @param {object} state
 * @param {import('redux').UnknownAction} action
 * @returns {object}
 */
export function rootReducer(state, action) {
    var finalState = Object.assign({}, state);

    makeFinalStateByReducerStructure(
        reducerStructure,
        [],
        finalState,
        state,
        action
    );

    return finalState;
}

/**
 * @param {object} param
 * @param {Structure<any>} param.structure
 * @param {string} param.namespace
 * @param {any} param.value
 */
export function mountValueToStructure({structure, namespace, value}) {
    var node = structure;
    var splitedNamespace = namespace.split('.');

    for (let i = 0; i < splitedNamespace.length - 1; i++) {
        let key = splitedNamespace[i];
        node = node[key] = typeof node[key] === 'undefined' ? {} : node[key];
    }
    node[splitedNamespace[splitedNamespace.length - 1]] = value;
}

/**
 * @param {object} param
 * @param {Structure<any>} param.structure
 * @param {string} param.namespace
 * @returns {any}
 */
export function getValueFromStructure({structure, namespace}) {
    var node = structure;

    for (let key of namespace.split('.')) {
        node = node[key];
        if (!node) {
            return node;
        }
    }

    return node;
}

/**
 * @param {object} param
 * @param {Structure<any>} param.structure
 * @param {string[]} param.whiteList
 * @returns {Structure<any>}
 */
export function createSubStructure({structure, whiteList}) {
    var subStructure = {};

    if (whiteList.length === 0) {
        return structure;
    }
    for (let path of whiteList) {
        mountValueToStructure({
            structure: subStructure,
            namespace: path,
            value: getValueFromStructure({structure, namespace: path})
        });
    }

    return subStructure;
}

/**
 * @param {string} namespace
 * @param {import('redux').Reducer} reducer
 */
export function registerReducer(namespace, reducer) {
    mountValueToStructure({
        structure: reducerStructure,
        namespace,
        value: reducer
    });
}

/**
 * @param {string} namespace
 * @param {string} actionType
 * @returns {boolean}
 */
export function checkTypeNamespace(namespace, actionType) {
    return actionType.indexOf(namespace + '.') === 0;
}

function defaultInit(state) {
    return state;
}

/**
 * @param {string} namespace
 * @param {any} initialState
 * @param {(any) => any} init
 * @param {{[key: string]: import('redux').Reducer}} mapObj
 * @returns
 */
export function registerReducerByMap(
    namespace,
    initialState,
    init,
    mapObj = {}
) {
    if (typeof init !== 'function') {
        mapObj = init || {};
        init = defaultInit;
    }

    if (process.env.NODE_ENV !== 'production') {
        for (let p in mapObj) {
            if (p === 'undefined') {
                throw (
                    'ReducerMap object has a undefined key. ' +
                    'namespace=' +
                    namespace
                );
            }
        }
    }

    if (typeof initialState === 'object' && initialState !== null) {
        initialState[namespaceKey] = namespace;
    }

    // Define UPDATE and RESET action for convenience.
    const UPDATE_TYPE = namespace + '.UPDATE';
    const RESET_TYPE = namespace + '.RESET';

    if (!mapObj[UPDATE_TYPE]) {
        mapObj[UPDATE_TYPE] = function (stateDraft, action) {
            var data = action.payload;

            if (typeof data != 'object' || !data) {
                return stateDraft;
            }

            var keys = Object.keys(data);

            for (var i = 0; i < keys.length; i++) {
                stateDraft[keys[i]] = data[keys[i]];
            }
        };
    }
    if (!mapObj[RESET_TYPE]) {
        mapObj[RESET_TYPE] = function () {
            return initialState;
        };
    }

    registerReducer(namespace, function (state, action) {
        if (state === undefined) {
            return init(initialState);
        }

        if (!checkTypeNamespace(namespace, action.type)) {
            return state;
        }

        if (typeof mapObj[action.type] !== 'function') {
            throw 'The action type "' + action.type + '" does not define yet.';
        }

        state = produce(mapObj[action.type])(state, action);

        if (process.env.NODE_ENV !== 'production' && state === undefined) {
            throw (
                'The reducer should return a new ' +
                'state. [' +
                action.type +
                '] return undefined'
            );
        }

        return state;
    });

    return {
        actions: Object.keys(mapObj).reduce((result, key) => {
            result[key.replace(namespace + '.', '')] = function (payload) {
                return {
                    type: key,
                    payload
                };
            };
            return result;
        }, {})
    };
}

/**
 * Register a namespace.
 *
 * @param {string} namespace E.g. 'user' or 'user.profile'
 * @param {Object} options
 * @param {any} options.initialState The initial state
 * @param {(initialState: any) => any} [options.init] The function to initialize
 *   the state, the first argument is the initialState
 * @param {(...any) => Promise} [options.getServerState] Should return a promise
 *   or a async function
 * @param {{[key: string]: import('redux').Reducer}} [options.reducers] The
 *   reducer map
 * @returns {{actions: import('redux').ActionCreatorsMapObject}}
 */
export function register(
    namespace,
    {initialState, init = defaultInit, getServerState, reducers = {}}
) {
    var result;

    if (getServerState) {
        mountValueToStructure({
            structure: serverStateStructure,
            namespace,
            value: {getServerState, initialState: init(initialState)}
        });
    }

    for (let key of Object.keys(reducers)) {
        if (!checkTypeNamespace(namespace, key)) {
            reducers[namespace + '.' + key] = reducers[key];
            delete reducers[key];
        }
    }

    result = registerReducerByMap(namespace, initialState, init, reducers);
    internalStore.dispatch({type: 'reducer-struture-updated'});

    return result;
}

export function enhanceStore(store) {
    /** @deprecated */
    store.register = function (namespace, initialState, init, mapObj) {
        registerReducerByMap(namespace, initialState, init, mapObj);
        // performance `replacereducer` make the redux dispatch
        // replace action. this effectively populates the new state tree
        // included the new namespace registerd above.
        this.replaceReducer(rootReducer);
    };
    store.reload = function () {
        this.replaceReducer(rootReducer);
    };
    return store;
}

/** @deprecated */
export function Register() {
    return (next) => (reducer, initialState) => {
        return enhanceStore(next(rootReducer, initialState));
    };
}

export default Register;
