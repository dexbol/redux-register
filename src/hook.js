import React, {createContext, useMemo, useContext} from 'react';
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector.js';

const storeContext = createContext({});

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

export function useStore(selector) {
    var {store} = useContext(storeContext);
    var state = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        store.getState,
        selector,
        shallowEqual
    );

    return [state, store.dispatch];
}

export const StorePrivider = function ({store, children}) {
    var contextValue = useMemo(() => {
        return {
            store
        };
    }, []);

    return (
        <storeContext.Provider value={contextValue}>
            {children}
        </storeContext.Provider>
    );
};
