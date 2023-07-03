import store from './store.js';
import {pageOneAdd, pageOneRemove, pageTwoAdd, pageTwoRemove
    } from './actioncreators.js';
import './reducer1.js';
import './reducer2.js';

function updateView() {
    document.querySelector('code').innerHTML = 
        JSON.stringify(store.getState(), null, 4);
}

store.subscribe(updateView);
updateView();

self.actions = {
    pageOneAdd,
    pageOneRemove,
    pageTwoAdd,
    pageTwoRemove
};
self.store = store;

Object.keys(self.actions).forEach(function(k) {
    self.actions[k] = Redux.bindActionCreators(self.actions[k], store.dispatch);
});

console.log('%c type actions to see all acitons', 'color:red');
console.log('%c try to type actions.pageOneAdd("mesage1") ' +
    'and look at state tree changing', 'color:red')
