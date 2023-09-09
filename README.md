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

## Examples

More examples check [here](/dexbol/redux-register/tree/master/examples)

# API
## Modules

<dl>
<dt><a href="#module_redux-register/serverstate">redux-register/serverstate</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#useStore">useStore(selector)</a> ⇒ <code>Array</code></dt>
<dd><p>useStore hook.</p>
</dd>
<dt><a href="#StoreProvider">StoreProvider(props)</a> ⇒ <code>ReactNode</code></dt>
<dd></dd>
<dt><a href="#register">register(namespace, options)</a> ⇒ <code>Object</code></dt>
<dd><p>Register a namespace.</p>
</dd>
<dt><a href="#createStore">createStore(initalState)</a> ⇒ <code>Object</code></dt>
<dd><p>Create redux store with some middlewares (thunk and Redux Register).</p>
</dd>
</dl>

<a name="module_redux-register/serverstate"></a>

## redux-register/serverstate

* [redux-register/serverstate](#module_redux-register/serverstate)
    * [.ServerState](#module_redux-register/serverstate.ServerState)
        * [new exports.ServerState()](#new_module_redux-register/serverstate.ServerState_new)
        * [.whiteList](#module_redux-register/serverstate.ServerState+whiteList) : <code>Set</code>
        * [.collectNamespaces(comp)](#module_redux-register/serverstate.ServerState+collectNamespaces)
        * [.collectState(params)](#module_redux-register/serverstate.ServerState+collectState)

<a name="module_redux-register/serverstate.ServerState"></a>

### redux-register/serverstate.ServerState
**Kind**: static class of [<code>redux-register/serverstate</code>](#module_redux-register/serverstate)  

* [.ServerState](#module_redux-register/serverstate.ServerState)
    * [new exports.ServerState()](#new_module_redux-register/serverstate.ServerState_new)
    * [.whiteList](#module_redux-register/serverstate.ServerState+whiteList) : <code>Set</code>
    * [.collectNamespaces(comp)](#module_redux-register/serverstate.ServerState+collectNamespaces)
    * [.collectState(params)](#module_redux-register/serverstate.ServerState+collectState)

<a name="new_module_redux-register/serverstate.ServerState_new"></a>

#### new exports.ServerState()
ServerState

<a name="module_redux-register/serverstate.ServerState+whiteList"></a>

#### serverState.whiteList : <code>Set</code>
A Set Object that store which namespaces should be collected in server.
Your can change this property manually.

**Kind**: instance property of [<code>ServerState</code>](#module_redux-register/serverstate.ServerState)  
**Example**  
```js
var serverState = new ServerState();

// If HomePage doesn't need pageMetadata, you can add it manually.
serverState.whiteList.add('pageMetadata');

await serverState.collectNamespaces(<HomePage />);
// Will include pageMetadata.
console.log(serverState.collectState());
```
<a name="module_redux-register/serverstate.ServerState+collectNamespaces"></a>

#### serverState.collectNamespaces(comp)
**Kind**: instance method of [<code>ServerState</code>](#module_redux-register/serverstate.ServerState)  

| Param | Type | Description |
| --- | --- | --- |
| comp | <code>ReactElement</code> | Collect all namespaces that ReactComponent used by useStore hook, collected namespaces added to the `whiteList` property |

<a name="module_redux-register/serverstate.ServerState+collectState"></a>

#### serverState.collectState(params)
**Kind**: instance method of [<code>ServerState</code>](#module_redux-register/serverstate.ServerState)  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | Performance `getServerState` methods from namespace that in whiteList. `parameter` will pass to `getServerState`: |

**Example**  
```js
register('pageMetadata', {
    async getServerState({pathname}) {
        // /page/one
        console.log(pathname);
    }
});

var serverState = new ServerState();
serverState.collectState({pathname: '/page/one'});
```
<a name="useStore"></a>

## useStore(selector) ⇒ <code>Array</code>
useStore hook.

**Kind**: global function  
**Returns**: <code>Array</code> - A array of state and dispatch.  

| Param | Type | Description |
| --- | --- | --- |
| selector | <code>function</code> | the first argument is the root state. |

<a name="StoreProvider"></a>

## StoreProvider(props) ⇒ <code>ReactNode</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| props | <code>Object</code> |  |
| props.store | <code>Object</code> | redux store object |
| props.children | <code>ReactNode</code> |  |
| props.extendedContext | <code>Object</code> | extended context |

<a name="register"></a>

## register(namespace, options) ⇒ <code>Object</code>
Register a namespace.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| namespace | <code>string</code> | e.g. 'user' or 'user.profile' |
| options | <code>Object</code> |  |
| options.initialState | <code>Object</code> |  |
| [options.init] | <code>function</code> | the function to initialize the state,  the first argument is the initialState |
| [options.getServerState] | <code>function</code> | should return a promise or a async function |

<a name="createStore"></a>

## createStore(initalState) ⇒ <code>Object</code>
Create redux store with some middlewares (thunk and Redux Register).

**Kind**: global function  
**Returns**: <code>Object</code> - Redux store object.  

| Param | Type |
| --- | --- |
| initalState | <code>Object</code> | 

