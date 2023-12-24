import React, {useCallback} from 'react';
import {actions} from '../state/featurec.js';
import {useStore} from '../../../../lib/hook.js';

var count = 0;

const CompC = function () {
    var [state, dispatch] = useStore((rootState) => rootState.page.featureC);

    var changeHandler = useCallback(
        (event) => {
            dispatch(actions.changeContent(event.target.value));
        },
        [dispatch]
    );

    console.log('render CompC ' + ++count);

    return (
        <div style={{padding: '6px', background: 'greenyellow'}}>
            <h2>CompC</h2>
            <p style={{background: '#EEE'}}>This component is inner Suspense</p>
            <div>
                <p>{state.content}</p>
            </div>
            <form>
                <textarea onChange={changeHandler} value={state.content} />
            </form>
        </div>
    );
};

export default CompC;
