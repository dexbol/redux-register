import Register from '../src/index.js';

var finalCreateStore = Redux.compose(Register())(Redux.createStore);

export default finalCreateStore();
