import React from 'react';

var count = 0;

const App = function ({children}) {
    console.log('render App ' + ++count);

    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>React SSR</title>
            </head>
            <body>{children}</body>
        </html>
    );
};

export default App;
