"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeFinalStateByReducerShape = makeFinalStateByReducerShape;
exports.rootReducer = rootReducer;
exports.registerReducer = registerReducer;
exports.checkTypeNamespace = checkTypeNamespace;
exports.registerReducerByMap = registerReducerByMap;
exports["default"] = Register;
exports.reducerShape = void 0;

var _immer = _interopRequireWildcard(require("immer"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(0, _immer.enableES5)();
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
  } // Define UPDATE and RESET action for convenience.


  var UPDATE_TYPE = namespace + '.UPDATE';
  var RESET_TYPE = namespace + '.RESET';

  if (!mapObj[UPDATE_TYPE]) {
    mapObj[UPDATE_TYPE] = function (stateDraft, action) {
      var data = action.payload;

      if (_typeof(data) != 'object' || !data) {
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

    if (!checkTypeNamespace(namespace, action)) {
      return state;
    }

    if (typeof mapObj[action.type] !== 'function') {
      throw 'The action type "' + action.type + '" does not define yet.';
    }

    state = (0, _immer["default"])(mapObj[action.type])(state, action);

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
