import React, {Suspense} from 'react';
import CompA from './comp/a.js';
import CompB from './comp/b.js';

const CompC = React.lazy(() => import('./comp/c.js'));

export default function Page() {
    console.log('render Page');

    return (
        <div>
            <h1>Page</h1>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <CompA />
                <CompB />
                <Suspense>
                    <CompC />
                </Suspense>
            </div>
        </div>
    );
}
