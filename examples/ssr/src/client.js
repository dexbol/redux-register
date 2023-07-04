Promise.all([
    import('react'),
    import('react-dom/client'),
    import('redux'),
    import('redux-thunk'),
    import('./app.js'),
    import('./page.js'),
    import('../../../lib/hook.js'),
    import('../../../lib/index.js')
]).then(
    ([
        {default: React},
        {hydrateRoot},
        {createStore, applyMiddleware},
        {default: thunk},
        {default: App},
        {default: Page},
        {StorePrivider},
        {rootReducer}
    ]) => {
        var store = createStore(
            rootReducer,
            globalThis.__pda?.serverState || {},
            applyMiddleware(thunk)
        );

        hydrateRoot(
            document,
            <App>
                <StorePrivider store={store}>
                    <Page />
                </StorePrivider>
            </App>
        );
    }
);
