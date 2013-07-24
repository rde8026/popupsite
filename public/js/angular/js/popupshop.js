/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/31/13
 * Time: 2:04 PM
 */

'use strict'

//Hack to add Date.now to old browsers (e.g. pre IE-9)
if (!Date.now) {
    Date.now = function now() {
        return +(new Date);
    };
}

var ps = angular.module('ngView', ['ngResource', 'ui.directives', 'ui.bootstrap'], function($routeProvider, $locationProvider) {
    $routeProvider.when('/shops', {
        templateUrl: 'templates/shops.html',
        controller: ShopCntl
    });

    $routeProvider.when('/user/new', {
        templateUrl: 'templates/account/user-info.html'
        , controller: UserCntl
        , resolve : UserCntl.resolve
    });

    $routeProvider.when('/user/update', {
        templateUrl : 'templates/account/user-info.html'
        , controller : UserCntl
        , resolve : UserCntl.resolve
    });

    $routeProvider.when('/profile/artisan', {
        templateUrl : 'templates/account/artisan-profile.html'
        , controller : ArtisanCntl
        , resolve : ArtisanCntl.resolve
    });

    $routeProvider.when('/profile/artisan/products', {
        templateUrl : 'templates/account/artisan-product.html'
        , controller : ArtisanProductCntl
        , resolve : ArtisanProductCntl.resolve
    });

    $routeProvider.when('/profile/merchant', {
        templateUrl : 'templates/account/merchant-profile.html'
        , controller : MerchantCntl
        , resolve : MerchantCntl.resolve
    });

    $routeProvider.when('/profile/merchant/location', {
        templateUrl : 'templates/account/merchant-location.html'
        , controller : MerchantLocationCntl
    });

    /*$routeProvider.when('/profile/manage/products', {
        templateUrl : ''
        , controller : null
    });*/

    $routeProvider.otherwise({
        redirectTo: '/shops'
    });
}).directive('colorbox', function() {
        return {
            restrict: 'AC'
            , link : function(scope, element, attrs) {
                $(element).colorbox(attrs.colorbox);
            }
        }
    });

ps.config(function ($httpProvider) {
    $httpProvider.responseInterceptors.push('loadingInterceptor');
    var loading = function (data, headersGetter) {
        $('#loadingMenu').show();
        return data;
    };
    $httpProvider.defaults.transformRequest.push(loading);
});

ps.factory('loadingInterceptor', function ($q) {
    return function (p) {
        return p.then(function (response) {
            $('#loadingMenu').fadeOut(500);
            return response;
        }, function (response) {
            $('#loadingMenu').fadeOut(500);
            return $q.reject(response);
        });
    };
});

ps.config(function($locationProvider){

});
