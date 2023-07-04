import React, {useCallback} from 'react';
import {actions} from '../state/featureb.js';
import {useStore} from '../../../../lib/hook.js';

const CompA = function () {
    var [state, dispatch] = useStore((rootState) => {
        return {
            data: rootState.page.featureB
        };
    });

    var changeHandler = useCallback(
        (event) => {
            dispatch(actions.changeContent(event.target.value));
        },
        [dispatch]
    );

    console.log('render CompB');

    if (!state.data.content) {
        return null;
    }

    return (
        <div>
            <h2>CompB</h2>
            <div>
                {state.data.content.split('\n').map((item, index) => {
                    return <p key={index}>{item}</p>;
                })}
            </div>
            <form>
                <textarea onChange={changeHandler} value={state.data.content} />
            </form>
        </div>
    );
};

export default CompA;
