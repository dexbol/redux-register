import {isDraft, nothing} from 'immer';
import {
    reducerShape,
    makeFinalStateByReducerShape,
    rootReducer,
    registerReducer,
    checkTypeNamespace,
    registerReducerByMap
} from '../src/index.js';

beforeEach(() => {
    for (var p in reducerShape) {
        delete reducerShape[p];
    }
});

test('makeFinalStateByReducerShape', () => {
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
    var shape = {
        one: {
            B: {
                a: jest.fn((state, action) => {
                    if (action.type == 'TEST1') {
                        return 'AA';
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
    var finalState = {};

    makeFinalStateByReducerShape(shape, [], finalState, rootState, {});
    expect(finalState.one.A).toBe(undefined);
    expect(typeof finalState.one.B).toBe('object');
    expect(finalState.one.B.a).toBe('A');
    expect(finalState.two).toEqual({C: 2});
    expect(finalState.three).toBe(undefined);
    expect(shape.one.B.a.mock.calls.length).toBe(1);
    expect(shape.one.B.a.mock.calls[0][0]).toBe('A');
    expect(shape.one.B.a.mock.calls[0][1]).toEqual({});
    expect(shape.two.mock.calls.length).toBe(1);
    expect(shape.two.mock.calls[0][0]).toEqual({C: 2});
    expect(shape.two.mock.calls[0][1]).toEqual({});

    finalState = {};
    makeFinalStateByReducerShape(shape, [], finalState, rootState, action1);
    expect(finalState.one.B.a).toBe('AA');
    expect(finalState.two).toEqual({C: 2});

    finalState = {};
    makeFinalStateByReducerShape(shape, [], finalState, rootState, action2);
    expect(finalState.one.B.a).toBe('A');
    expect(finalState.two).toEqual({C: 3});
    expect(shape.one.B.a.mock.calls.length).toBe(3);
    expect(shape.two.mock.calls.length).toBe(3);
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
    expect(typeof reducerShape.one.a.B).toBe('function');
    expect(typeof reducerShape.two).toBe('function');
    expect(typeof reducerShape.three.a).toBe('function');

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

test('checkTypeNamespace', () => {
    expect(checkTypeNamespace('xx', {type: 'xx'})).toBe(false);
    expect(checkTypeNamespace('y', {type: 'x'})).toBe(false);
    expect(checkTypeNamespace('a.b', {type: 'a.b'})).toBe(false);
    expect(checkTypeNamespace('b.c', {type: 'b.c.x'})).toBe(true);
    expect(checkTypeNamespace('b.c', {type: 'a.b.c'})).toBe(false);
});

test('registerReducerByMap throw errors', () => {
    expect(() => {
        registerReducerByMap(
            'one.a.b',
            {},
            {
                ['INCREASE'](state, action) {
                    return state + 1;
                }
            }
        );
    }).toThrow(/INCREASE/);
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
            'a.immer.push': function(draftState, action) {
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
    var initalState = {
        name: 'gala'
    };
    registerReducerByMap('x', initalState);

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
    registerReducerByMap(
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
    );
    var state1 = rootReducer(undefined, {type: ''});

    expect(state1.page.one.title).toBe('pageOne');
    expect(state1.page.one.list).toEqual([]);

    var state2 = rootReducer(state1, {
        type: 'page.one.CHANGE_TITLE',
        payload: 'xx'
    });
    expect(state2.page.one.title).toBe('xx');

    var state3 = rootReducer(state2, {
        type: 'page.one.APPEND_LIST',
        payload: 'yy'
    });
    expect(state3.page.one.list).toEqual(['yy']);
    expect(state3.page.one.title).toEqual('xx');
});
