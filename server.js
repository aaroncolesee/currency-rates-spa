require('dotenv').config() // read .env files
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const { getRates, getSymbols, getHistoricalRate } = require('./lib/fixer-service');
const { convertCurrency } = require('./lib/free-currency-service');

app.use(express.static('public')); // set public folder as root

app.use('/scripts', express.static(`${__dirname}/node_modules/`)); // allow front-end access to node_modules folder

// parse POST data as URL encoded data
app.use(bodyParser.urlencoded({
    extended: true,
}));

// parse POST data as json
app.use(bodyParser.json());

// express Error handler
const errorHandler = (err, req, res) => {
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(403).send({ title: 'Server responded with an error', message: err.message });
    } else if (err.request) {
      // The request was made but no response was received
      res.status(503).send({ title: 'Unable to communicate with server', message: err.message });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).send({ title: 'An unexpected error occurred', message: err.message });
    }
};

// fetch latest currency rates
app.get('/api/rates', async (req, res) => {
    try {
        const data = await getRates();
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// fetch symbols
app.get('/api/symbols', async (req, res) => {
    try {
        const data = await getSymbols();
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// convert currency
app.post('/api/convert', async(req, res) => {
    try {
        const { from, to } = req.body;
        const data = await convertCurrency(from, to);
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// fetch currency rates by date
app.post('/api/historical', async(req, res) => {
    try {
        const { date } = req.body;
        const data = await getHistoricalRate(date);
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`)); // redirect all traffic to index.html

app.listen(port, () => { // listern for HTTP requests on port 3000
    console.log('listening on %d', port);
});

/*
const test = async() => {
    const data = await getHistoricalRate('2012-07-14');
    console.log(data);
}

test();
*/