The example need an arbitrary http server, and the server root directory
should be project root direction but not this directory. I use python 3
do this:
```shell
python -m http.server
```
then visit `http://localhost:8000/example/index.html`

To keep the example simple and readable, I didn't use mainstream tool chain
like Webpack/Babel etc. But I used ES6 module, so it requires the browsers
support ES6 module like Chrome >= 61
