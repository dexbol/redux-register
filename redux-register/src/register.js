import {legacy_createStore as createStore} from 'redux';
import {produce} from 'immer';

export const namespaceKey = Symbol('redux-namespace');
export const reducerStructure = {};
export const serverStateStructure = {};
export const internalStore = createStore((state) => state);

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

export function mountValueToStructure({structure, namespace, value}) {
    var node = structure;

    namespace = namespace.split('.');
    for (let i = 0; i < namespace.length - 1; i++) {
        let key = namespace[i];
        node = node[key] = typeof node[key] === 'undefined' ? {} : node[key];
    }
    node[namespace[namespace.length - 1]] = value;
}

export function getValueFromStructure({structure, namespace}) {
    var node = structure;

    namespace = namespace.split('.');

    for (let key of namespace) {
        node = node[key];
        if (!node) {
            return node;
        }
    }

    return node;
}

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

export function registerReducer(namespace, reducer) {
    mountValueToStructure({
        structure: reducerStructure,
        namespace,
        value: reducer
    });
}

export function checkTypeNamespace(namespace, actionType) {
    return actionType.indexOf(namespace + '.') === 0;
}

function defaultInit(state) {
    return state;
}

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
 * @param {Object} options.initialState The initial state
 * @param {(initialState: object) => any} [options.init] The function to
 *   initialize the state, the first argument is the initialState
 * @param {(params: object) => Promise} [options.getServerState] Should return a
 *   promise or a async function
 * @param {import('redux').ReducersMapObject} [options.reducers] The reducer map
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
    store.register = function () {
        registerReducerByMap(...arguments);
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

export function Register() {
    return (next) => (reducer, initialState) => {
        return enhanceStore(next(rootReducer, initialState));
    };
}

export default Register;
