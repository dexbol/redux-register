import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {Writable, Duplex} from 'node:stream';
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

app.on('error', (err) => {
    console.log(err);
});

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
    var {pipe} = renderToPipeableStream(
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
    var dup = new Duplex({
        construct(callback) {
            this._buf = [];
            this._ended = false;
            this._need = 0;
            callback();
        },
        write(chunk, encoding, callback) {
            if (this._need > 0) {
                this.push(chunk, 'utf-8');
                this._need = 0;
            } else {
                this._buf.push(chunk);
            }
            callback();
        },
        destroy(error, callback) {
            this._buf = [];
            callback();
        },
        final(callback) {
            this._ended = true;
            callback();
        },
        read(size) {
            if (this._buf.length > 0) {
                this.push(this._buf.shift(), 'utf-8');
            } else if (this._ended) {
                this.push(null);
            } else {
                this._need = size;
            }
        }
    });

    pipe(dup);

    ctx.response.type = 'text/html';
    ctx.response.status = 200;
    ctx.response.body = dup;
});

http.createServer(app.callback()).listen(3000);
