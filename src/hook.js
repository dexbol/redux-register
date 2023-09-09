import React, {createContext, useMemo, useContext} from 'react';
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector.js';
import {namespaceKey} from './register.js';

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
 * useStore hook.
 * @param {function} selector the first argument is the root state.
 * @returns {Array} A array of state and dispatch.
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
 * @function
 * @param {Object} props 
 * @param {Object} props.store redux store object
 * @param {ReactNode} props.children
 * @param {Object} props.extendedContext extended context
 * @returns {ReactNode}
 */
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
