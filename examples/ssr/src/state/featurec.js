import {register} from '../../../../lib/index.js';

function fetchData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                content: 'featureC some data from server'
            });
        }, 200);
    });
}

export const {actions} = register('page.featureC', {
    initialState: {
        content: 'initialState'
    },

    getServerState: async () => {
        return await fetchData();
    },

    reducers: {
        changeContent(state, action) {
            state.content = action.payload;
        }
    }
});
