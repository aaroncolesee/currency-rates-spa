window.addEventListener('load', () => {
    const el = $('#app');

    // compile Handlebar templates
    const errorTemplate = Handlebars.compile($('#error-template').html());
    const ratesTemplate = Handlebars.compile($('#rates-template').html());
    const exchangeTemplate = Handlebars.compile($('#exchange-template').html());
    const historicalTemplate = Handlebars.compile($('#historical-template').html());

    // router declaration
    const router = new Router({
        mode: 'history',
        page404: (path) => {
            const html = errorTemplate({
                color: 'yellow',
                title: 'Error 404 - Page NOT Found!',
                message: `The path '/${path}' does not exist on this site`,
            });
            el.html(html);
        },
    });

    // api handler
    const api = axios.create({
        baseURL: 'http://localhost:3000/api',
        timeout: 5000,
    });

    // error banner
    const showError = (error) => {
        const { title, message } = error.response.data;
        const html = errorTemplate({ color: 'red', title, message});
        el.html(html);
    };

    // display currecy rates
    router.add('/', async () => {
        // loader
        let html = ratesTemplate();
        el.html(html);
        try {
            // load currency rates
            const response = await api.get('/rates');
            const { base, date, rates } = response.data;
            // display rates table
            html = ratesTemplate({ base, date, rates });
            el.html(html);
        } catch (error) {
            showError(error);
        } finally {
            // remove loader status
            $('.loading').removeClass('loading');
        }
    });

    // perform POST request, calculate and display conversion results
    const getConversionResults = async () => {
        // extract form data
        const from = $('#from').val();
        const to = $('#to').val();
        const amount = $('#amount').val();
        // send post data to Express server
        try {
        const response = await api.post('/convert', { from, to });
        const { rate } = response.data;
        const result = rate * amount;
        $('#result').html(`${to} ${result}`);
        } catch (error) {
        showError(error);
        } finally {
        $('#result-segment').removeClass('loading');
        }
    };
    
    // convert button click event
    const convertRatesHandler = () => {
        if ($('.ui.form').form('is valid')) {
        // hide error message
        $('.ui.error.message').hide();
        // post to Express server
        $('#result-segment').addClass('loading');
        getConversionResults();
        // prevent page from submitting to server
        return false;
        }
        return true;
    };

    const getHistoricalRates = async () => {
        // extract form data
        const date = $('#date').val();
        // send data to Express server
        try {
        const response = await api.post('/historical', { date });
        const { base, rates } = response.data;
        const html = ratesTemplate({ base, date, rates });
        $('#historical-table').html(html);
        } catch (error) {
        showError(error);
        } finally {
        $('.segment').removeClass('loading');
        }
    };

    // convert button click event
    const historicalRatesHandler = () => {
        if ($('.ui.form').form('is valid')) {
        // hide error message
        $('.ui.error.message').hide();
        // post to Express server
        $('.segment').addClass('loading');
        getHistoricalRates();
        // prevent page from submitting to server
        return false;
        }
        return true;
    };
  
    router.add('/exchange', async () => {
        // display loader
        let html = exchangeTemplate();
        el.html(html);
        try {
        // load symbols
        const response = await api.get('/symbols');
        const { symbols } = response.data;
        html = exchangeTemplate({ symbols });
        el.html(html);
        $('.loading').removeClass('loading');
        // validate form inputs
        $('.ui.form').form({
            fields: {
            from: 'empty',
            to: 'empty',
            amount: 'decimal',
            },
        });
        // submit handler
        $('.submit').click(convertRatesHandler);
        } catch (error) {
        showError(error);
        }
    });

    router.add('/historical', () => {
        // display form
        let html = historicalTemplate();
        el.html(html);
        // date picker
        $('#calendar').calendar({
            type: 'date',
            formatter: { //format to yyyy-mm-dd
              date: date => new Date(date).toISOString().split('T')[0],
            },
          });
        // validate date input
        $('.ui.form').form({
            fields: {
            date: 'empty',
            },
        });
        $('.submit').click(historicalRatesHandler);
    });

    router.navigateTo(window.location.pathname); // navigate app to current url

    // highlight active menu on page refresh/reload
    const link = $(`a[href$='${window.location.pathname}']`);
    link.addClass('active');

    $('a').on('click', (event) => {
        event.preventDefault(); // block browser page load

        // highlight active menu on click
        const target = $(event.target);
        $('.item').removeClass('active');
        target.addClass('active');

        // navigate to clicked url
        const href = target.attr('href');
        const path = href.substr(href.lastIndexOf('/'));
        router.navigateTo(path);
    });
});