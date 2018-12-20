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
var store = finalCreateStore();

// Namespaces and Action Types
const NAMESPACE = 'page.one';
const CHANGE_TITLE = NAMESPACE + '.CHANGE_TITLE';
const APPEND_LIST = NAMESPACE + '.APPEND_LIST';

// Register a reducer for the page.
store.register('page.one', {
    title: 'page one',
    list: []
}, {
    [CHANGE_TITLE](state, action) {
        state.title = action.payload;
        return state;
    },

    [APPEND_LIST](state, action) {
        state = Object.assign({}, state);
        state.list = state.list.concat(action.payload);
        return state;
    }
});

// Inital state.
/*
{
    "page": {
        "one": {
            "title": "page one",
            "list": []
        }
    }
}
*/
console.info(JSON.stringify(store.getState(), null, 4));

store.dispatch({
    type: CHANGE_TITLE,
    payload: 'xx'
});

/*
{
    "page": {
        "one": {
            "title": "xx",
            "list": []
        }
    }
}
*/
console.info(JSON.stringify(store.getState(), null, 4));

store.dispatch({
    type: APPEND_LIST,
    payload: 'yy'
});

/*
{
    "page": {
        "one": {
            "title": "xx",
            "list": [
                "yy"
            ]
        }
    }
}
*/
console.info(JSON.stringify(store.getState(), null, 4));
```
For more details see the example.
