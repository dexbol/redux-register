import {jest} from '@jest/globals';
import {isDraft, nothing} from 'immer';
import {createStore} from 'redux';
import {
    namespaceKey,
    reducerStructure,
    serverStateStructure,
    makeFinalStateByReducerStructure,
    mountValueToStructure,
    getValueFromStructure,
    createSubStructure,
    rootReducer,
    registerReducer,
    checkTypeNamespace,
    registerReducerByMap,
    traverseServerState,
    collectServerState,
    register
} from '../index.js';

beforeEach(() => {
    for (let p in reducerStructure) {
        delete reducerStructure[p];
    }
    for (let p in serverStateStructure) {
        delete serverStateStructure[p];
    }
});

test('makeFinalStateByReducerStructure', () => {
    var rootState = {
        one: {
            A: 1,
            B: {
                a: 'A',
                b: 'B'
            }
        },
        two: {
            C: 2
        }
    };
    var structure = {
        one: {
            B: {
                a: jest.fn((state, action) => {
                    if (action.type == 'TEST1') {
                        return 'AA';
                    }
                    if (action.type === 'TEST2') {
                        return 'AAA';
                    }
                    if (action.type === 'TEST3') {
                        return state + '3';
                    }
                    return state;
                })
            }
        },
        two: jest.fn((state, action) => {
            if (action.type == 'TEST2') {
                return {
                    C: 3
                };
            }
            return state;
        }),
        three: jest.fn((state, action) => {
            return state;
        })
    };
    var action1 = {
        type: 'TEST1'
    };
    var action2 = {
        type: 'TEST2'
    };
    var action3 = {
        type: 'TEST3'
    };
    var finalState = {};

    makeFinalStateByReducerStructure(structure, [], finalState, rootState, {});
    expect(finalState.one.A).toBe(undefined);
    expect(typeof finalState.one.B).toBe('object');
    expect(finalState.one.B.a).toBe('A');
    expect(finalState.two).toEqual({C: 2});
    expect(finalState.three).toBe(undefined);
    expect(structure.one.B.a.mock.calls.length).toBe(1);
    expect(structure.one.B.a.mock.calls[0][0]).toBe('A');
    expect(structure.one.B.a.mock.calls[0][1]).toEqual({});
    expect(structure.two.mock.calls.length).toBe(1);
    expect(structure.two.mock.calls[0][0]).toEqual({C: 2});
    expect(structure.two.mock.calls[0][1]).toEqual({});

    finalState = {};
    makeFinalStateByReducerStructure(
        structure,
        [],
        finalState,
        rootState,
        action1
    );
    expect(finalState.one.B.a).toBe('AA');
    expect(finalState.two).toEqual({C: 2});

    finalState = {};
    makeFinalStateByReducerStructure(
        structure,
        [],
        finalState,
        rootState,
        action2
    );
    expect(finalState.one.B.a).toBe('AAA');
    expect(finalState.two).toEqual({C: 3});
    expect(structure.one.B.a.mock.calls.length).toBe(3);
    expect(structure.two.mock.calls.length).toBe(3);

    makeFinalStateByReducerStructure(
        structure,
        [],
        finalState,
        finalState,
        action3
    );
    expect(finalState.one.B.a).toBe('AAA3');
});

test('registerReducer and rootReducer', () => {
    const ONE_INCREASE = 'ONE_INCREASE';
    const TWO_INCREASE = 'TWO_INCREASE';
    const THREE_INCREASE = 'THREE_INCREASE';

    var reducer1 = jest.fn((state, action) => {
        if (!state) {
            state = 0;
        }
        if (action.type == ONE_INCREASE) {
            state += 1;
        }
        return state;
    });

    var reducer2 = jest.fn((state, action) => {
        if (!state) {
            state = 0;
        }
        if (action.type == TWO_INCREASE) {
            state += 1;
        }
        return state;
    });

    var reducer3 = jest.fn((state, action) => {
        if (!state) {
            state = 0;
        }
        if (action.type == THREE_INCREASE) {
            state += 1;
        }
        return state;
    });

    registerReducer('one.a.B', reducer1);
    registerReducer('two', reducer2);
    registerReducer('three.a', reducer3);
    expect(typeof reducerStructure.one.a.B).toBe('function');
    expect(typeof reducerStructure.two).toBe('function');
    expect(typeof reducerStructure.three.a).toBe('function');

    var state1 = rootReducer(undefined, {type: ''});
    expect(state1.one.a.B).toBe(0);
    expect(state1.two).toBe(0);
    expect(state1.three.a).toBe(0);

    var state2 = rootReducer(state1, {type: THREE_INCREASE});
    expect(state2.one.a.B).toBe(0);
    expect(state2.two).toBe(0);
    expect(state2.three.a).toBe(1);

    var state3 = rootReducer(state2, {type: THREE_INCREASE});
    expect(state3.two).toBe(0);
    expect(state3.three.a).toBe(2);

    var state4 = rootReducer(state3, {type: ONE_INCREASE});
    expect(state4.one.a.B).toBe(1);
    expect(state4.three.a).toBe(2);
    expect(state4.two).toBe(0);

    var state5 = rootReducer(state4, {type: TWO_INCREASE});
    expect(state5.two).toBe(1);
    expect(state5.one.a.B).toBe(1);
});

