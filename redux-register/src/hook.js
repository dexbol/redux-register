import React, {createContext, useMemo, useContext} from 'react';
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector.js';
import {namespaceKey} from './register.js';

/**
 * @type {React.Context<{
 *     store?: import('redux').Store;
 *     serverStateWhiteList?: Set<string>;
 *     [key: string]: any;
 * }>}
 */
export const storeContext = createContext({});

function shallowEqual(objA, objB) {
    if (objA === objB) {
        return true;
    }

    if (
        typeof objA !== 'object' ||
        objA === null ||
        typeof objB !== 'object' ||
        objB === null
    ) {
        return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (
            !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
            objA[keysA[i]] !== objB[keysA[i]]
        ) {
            return false;
        }
    }
    return true;
}

/**
 * UseStore hook.
 *
 * @example
 *     const Component = function () {
 *         var [userInfo, dispatch] = useStore(
 *             (rootState) => rootState.userInfo
 *         );
 *
 *         return <h1>{userInfo.name}</h1>;
 *     };
 *
 * @param {(rootState: import('./register.js').Structure<any>) => any} selector
 *   The first argument is the root state.
 * @returns {[any, import('redux-thunk').ThunkDispatch]} A array of state and
 *   dispatch function.
 */
export function useStore(selector) {
    var {store, serverStateWhiteList} = useContext(storeContext);
    var state = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        store.getState,
        selector,
        shallowEqual
    );

    if (serverStateWhiteList) {
        try {
            if (state[namespaceKey]) {
                serverStateWhiteList.add(state[namespaceKey]);
            } else {
                Object.keys(state).forEach((key) => {
                    if (state[key][namespaceKey]) {
                        serverStateWhiteList.add(state[key][namespaceKey]);
                    }
                });
            }
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(e);
            }
        }
    }

    return [state, store.dispatch];
}

/**
 * @typedef {{[key: string]: any}} StoreProviderProps
 * @property {Object} store Redux store object
 * @property {React.ReactNode} children
 * @property {Set<string>} [serverStateWhiteList]
 */

/** @type {React.FC<StoreProviderProps>} */
export const StoreProvider = function ({store, children, ...extendedContext}) {
    var contextValue = useMemo(() => {
        return {
            store,
            ...extendedContext
        };
    }, []);

    return React.createElement(
        storeContext.Provider,
        {
            value: contextValue
        },
        children
    );
};
