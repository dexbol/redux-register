/** @module redux-register/serverstate */

import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {serverStateStructure, createSubStructure} from './register.js';
import {createStore} from './tool.js';
import {StoreProvider, storeContext} from './hook.js';

export async function traverseServerState(node, path, result, params) {
    if (typeof node?.getServerState === 'function') {
        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i];

            result = result[key] =
                typeof result[key] === 'undefined' ? {} : result[key];
        }

        result[path[path.length - 1]] = await node.getServerState({
            initialState: node.initialState,
            ...params
        });
    } else if (node && typeof node === 'object') {
        for (let key of Object.keys(node)) {
            await traverseServerState(
                node[key],
                path.concat(key),
                result,
                params
            );
        }
    }
}

export async function collectServerState({whiteList = [], ...params} = {}) {
    var subServerStateStructure = createSubStructure({
        structure: serverStateStructure,
        whiteList
    });
    var serverState = {};

    await traverseServerState(subServerStateStructure, [], serverState, params);

    return serverState;
}

export class ServerState {
    /** ServerState */
    constructor() {
        /**
         * A Set Object that store which namespaces should be collected in server.
         * Your can change this property manually.
         * 
         * @type {Set}
         * 
         * @example
         * var serverState = new ServerState();
         *
         * // If HomePage doesn't need pageMetadata, you can add it manually.
         * serverState.whiteList.add('pageMetadata');
         *
         * await serverState.collectNamespaces(<HomePage />);
         * // Will include pageMetadata.
         * console.log(serverState.collectState());
         */
        this.whiteList = new Set();
    }

    /**
     * @param {ReactElement} comp
     * Collect all namespaces that ReactComponent used by useStore hook, collected
     * namespaces added to the `whiteList` property
     */
    collectNamespaces(comp) {
        return new Promise((resolve, reject) => {
            var store = createStore();
            var whiteList = this.whiteList;
            renderToPipeableStream(
                <StoreProvider store={store} serverStateWhiteList={whiteList}>
                    {comp}
                </StoreProvider>,
                {
                    onAllReady() {
                        resolve(whiteList);
                    },
                    onError(err) {
                        resolve(whiteList);
                    }
                }
            );
        });
    }

    /**
     * @param {Object} params
     * Performance `getServerState` methods from namespace that in whiteList.
     * `parameter` will pass to `getServerState`:
     *
     * @example
     * register('pageMetadata', {
     *     async getServerState({pathname}) {
     *         // /page/one
     *         console.log(pathname);
     *     }
     * });
     *
     * var serverState = new ServerState();
     * serverState.collectState({pathname: '/page/one'});
     */
    async collectState(params = {}) {
        return await collectServerState({
            whiteList: Array.from(this.whiteList),
            ...params
        });
    }
}
