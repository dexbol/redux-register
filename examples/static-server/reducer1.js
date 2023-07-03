import {PAGE_ONE, PAGE_ONE_ADD, PAGE_ONE_REMOVE} from './constant.js';
import store from './store.js';

store.register(PAGE_ONE, [], {
    [PAGE_ONE_ADD](state, action) {
        state = Array.from(state);
        state.push(action.payload);
        return state;
    },

    [PAGE_ONE_REMOVE](state, action) {
        state = Array.from(state);
        state.pop();
        return state;
    }
});
