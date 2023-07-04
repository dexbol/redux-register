import React, {useCallback} from 'react';
import {useStore} from '../store.js';
import {actions} from '../state/featurea.js';

const CompA = function () {
    var [state, dispatch] = useStore((rootState) => {
        return {
            data: rootState.page.featureA
        };
    });

    var submitHandler = useCallback((event) => {
        event.preventDefault();
        dispatch(actions.add(new FormData(event.target).get('content')));
    }, []);

    var asyncAddHandler = useCallback(
        (event) => {
            var content = new FormData(event.target.form).get('content');
            dispatch((dispatch, getState) => {
                setTimeout(dispatch, 600, actions.add(content + ' (async add)'));
            });
        },
        [dispatch]
    );

    console.log('render CompA');
    return (
        <div>
            <h2>CompA</h2>
            <form onSubmit={submitHandler}>
                <input name="content" />
                <button type="submit">Add</button>
                <button type="button" onClick={asyncAddHandler}>
                    Async Add
                </button>
                <button type="button" onClick={() => dispatch(actions.pop())}>
                    Pop
                </button>
            </form>
            <ul>
                {state.data.list.map((item, index) => {
                    return <li key={index}>{item}</li>;
                })}
            </ul>
        </div>
    );
};

export default CompA;
