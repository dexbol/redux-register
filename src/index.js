import {produce} from 'immer';

export const reducerStructure = {};
export const serverStateStructure = {};

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

export function registerReducerByMap(namespace, initialState, mapObj = {}) {
    if (process.env.NODE_ENV !== 'production') {
        for (let p in mapObj) {
            if (p === 'undefined') {
                throw (
                    'ReducerMap object has a undefined key. ' +
                    'namespace=' +
                    namespace
                );
            } else if (p.indexOf('.') < 0) {
                throw (
                    'You maybe need a action type that includes ' +
                    'namespace [' +
                    namespace +
                    '] <' +
                    p +
                    '>.'
                );
            }
        }
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
            return initialState;
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

function defaultInit(state) {
    return state;
}

export async function traverseServerState(node, path, result, params) {
    if (typeof node === 'function') {
        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i];

            result = result[key] =
                typeof result[key] === 'undefined' ? {} : result[key];
        }

        result[path[path.length - 1]] = await node(params);
    } else if (node && typeof node === 'object') {
        for (let key of Object.keys(node)) {
            await traverseServerState(
                node[key],
                path.concat(key),
                result,
                params
            );
        }
    }
}

export async function collectServerState({whiteList = [], ...params} = {}) {
    var subServerStateStructure = createSubStructure({
        structure: serverStateStructure,
        whiteList
    });
    var serverState = {};

    await traverseServerState(subServerStateStructure, [], serverState, params);

    return serverState;
}

export function register(
    namespace,
    {initialState, init = defaultInit, getServerState, reducers = {}}
) {
    if (getServerState) {
        mountValueToStructure({
            structure: serverStateStructure,
            namespace,
            value: getServerState
        });
    }

    for (let key of Object.keys(reducers)) {
        if (!checkTypeNamespace(namespace, key)) {
            reducers[namespace + '.' + key] = reducers[key];
            delete reducers[key];
        }
    }

    return registerReducerByMap(namespace, initialState, reducers);
}

function enhanceStore(store) {
    store.register = function () {
        registerReducerByMap(...arguments);
        // performance `replacereducer` make the redux dispatch
        // replace action. this effectively populates the new state tree
        // included the new namespace registerd above.
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
