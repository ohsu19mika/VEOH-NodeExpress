const express = require('express');
const PORT = process.env.PORT || 8080;
let app = express();

app.use((req, res, next) => {
    console.log(`PATH: ${req.path}`);
    next();
});

app.get('/', (reg, res, next) => {
    res.send('Hello world!');
});

app.use((req, res, next) => {
    console.log('404');
    res.status(404);
    res.send('page not found')
});

app.listen(PORT);