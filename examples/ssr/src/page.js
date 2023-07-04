import React from 'react';
import CompA from './comp/a.js';
import CompB from './comp/b.js';

export default function Page() {
    console.log('render Page');

    return (
        <div>
            <h1>Page</h1>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <CompA />
                <CompB />
            </div>
        </div>
    );
}
