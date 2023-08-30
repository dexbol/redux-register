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
    constructor() {
        this.whiteList = new Set();
    }

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

    async collectState(params = {}) {
        return await collectServerState({
            whiteList: Array.from(this.whiteList),
            ...params
        });
    }
}
