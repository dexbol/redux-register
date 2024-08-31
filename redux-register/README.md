# Redux Register

This document is for v5, for old versions is [here](https://github.com/dexbol/redux-register/tree/v4) .

Redux Register created in 2015, There was a problem that how to split code
when use redux then, and `redux-toolkit` have not created. now Redux Register
included some awesome features from redux-toolkit and react-react.

## Namespace, the core concept

The core concet in Redux Register is namespace. the namespace is a tree like in
[LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol).

```
                ROOT
                 |
                 |
        ---------------------
        |                    |
      BRANCH                LEAF
        |
   ------------
   |           |
  LEAF        LEAF

```

Leaves can store state, branches can not. for example:

```javascript
import {register} from 'redux-register';

register('page.one', {});

// ✅ It's ok
register('page.two', {});

// ✅ It's ok
register('metadata', {});

// ❌ Can't do this, page.one is a branch now.
register('page.one.module', {});
```

## Server Side Rendering

Redux Register v5 make SSR painless. You can define `getServerState` method
when registering namespace:

```javascript
import {register} from 'redux-register';

register('page.one', {
    initialState: {
        list: []
    },

    async getServerState({request}) {
        // Query database or fetch API
        // then return state.
        return ['state', 'from', 'server'];
    }
});
```

Then you can use `collectServerState` function create a initial state object
from all namspaces that define `getServerState`:

```javascript
import {collectServerState} from 'redux-register/serverstate';

// {
//     page: {
//         one: {
//             list: ['state', 'from', 'server']
//         }
//     }
// }
console.log(await collectServerState({request: 'http request object'}));
```

`collectServerState` function will perform all `getServerState` method in the
whole app. It will bring negative impact. for example, a online shop website,
register products list and product details namespace, the home page only need
products list state, but the product details state also created from database.
There is a performance problem. We can use `ServerState` object resolve this.

```javascript
import {ServerState} from 'redux-register/serverstate';

var serverState = new ServerState();

// collect which namespaces used (by useStore hook) in HomePage.
serverState.collectNamespaces(<HomePage />);

console.log(await serverState.collectState(parameter));
```

## Examples

More examples check [here](https://github.com/dexbol/redux-register/tree/master/examples)
