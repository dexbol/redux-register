import {PAGE_TWO, PAGE_TWO_ADD, PAGE_TWO_REMOVE} from './constant.js';
import store from './store.js';

store.register(PAGE_TWO, [], {
    [PAGE_TWO_ADD](state, action) {
        state = Array.from(state);
        state.push(action.payload);
        return state;
    },

    [PAGE_TWO_REMOVE](state, action) {
        state = Array.from(state);
        state.pop();
        return state;
    }
});
