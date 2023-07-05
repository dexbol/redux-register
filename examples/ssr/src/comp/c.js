import React, {useCallback} from 'react';
import {actions} from '../state/featurec.js';
import {useStore} from '../../../../lib/hook.js';

const CompC = function () {
    var [state, dispatch] = useStore((rootState) => {
        return {
            data: rootState.page.featureC || ''
        };
    });

    var changeHandler = useCallback(
        (event) => {
            dispatch(actions.changeContent(event.target.value));
        },
        [dispatch]
    );

    console.log('render CompC');

    return (
        <div>
            <h2>CompC</h2>
            <div>
                <p>{state.data.content}</p>
            </div>
            <form>
                <textarea onChange={changeHandler} value={state.data.content} />
            </form>
        </div>
    );
};

export default CompC;
