import React from 'react';

const App = function ({children}) {
    console.log('render App');

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
