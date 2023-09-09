# Redux Register

This document is for v5, for old versions is [here](/dexbol/redux-register/tree/v4) .

Redux Register created in 2015, There was a problem that how to split code
when use redux then, and `redux-toolkit` have not created. now Redux Register
included some awesome features from redux-toolkit and react-react.

## Namespace, the core concept

The core concet in Redux Register is namespace. the namespace is a tree in
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

Leaves can store state, root and branches can not. for example:

```javascript
import {register} from 'redux-register';

register('page.one', {});

// ✅ It is ok
register('page.tow', {});

// ✅ It is ok
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

### ServerState API

- whiteList:property
  
  A Set Object that store which namespaces should be collected in server.
  Your can change this property manually:
  
```javascript
var serverState = new ServerState();

// If HomePage doesn't need pageMetadata, you can add it manually.
serverState.whiteList.add('pageMetadata');

await serverState.collectNamespaces(<HomePage />);

// Will include pageMetadata.
console.log(serverState.collectState());
```

- collectNamespaces(ReactComponent)
  
  Collect all namespaces that ReactComponent used by useStore hook, collected
  namespaces added to the `whiteList` property

- collectState(parameter)
  
  Performance `getServerState` methods from namespace that in whiteList.
  `parameter` will pass to `getServerState`:

```javascript
register('pageMetadata', {
    async getServerState({pathname}) {
        // /page/one
        console.log(pathname);
    }
});

var serverState = new ServerState();

serverState.collectState({pathname: '/page/one'});
```


## Examples

More examples check [here](/dexbol/redux-register/tree/master/examples)