test('mountValueToStructure , getValueFromStructure, createSubStructure', () => {
    var structure = {
        one: {
            a: {
                B: 'x',
                C: {
                    D: 'y'
                }
            },
            b: 'x'
        },
        two: 2
    };
    expect(getValueFromStructure({structure, namespace: 'one.a.B'})).toBe('x');
    expect(getValueFromStructure({structure, namespace: 'x.y'})).toBe(
        undefined
    );
    expect(getValueFromStructure({structure, namespace: 'two'})).toBe(2);

    mountValueToStructure({structure, namespace: 'one.a.B', value: 'xx'});
    expect(structure.one.a.B).toBe('xx');
    mountValueToStructure({structure, namespace: 'a.b.c.d', value: 'haha'});
    expect(structure.a.b.c.d).toBe('haha');

    var sub = createSubStructure({structure, whiteList: ['one.a.B', 'two']});
    expect(sub.one.a.B).toBe('xx');
    expect(sub.two).toBe(2);
    expect(sub.one.a.C).toBe(undefined);
    expect(sub.one.b).toBe(undefined);
});

test('checkTypeNamespace', () => {
    expect(checkTypeNamespace('xx', 'xx')).toBe(false);
    expect(checkTypeNamespace('y', 'x')).toBe(false);
    expect(checkTypeNamespace('a.b', 'a.b')).toBe(false);
    expect(checkTypeNamespace('b.c', 'b.c.x')).toBe(true);
    expect(checkTypeNamespace('b.c', 'a.b.c')).toBe(false);
});

test('registerReducerByMap throw errors', () => {
    expect(() => {
        registerReducerByMap(
            'two',
            {},
            {
                undefined: undefined
            }
        );
    }).toThrow(/two/);
});

test('reducers registered by registerReducerByMap throw errors', () => {
    registerReducerByMap(
        'one.a',
        {},
        {
            ['one.a.INCREASE'](state, action) {
                return nothing;
            }
        }
    );
    expect(() => {
        rootReducer(
            {
                one: {
                    a: 1
                }
            },
            {type: 'one.a.INCREASE'}
        );
    }).toThrow(/new state/);
    registerReducerByMap(
        'one.b',
        {},
        {
            ['one.b.INCREASE']: undefined
        }
    );
    expect(() => {
        rootReducer(
            {
                one: {
                    b: 0
                }
            },
            {type: 'one.b.INCREASE'}
        );
    }).toThrow(/one\.b\.INCREASE/);
});

test('Adopt immer.js as state', () => {
    registerReducerByMap(
        'a.immer',
        {
            name: 'y',
            list: [
                {
                    id: 1,
                    text: '1'
                }
            ]
        },
        {
            'a.immer.push': function (draftState, action) {
                expect(isDraft(draftState)).toBe(true);
                draftState.list.push(action.payload);
            }
        }
    );
    var state = rootReducer(undefined, {});

    expect(state.a.immer.list[0].text).toBe('1');

    var state1 = rootReducer(state, {
        type: 'a.immer.push',
        payload: {
            id: 2,
            text: '2'
        }
    });
    expect(state1.a.immer.list.length).toBe(2);
    expect(state1.a.immer.list[1].text).toBe('2');
});

test('RESET and UPDATE actions with immer.js', () => {
    var initialState = {
        name: 'gala'
    };
    registerReducerByMap('x', initialState);

    var state1 = rootReducer(undefined, {});
    expect(state1.x.name).toBe('gala');

    var state2 = rootReducer(state1, {
        type: 'x.UPDATE',
        payload: {
            name: 'h',
            list: [1],
            open: true
        }
    });
    expect(state2.x.list[0]).toBe(1);
    expect(state2.x.open).toBe(true);

    var state3 = rootReducer(state2, {
        type: 'x.UPDATE',
        payload: {
            list: ['3', '4'],
            open: false
        }
    });
    expect(state3.x.list[0]).toBe('3');
    expect(state3.x.open).toBe(false);
    expect(state3.x.name).toBe('h');

    var state4 = rootReducer(state3, {
        type: 'x.UPDATE',
        payload: {
            name: '凸',
            list: undefined
        }
    });
    expect(state4.x.list).toBe(undefined);
    expect(state4.x.name).toBe('凸');
    expect(state4.x.open).toBe(false);

    var state5 = rootReducer(state4, {
        type: 'x.RESET'
    });
    expect(state5.x.name).toBe('gala');
    expect(state5.x.open).toBe(undefined);
});

