
/**
 * Module dependencies.
 */

var express = require('express')
    , config = require('./config/config.js').env()
    , http = require('http')
    , path = require('path')
    , passport = require('passport')

    , authUtil = require('./routes/util/auth')
    , roleTypes = require('./database/Roles').roleTypes
    , database = require('./database/db_conn')
    , fileUploadHelpers = require('./routes/util/fileUpload')
    , userRoutes = require('./routes/users')
    , artisanProfile = require('./routes/artisanProfile')
    , products = require('./routes/products')
    , merchantProfile = require('./routes/merchantProfile');

var app = express();

app.configure(function(){
    app.set('port', config.httpPort);
    app.use(express.logger('dev'));
    app.use(express.multipart({
          uploadDir: './uploadedImages',
        keepExtensions: true
    }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.cookieSecret));
    app.use(express.session({ secret: config.cookieSecret , cookie: { maxAge : 60000 * config.sessionTimeout } }));

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(passport.initialize());
    app.use(passport.session());
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

require('./authentication/WebAuthentication');

app.get('/ping', /*authUtil.verifyAuthentication,*/ userRoutes.ping);

app.post('/login', userRoutes.login);
app.put('/login', userRoutes.login);
app.post('/logout', authUtil.verifyAuthentication, userRoutes.userLogout);
app.put('/logout', authUtil.verifyAuthentication, userRoutes.userLogout);

app.get('/users', /*authUtil.verifyAuthentication,*/ userRoutes.findLoggedInUser);
app.post('/users', userRoutes.createUser);
app.put('/users/:userId', authUtil.verifyAuthentication, userRoutes.updateUser);

app.post('/profile/artisan', authUtil.verifyAuthentication, artisanProfile.createArtisanProfile);
app.get('/profile/artisan', authUtil.verifyAuthentication, artisanProfile.findArtisanProfileByUserId);
app.put('/profile/artisan/:artisanId', authUtil.verifyAuthentication, artisanProfile.updateArtisanProfile);
app.delete('/profile/artisan/:artisanId', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), artisanProfile.removeArtisanProfile);
app.get('/profile/artisan/products', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), products.findProductsByArtisanId);
app.post('/profile/artisan/stripe/:token', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), artisanProfile.addStripeTokenToProfile);

app.post('/images/temp/image', authUtil.verifyAuthentication, fileUploadHelpers.fileUpload);
app.get('/images/temp/image', fileUploadHelpers.supportTempPath);
app.delete('/images/temp/image', authUtil.verifyAuthentication, fileUploadHelpers.deleteTempFile);

app.post('/products', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), products.createArtisanProduct);
app.delete('/products/:productId', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), products.removeProductFromArtisan);
app.put('/products/:productId', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.ARTISAN]), products.updateArtisanProduct);


app.post('/profile/merchant', authUtil.verifyAuthentication, merchantProfile.createMerchantProfile);
app.get('/profile/merchant', authUtil.verifyAuthentication, merchantProfile.findMerchantProfileById);
app.put('/profile/merchant/:merchantId', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.MERCHANT]), merchantProfile.updateMerchantProfile);

app.post('/profile/merchant/location', authUtil.verifyAuthentication, authUtil.hasAllRoles([roleTypes.MERCHANT]), merchantProfile.addMerchantLocation);

database.init(function(bool) {

    http.createServer(app).listen(app.get('port'), function() {
        console.log("Express server listening on port " + app.get('port'));
    });

});
