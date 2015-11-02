
var reducerShape = {};

var makeFinalStateByReducerShape = function (shape, path, result, state, action) {
    if (typeof shape === 'function') {
        var obj = result;
        var value = state;
        for (var i = 0; i < path.length - 1; i++) {
            var key = path[i];

            obj = obj[key] = typeof obj[key] === 'undefined' ? {} : obj[key];
            value = value && value[key] || undefined;
        }

        obj[path[path.length - 1]] = shape(value && value[path[path.length - 1]], action);
    } else if (shape && typeof shape === 'object') {
        Object.keys(shape).forEach(function (key) {
            makeFinalStateByReducerShape(shape[key], path.concat(key), result, state, action);
        });
    }
};

var registerReducer = function (namespace, reducer) {
    var namespace = namespace.split('.');
    var parent = reducerShape;

    for (var i = 0; i < namespace.length - 1; i++) {
        var key = namespace[i];
        parent = parent[key] = typeof parent[key] === 'undefined' ? {} : parent[key];
    }

    parent[namespace[namespace.length - 1]] = reducer;
};

var rootReducer = function (state, action) {
    var finalState = {};

    if (state) {
        makeFinalStateByReducerShape(reducerShape, [], finalState, state, action);
    }
    return finalState;
};

export default function Register() {
    return next => (reducer, initialState) => {
        var store = next(rootReducer, initialState);
        store.registerReducer = function (namespace, reducer) {
            registerReducer(...arguments);
            this.replaceReducer(rootReducer);
        };
        return store;
    };
};

