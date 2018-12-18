"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Register;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var reducerShape = {};

var makeFinalStateByReducerShape = function makeFinalStateByReducerShape(shape, path, result, state, action) {
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
};

var registerReducer = function registerReducer(namespace, reducer) {
  var namespace = namespace.split('.');
  var parent = reducerShape;

  for (var i = 0; i < namespace.length - 1; i++) {
    var key = namespace[i];
    parent = parent[key] = typeof parent[key] === 'undefined' ? {} : parent[key];
  }

  parent[namespace[namespace.length - 1]] = reducer;
};

var rootReducer = function rootReducer(state, action) {
  var finalState = {};

  if (state) {
    makeFinalStateByReducerShape(reducerShape, [], finalState, state, action);
  }

  return finalState;
};

var checkTypeNamespace = function checkTypeNamespace(ns, action) {
  // The action type does not include a namespace or a right namespace.
  return action.type.indexOf('.') < 0 || action.type.indexOf(ns + '.') === 0;
};

var enhanceStore = function enhanceStore(store) {
  store.register = function (namespace, reducer) {
    registerReducer.apply(void 0, arguments);
    this.replaceReducer(rootReducer);
  };

  store.registerByMap = function (namespace, initialState, mapobj) {
    if (process.env.NODE_ENV != 'production' && mapobj) {
      for (var p in mapobj) {
        if (p === 'undefined') {
          console.error('ReducerMap object has a undefined key. ' + 'namespace=' + namespace);
        } else if (p.indexOf('.') < 0) {
          console.warn('You maybe need a action type that includes ' + 'namespace <' + p + '>. The action type includes namespace can ' + 'improve performance.');
        }
      }
    }

    var mapobj = mapobj || {};
    var updateType = namespace + '.UPDATE';

    if (!mapobj[updateType]) {
      mapobj[updateType] = function (state, action) {
        if (typeof state.merge == 'function') {
          return state.merge(action.payload);
        }

        return state;
      };
    }

    var initType = namespace + '.INIT';

    if (!mapobj[initType]) {
      mapobj[initType] = function (state, action) {
        return initialState;
      };
    }

    this.register(namespace, function (state, action) {
      if (!state) {
        return initialState;
      }

      if (!checkTypeNamespace(namespace, action)) {
        return state;
      }

      if (process.env.NODE_ENV != 'production' && action.type.indexOf('@@redux') < 0) {
        if (typeof mapobj[action.type] !== 'function') {
          console.error('The action type "' + action.type + '" does not define yet.');
        } else if (mapobj[action.type](state, action) === undefined) {
          console.error('The reducer should return a new ' + 'state. ' + action.type + 'return undefined');
        }
      }

      return typeof mapobj[action.type] === 'function' ? mapobj[action.type](state, action) : state;
    });
  };

  return store;
};

function Register() {
  return function (next) {
    return function (reducer, initialState) {
      var store = enhanceStore(next(rootReducer, initialState));
      return store;
    };
  };
}

;