/*
 Basic Express server based on express-generator
 */

var express = require('express'),
    path = require('path'),
    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    favicon = require('serve-favicon'),
    routes = require('./server/routes-spa'),
    app = express(),
    env = process.env,
    isProduction = env.NODE_ENV === 'production',
    ipAddress = env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    port = env.OPENSHIFT_NODEJS_PORT || 8080; //(isProduction ? env.PORT : 8080);

app.use(compression());
app.use(favicon(path.join(__dirname, 'front', 'www', 'favicon.ico')));
app.set('views', path.join(__dirname, 'front','views'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static('./front/www/'));

app.use('/', routes);

// development error handler
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// Catch 404's
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.listen(port, ipAddress, function() {
    console.log('Server started on ' + new Date(Date.now()) + ' at http://' + ipAddress + ':' + port);
});