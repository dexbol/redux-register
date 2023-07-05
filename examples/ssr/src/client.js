Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./app.js'),
    import('./page.js'),
    import('../../../lib/tool.js')
]).then(
    ([
        {default: React},
        {hydrateRoot},
        {default: App},
        {default: Page},
        {createStore, StorePrivider}
    ]) => {
        var store = createStore(globalThis.__pda?.serverState || {});

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
