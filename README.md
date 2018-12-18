# Redux Register

A [store enhancer](http://redux.js.org/docs/Glossary.html#store-enhancer)
for Redux. 

```shell
npm install --save redux-register
```

## Useage

It register reducers by namesapce, this make code splitting painless.
```javascript
import {createStore, compose} from 'redux';
import Register from 'redux-register';

// Enhance createStore.
// @see http://redux.js.org/docs/api/compose.html
var finalCreateStore = compose(Register())(createStore);

// No arguments here, the root reducer was exist in enhancer code.
var mystore = finalCreateStore();

// Register a reducer for the page /user/resetpassword
mystore.registerReducer('user.resetpassword', function(state, action) {
    // return newState
});

mystore.registerReducer('user.profile', function(state, action) {
    // return newState
});

console.info(mystore.getState())
```