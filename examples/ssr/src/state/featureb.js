import {register} from '../../../../lib/index.js';

function fetchData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                content: 'some data from server'
            });
        }, 1000);
    });
}

export const {actions} = register('page.featureB', {
    initialState: {
        content: ''
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
