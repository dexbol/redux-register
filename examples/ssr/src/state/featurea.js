import {register} from '../../../../src/index.js';

export const {actions} = register('page.featureA', {
    initialState: {
        list: []
    },

    getServerState() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    list: ['from-server']
                });
            }, 600);
        });
    },

    reducers: {
        add(state, action) {
            state.list.push(action.payload);
        },

        pop(state, action) {
            state.list.shift();
        }
    }
});
