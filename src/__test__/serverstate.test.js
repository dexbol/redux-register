import {jest} from '@jest/globals';
import {reducerStructure, serverStateStructure} from '../register.js';
import {traverseServerState, collectServerState} from '../serverstate.js';

beforeEach(() => {
    for (let p in reducerStructure) {
        delete reducerStructure[p];
    }
    for (let p in serverStateStructure) {
        delete serverStateStructure[p];
    }
});

test('traverseServerState and collectServerState', async () => {
    var serverStateStruct = {
        one: {
            a: '',
            b: {
                initialState: 'b',
                getServerState: jest.fn(({arg = '', initialState} = {}) => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(initialState + arg);
                        }, 100);
                    });
                })
            }
        },
        two: {
            getServerState: jest.fn(({arg = ''}) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('two' + arg);
                    }, 200);
                });
            })
        }
    };
    var serverState = {};

    await traverseServerState(serverStateStruct, [], serverState);
    expect(serverState.one.a).toBe(undefined);
    expect(serverState.one.b).toBe('b');
    expect(serverState.two).toBe('two');

    Object.assign(serverStateStructure, serverStateStruct);
    var serverState1 = await collectServerState({whiteList: ['one.a']});
    expect(serverState1.one?.a).toBe(undefined);
    var serverState2 = await collectServerState({
        whiteList: ['one.b', 'one.a']
    });
    expect(serverState2.one?.b).toBe('b');
    var serverState3 = await collectServerState({arg: 'x'});
    expect(serverState3.one?.b).toBe('bx');
    expect(serverState3.two).toBe('twox');
});
