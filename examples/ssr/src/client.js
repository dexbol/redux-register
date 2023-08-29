Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./app.js'),
    import('./page.js'),
    import('../../../lib/index.js')
]).then(
    ([
        {default: React},
        {hydrateRoot},
        {default: App},
        {default: Page},
        {createStore, StoreProvider}
    ]) => {
        var store = createStore(globalThis.__pda?.serverState || {});

        hydrateRoot(
            document,
            <App>
                <StoreProvider store={store}>
                    <Page />
                </StoreProvider>
            </App>
        );
    }
);
