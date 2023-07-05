import {jest} from '@jest/globals';
import {register} from '../index.js';
import {createStore} from '../tool.js';

test('createStore', () => {
    var {increase} = register('a', {
        initialState: 0,
        reducers: {
            increase(state) {
                return state + 1;
            }
        }
    }).actions;
    var store = createStore({
        a: 1
    });
    expect(store.getState()).toEqual({
        a: 1
    });
    store.dispatch(increase());
    expect(store.getState().a).toBe(2);
});
