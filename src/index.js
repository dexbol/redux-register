import produce from 'immer';

var reducerShape = {};

function makeFinalStateByReducerShape(shape, path, result, state, action) {
    if (typeof shape === 'function') {
        var obj = result;
        var value = state;

        for (var i = 0; i < path.length - 1; i++) {
            var key = path[i];

            obj = obj[key] = typeof obj[key] === 'undefined' ? {} : obj[key];
            value = (value && value[key]) || undefined;
        }

        obj[path[path.length - 1]] = shape(
            value && value[path[path.length - 1]],
            action
        );
    } else if (shape && typeof shape === 'object') {
        Object.keys(shape).forEach(function(key) {
            makeFinalStateByReducerShape(
                shape[key],
                path.concat(key),
                result,
                state,
                action
            );
        });
    }
}

function rootReducer(state, action) {
    var finalState = {};
    makeFinalStateByReducerShape(reducerShape, [], finalState, state, action);
    return finalState;
}

function registerReducer(namespace, reducer) {
    var parent = reducerShape;

    namespace = namespace.split('.');

    for (var i = 0; i < namespace.length - 1; i++) {
        var key = namespace[i];
        parent = parent[key] =
            typeof parent[key] === 'undefined' ? {} : parent[key];
    }

    parent[namespace[namespace.length - 1]] = reducer;
}

function checkTypeNamespace(ns, action) {
    return action.type.indexOf(ns + '.') === 0;
}

function registerReducerByMap(namespace, initialState, mapObj = {}) {
    if (process.env.NODE_ENV != 'production') {
        for (var p in mapObj) {
            if (p === 'undefined') {
                throw 'ReducerMap object has a undefined key. ' +
                    'namespace=' +
                    namespace;
            } else if (p.indexOf('.') < 0) {
                throw 'You maybe need a action type that includes ' +
                    'namespace [' +
                    namespace +
                    '] <' +
                    p +
                    '>.';
            }
        }
    }

    // Define UPDATE and INIT(RESET) action for convenience.
    const UPDATE_TYPE = namespace + '.UPDATE';
    const INIT_TYPE = namespace + '.INIT';
    const RESET_TYPE = namespace + '.RESET';

    if (!mapObj[UPDATE_TYPE]) {
        mapObj[UPDATE_TYPE] = function(state, action) {
            var data = action.payload;

            if (typeof data != 'object' || !data) {
                return state;
            }
            return produce(state, function(draft) {
                var keys = Object.keys(data);

                for (var i = 0; i < keys.length; i++) {
                    draft[keys[i]] = data[keys[i]];
                }
            });
        };
    }
    // Deprecated, use reset.
    if (!mapObj[INIT_TYPE]) {
        mapObj[INIT_TYPE] = function() {
            return initialState;
        };
    }
    if (!mapObj[RESET_TYPE]) {
        mapObj[RESET_TYPE] = function() {
            return initialState;
        };
    }

    registerReducer(namespace, function(state, action) {
        if (state === undefined) {
            return initialState;
        }

        if (!checkTypeNamespace(namespace, action)) {
            return state;
        }

        if (typeof mapObj[action.type] !== 'function') {
            throw 'The action type "' + action.type + '" does not define yet.';
        }

        state = produce(mapObj[action.type])(state, action);

        if (process.env.NODE_ENV != 'production' && state === undefined) {
            throw 'The reducer should return a new ' +
                'state. [' +
                action.type +
                '] return undefined';
        }

        return state;
    });
}

function enhanceStore(store) {
    store.register = function() {
        registerReducerByMap(...arguments);
        // Performance `replaceReducer` make the redux dispatch
        // REPLACE action. This effectively populates the new state tree
        // included the new namespace registerd above.
        this.replaceReducer(rootReducer);
    };
    return store;
}

// Export functions for test.
export {
    reducerShape,
    makeFinalStateByReducerShape,
    rootReducer,
    registerReducer,
    checkTypeNamespace,
    registerReducerByMap
};

export default function Register() {
    return (next) => (reducer, initialState) => {
        return enhanceStore(next(rootReducer, initialState));
    };
}
