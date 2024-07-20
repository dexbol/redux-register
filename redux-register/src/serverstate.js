import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {serverStateStructure, createSubStructure} from './register.js';
import {createStore} from './tool.js';
import {StoreProvider} from './hook.js';

/**
 * @param {import('./register.js').ServerStateStructureNode
 *     | import('./register.js').ServerStateStructure} node
 * @param {string[]} path
 * @param {object} result
 * @param {object} params
 */
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

/**
 * @param {object} param
 * @param {string[]} [param.whiteList]
 * @param {object} [param.params]
 * @returns
 */
export async function collectServerState({whiteList = [], ...params} = {}) {
    var subServerStateStructure = createSubStructure({
        structure: serverStateStructure,
        whiteList
    });
    var serverState = {};

    await traverseServerState(subServerStateStructure, [], serverState, params);

    return serverState;
}

/** @class ServerState */
export class ServerState {
    constructor() {
        /**
         * A Set Object that store which namespaces should be collected in
         * server. Your can change this property manually.
         *
         * @type {Set}
         */
        this.whiteList = new Set();
    }

    /**
     * @param {React.ReactNode} comp Collect all namespaces from React Node that
     *   using useStore hook, the collected namespaces will add to the
     *   `whiteList` property
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
     * Traverse the store and collect all namespaces in whiteList.
     *
     * @example
     *     register('pageMetadata', {
     *         async getServerState(param) {
     *             // {a: 1}
     *             console.log(param);
     *         }
     *     });
     *
     *     var serverState = new ServerState();
     *     // This param will pass to `getServerState` method
     *     var param = {a: 1};
     *     serverState.collectState(param);
     *
     * @param {Object} params Performance `getServerState` methods from
     *   namespace that in whiteList. `parameter` will pass to
     *   `getServerState`:
     * @returns {Promise<Object>} The collected server state
     */
    async collectState(params = {}) {
        return await collectServerState({
            whiteList: Array.from(this.whiteList),
            ...params
        });
    }
}
