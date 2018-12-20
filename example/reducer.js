import {PAGE_ONE, PAGE_TWO, PAGE_ONE_ADD, PAGE_ONE_REMOVE,
    PAGE_TWO_ADD, PAGE_TWO_REMOVE} from './constant.js';
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

// You can push the reducer to a new file.
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
