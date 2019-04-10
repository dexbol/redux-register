"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeFinalStateByReducerShape = makeFinalStateByReducerShape;
exports.rootReducer = rootReducer;
exports.registerReducer = registerReducer;
exports.checkTypeNamespace = checkTypeNamespace;
exports.registerReducerByMap = registerReducerByMap;
exports.default = Register;
exports.reducerShape = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var reducerShape = {};
exports.reducerShape = reducerShape;

function makeFinalStateByReducerShape(shape, path, result, state, action) {
  if (typeof shape === 'function') {
    var obj = result;
    var value = state;

    for (var i = 0; i < path.length - 1; i++) {
      var key = path[i];
      obj = obj[key] = typeof obj[key] === 'undefined' ? {} : obj[key];
      value = value && value[key] || undefined;
    }

    obj[path[path.length - 1]] = shape(value && value[path[path.length - 1]], action);
  } else if (shape && _typeof(shape) === 'object') {
    Object.keys(shape).forEach(function (key) {
      makeFinalStateByReducerShape(shape[key], path.concat(key), result, state, action);
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
    parent = parent[key] = typeof parent[key] === 'undefined' ? {} : parent[key];
  }

  parent[namespace[namespace.length - 1]] = reducer;
}

function checkTypeNamespace(ns, action) {
  return action.type.indexOf(ns + '.') === 0;
}

function registerReducerByMap(namespace, initialState) {
  var mapObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (process.env.NODE_ENV != 'production') {
    for (var p in mapObj) {
      if (p === 'undefined') {
        throw 'ReducerMap object has a undefined key. ' + 'namespace=' + namespace;
      } else if (p.indexOf('.') < 0) {
        throw 'You maybe need a action type that includes ' + 'namespace [' + namespace + '] <' + p + '>.';
      }
    }
  } // Define UPDATE and INIT action for convenience.


  var updateType = namespace + '.UPDATE';
  var initType = namespace + '.INIT';

  if (!mapObj[updateType]) {
    mapObj[updateType] = function (state, action) {
      // Guess the state is a Immutable collection
      if (typeof state.merge == 'function' && action.payload) {
        return state.merge(action.payload);
      }

      return state;
    };
  }

  if (!mapObj[initType]) {
    mapObj[initType] = function (state, action) {
      return initialState;
    };
  }

  registerReducer(namespace, function (state, action) {
    if (state === undefined) {
      return initialState;
    }

    if (!checkTypeNamespace(namespace, action)) {
      return state;
    }

    if (typeof mapObj[action.type] !== 'function') {
      throw 'The action type "' + action.type + '" does not define yet.';
    }

    state = mapObj[action.type](state, action);

    if (process.env.NODE_ENV != 'production' && state === undefined) {
      throw 'The reducer should return a new ' + 'state. [' + action.type + '] return undefined';
    }

    return state;
  });
}

function enhanceStore(store) {
  store.register = function () {
    registerReducerByMap.apply(void 0, arguments); // Performance `replaceReducer` make the redux dispatch
    // REPLACE action. This effectively populates the new state tree
    // included the new namespace registerd above.

    this.replaceReducer(rootReducer);
  };

  return store;
} // Export functions for test.


function Register() {
  return function (next) {
    return function (reducer, initialState) {
      return enhanceStore(next(rootReducer, initialState));
    };
  };
}
