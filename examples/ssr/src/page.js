import React, {
    useState,
    useRef,
    useEffect,
    useTransition,
    Suspense
} from 'react';
import CompA from './comp/a.js';
import CompB from './comp/b.js';

const CompC = React.lazy(() => import('./comp/c.js'));

export default function Page() {
    var [, startTransition] = useTransition();
    var [, update] = useState('');
    var ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            return;
        }
        ref.current = React.lazy(() => import('./comp/d.js'));

        startTransition(() => {
            update('x');
        });
    }, []);

    console.log('render Page');

    return (
        <div>
            <h1>Page</h1>
            <div style={{display: 'flex'}}>
                <CompA />
                <CompB />
                <Suspense fallback={<h2>Loadding C</h2>}>
                    <CompC />
                </Suspense>
                {ref.current && (
                    <Suspense fallback={<h2>Loadding D</h2>}>
                        {React.createElement(ref.current)}
                    </Suspense>
                )}
            </div>
        </div>
    );
}
