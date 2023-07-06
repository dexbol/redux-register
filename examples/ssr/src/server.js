import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import Koa from 'koa';
import koaSend from 'koa-send';
import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {
    createStore,
    StoreProvider,
    collectServerState
} from '../../../lib/tool.js';
import App from './app.js';
import Page from './page.js';

const projectDirname = path.dirname(
    path.join(fileURLToPath(import.meta.url), '..')
);
const app = new Koa();

function renderReactNode(node, options = {}) {
    return new Promise((resolve, reject) => {
        var defaultOption = {
            bootstrapScriptContent: '',
            bootstrapScripts: [],
            onAllReady() {
                resolve({
                    pipe
                });
            },
            onError(err) {
                reject(err);
            },
            onShellReady() {},
            onShellError() {}
        };
        var {pipe} = renderToPipeableStream(
            node,
            Object.assign(defaultOption, options)
        );
    });
}

app.use(async (ctx, next) => {
    var pathMatch = /^\/s\/(.+)$/.exec(ctx.request.path);

    if (!pathMatch) {
        return next();
    }
    await koaSend(ctx, pathMatch[1], {
        root: path.join(projectDirname, 'dist')
    });
});

app.use(async (ctx, next) => {
    var initalState = await collectServerState();
    var store = createStore(initalState);

    var {pipe} = await renderReactNode(
        <App>
            <StoreProvider store={store}>
                <Page />
            </StoreProvider>
        </App>,
        {
            bootstrapScripts: ['/s/main.js'],
            bootstrapScriptContent: `self.__pda = {serverState: ${JSON.stringify(
                initalState,
                null,
                4
            )}}`
        }
    );
    ctx.response.status = 200;
    pipe(ctx.res);
});

http.createServer(app.callback()).listen(3000);