test('RESET and UPDATE actions if initial state is a Array', () => {
    var initialState = [];

    registerReducerByMap('y', initialState);

    var state1 = rootReducer(undefined, {});
    expect(Array.isArray(state1.y)).toBe(true);
    expect(state1.y.length).toBe(0);

    var state2 = rootReducer(state1, {
        type: 'y.UPDATE',
        payload: [{name: 1}, {name: '2'}]
    });
    expect(state2.y.length).toBe(2);
    expect(state2.y[1].name).toBe('2');

    var state3 = rootReducer(state2, {
        type: 'y.UPDATE',
        payload: [{name: 'a'}]
    });
    expect(state3.y[0].name).toBe('a');
    expect(state3.y[1].name).toBe('2');
});

test('register top level namespace', () => {
    registerReducerByMap(
        'user',
        {
            name: '',
            level: 0
        },
        {
            ['user.CHANGE_NAME'](state, action) {
                state.name = action.payload;
                return state;
            }
        }
    );
    var state1 = rootReducer(undefined, {type: ''});
    expect(state1.user.name).toBe('');
    var state2 = rootReducer(state1, {
        type: 'user.CHANGE_NAME',
        payload: 'k'
    });
    expect(state2.user.name).toBe('k');
});

test('registerReducerByMap', () => {
    var actions = registerReducerByMap(
        'page.one',
        {
            title: 'pageOne',
            list: []
        },
        {
            ['page.one.APPEND_LIST'](state, action) {
                state = Object.assign({}, state);
                state.list = state.list.concat(action.payload);
                return state;
            },
            ['page.one.CHANGE_TITLE'](state, action) {
                state.title = action.payload;
                return state;
            }
        }
    ).actions;
    var state1 = rootReducer(undefined, {type: ''});

    expect(state1.page.one.title).toBe('pageOne');
    expect(state1.page.one.list).toEqual([]);
    expect(actions.APPEND_LIST()).toEqual({type: 'page.one.APPEND_LIST'});

    var state2 = rootReducer(state1, actions.CHANGE_TITLE('xx'));
    expect(state2.page.one.title).toBe('xx');

    var state3 = rootReducer(state2, actions.APPEND_LIST('yy'));
    expect(state3.page.one.list).toEqual(['yy']);
    expect(state3.page.one.title).toEqual('xx');
});

test('namespaceKey', () => {
    var state;

    register('a', {
        initialState: []
    });
    expect(rootReducer(undefined, {type: ''}).a[namespaceKey]).toBe('a');

    register('b.c.d', {
        initialState: {},
        reducers: {
            update(state, action) {
                state.name = 'x';
            },
            update2(state, action) {
                return {name: 'y'};
            }
        }
    });
    state = rootReducer(undefined, {type: ''});
    expect(state.b.c.d[namespaceKey]).toBe('b.c.d');
    expect(state.b.c.d.name).toBe(undefined);
    state = rootReducer(state, {type: 'b.c.d.update'});
    expect(state.b.c.d.name).toBe('x');
    state = rootReducer(state, {type: 'b.c.d.update2'});
    expect(state.b.c.d.name).toBe('y');
    expect(state.b.c.d[namespaceKey]).toBe(undefined);

    register('c.d', {
        initialState: 'string'
    });
    state = rootReducer(undefined, {type: ''});
    expect(state.c.d).toBe('string');
    expect(state.c.d[namespaceKey]).toBe(undefined);
});

test('traverseServerState and collectServerState', async () => {
    var serverStateStruct = {
        one: {
            a: '',
            b: function ({arg = ''} = {}) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('b' + arg);
                    }, 100);
                });
            }
        },
        two: function ({arg = ''} = {}) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve('two' + arg);
                }, 200);
            });
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

test('register page', async () => {
    register('page.one', {
        initialState: {
            title: 'pageOne',
            list: []
        },
        getServerState: () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        title: 'pageOne-from-server',
                        list: ['a', 'b', 'c']
                    });
                }, 100);
            });
        },
        reducers: {
            push: (state, action) => {
                state.list.push(action.payload);
                return state;
            }
        }
    });

    register('page.two', {
        initialState: {
            title: 'pageTwo',
            list: []
        },
        init: (initArg) => {
            initArg.title = 'pageTwo-from-init';
            return initArg;
        },
        getServerState: () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        title: 'pageTwo-from-server',
                        list: ['1', '2', '3']
                    });
                }, 100);
            });
        }
    });

    var serverState = await collectServerState({whiteList: ['page.one']});

    expect(serverState.page?.one?.title).toBe('pageOne-from-server');
    expect(serverState.page?.two?.title).toBe(undefined);
    expect(serverState.page?.one?.list).toEqual(['a', 'b', 'c']);

    var store = createStore(rootReducer, serverState);

    expect(store.getState().page.one.title).toBe('pageOne-from-server');
    expect(store.getState().page.one.list).toEqual(['a', 'b', 'c']);

    var store2 = createStore(rootReducer);

    expect(store2.getState().page.two.title).toBe('pageTwo-from-init');
});
