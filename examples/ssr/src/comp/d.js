import React, {useCallback, useEffect} from 'react';
import {register, useStore} from '../../../../lib/index.js';

var count = 0;

const {actions} = register('page.featureD', {
    initialState: {
        content: 'featureD inital content'
    },
    reducers: {
        changeContent(state, action) {
            state.content = action.payload;
        }
    }
});

const CompD = function () {
    var [state, dispatch] = useStore((rootState) => rootState.page.featureD);

    var changeHandler = useCallback(
        (event) => {
            dispatch(actions.changeContent(event.target.value));
        },
        [dispatch]
    );

    useEffect(() => {
        dispatch(actions.changeContent('change content from useEffect'));
    }, [dispatch]);

    console.log('render CompD ' + ++count);

    return (
        <div>
            <h2>CompD</h2>
            <p style={{background: '#EEE'}}>
                This component is for testing register store namespace after the
                store object created.
            </p>
            <div>
                <p>{state.content}</p>
            </div>
            <form>
                <textarea onChange={changeHandler} value={state.content} />
            </form>
        </div>
    );
};

export default CompD;
