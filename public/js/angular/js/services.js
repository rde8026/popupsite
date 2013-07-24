/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/31/13
 * Time: 2:42 PM
 */


ps.service('UserService', function($rootScope, User) {
    var authorizedUser = null;
    return {
        cacheUser : function(user) {
            console.log("Setting User Cache");
            authorizedUser = user;
        }
        , clearCachedUser : function() {
            authorizedUser = null;
        }
        , getCachedUser : function() {
            return authorizedUser;
        }
        , create : function(user, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            User.save(user  , function(data, options) {
                $rootScope.$broadcast('event:createAccountConfirmed', data.user);
                success(data);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , update : function(user, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var u = new User(user);
            u.$update({userId : u.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', {message : "Profile saved"});
                $rootScope.$broadcast('event:createAccountConfirmed', data.user);
                success();
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error();
            });
        }
    }
}).service('LoginService', function($rootScope, Login, Logout, UserService){
    return {
        login : function(email, password, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            Login.login({email : email, password : password}, function(data, options) {
                UserService.cacheUser(data);
                success(data);
                $rootScope.$broadcast('event:loginConfirmed');
            }, function(data, options) {
                error(data);
            });
        },
        logout : function(success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            Logout.logout({}, function(data, options) {
                UserService.cacheUser(data);
                $rootScope.$broadcast('event:logoutConfirmed');
                success();
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error();
            });
        }
    }
}).service('ArtisanService', function($rootScope, Artisan, Product, Stripe, LoginService) {
    return {
        createArtisan : function(artisan, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Artisan(artisan);
            p.$create({}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', {message : "Profile saved"});
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error();
            });
        }
        , updateArtisan : function(artisan, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Artisan(artisan);
            p.$update({artisanId : artisan.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', {message : "Profile saved"});
                success();
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error();
            });
        }
        , deleteArtisan : function(artisan, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var a = new Artisan(artisan);
            a.$remove({artisanId : artisan.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , addProduct : function(product, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Product(product);
            p.$create({}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', {message : "Product saved"});
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , removeProduct : function(product, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Product(product);
            p.$remove({productId : product.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , updateProduct : function(product, success, error) {
            var p = new Product(product);
            p.$update({productId : product.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data.product, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , addStripeCustomer : function(token, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var t = new Stripe(token);
            t.$create({token : token}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
    }
}).service('MerchantService', function($rootScope, Merchant, TempImage, MerchantLocation) {
    return {
        createMerchant : function(profile, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Merchant(profile);
            p.$create({}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);

            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
        , updateMerchant : function(profile, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var p = new Merchant(profile);
            p.$update({merchantId : profile.id}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);

            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }

        , createMerchantLocation : function(location, success, error) {
            $rootScope.$broadcast('event:showLoadingModal');
            var loc = new MerchantLocation(location);
            loc.$create({}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }




        //Used to remove temp image
        , removeTempImage : function(path, success, error) {
            var temp = new TempImage();
            $rootScope.$broadcast('event:showLoadingModal');
            temp.$delete({path : path}, function(data, options) {
                $rootScope.$broadcast('event:successMessage', data);
                success(data, options);
            }, function(data, options) {
                $rootScope.$broadcast('event:errorMessage', data);
                error(data, options);
            });
        }
    }
}).factory('Ping', function($resource) {
    return $resource('/ping', {}, {});
}).factory('User', function($rootScope, $resource) {
    return $resource('/users/:userId', {userId : "@userId"}, {
        query : {
            method : 'GET',
            params : {
                userId : ''
            }
        },
        create : {
            method : 'POST'
        },
        update : {
            method : 'PUT'
            , params : {
                userId : ''
            }
        }
    });
}).factory('Logout', function($resource) {
    return $resource('/logout', {}, {
        logout : {
            method : 'POST'
        }
    });
}).factory('Login', function($resource) {
    return $resource('/login', {}, {
        login : {
            method : 'POST'
        }
    });
}).factory('Artisan', function($resource) {
    return $resource('/profile/artisan/:artisanId', {artisanId : "@artisanId"}, {
        query : {
            method : 'GET'
        }
        , update : {
            method : 'PUT'
            , params : {
                artisanId : ''
            }
        }
        , remove : {
            method : 'DELETE'
            , params : {
                artisanId : ''
            }
        }
        , create : {
            method : 'POST'
        }
    });
}).factory('Merchant', function($resource) {
    return $resource('/profile/merchant/:merchantId', {merchantId : "@merchantId"}, {
        query : {
            method : 'GET'
        }
        , update : {
            method : 'PUT'
            , params : {
                merchantId : ''
            }
        }
        , remove : {
            method : 'DELETE'
            , params : {
                merchantId : ''
            }
        }
        , create : {
            method : 'POST'
        }
    });
}).factory('Product', function($resource) {
    return $resource('/products/:productId', {productId : "@productId"}, {
        query : {
            method : 'GET'
        }
        , create : {
            method : 'POST'
        }
        , remove : {
            method : 'DELETE'
            , params : {
                productId : ''
            }
        }
        , update : {
            method : 'PUT'
            , params : {
                productId : ''
            }
        }
    })
}).factory('Stripe', function($resource) {
    return $resource('/profile/artisan/stripe/:token', {token : "@token"}, {
        create : {
            method : 'POST'
            , params : {
                token : ''
            }
        }
        , update : {
            method : 'PUT'
            , params : {
                token : ''
            }
        }
    });
}).factory('TempImage', function($resource) {
    return $resource('/images/temp/image', {}, {
        remove : {
            method : 'DELETE'
        }
    });
}).factory('MerchantLocation', function($resource) {
    return $resource('/profile/merchant/location', {}, {
        create : {
            method : 'POST'
        }
    });
}).run(['$rootScope', '$http', '$location', '$window', '$routeParams', '$templateCache', 'LoginService', 'Ping', 'UserService', function(scope, $http, $location, $window, $routeParams, $templateCache, LoginService, Ping, UserService) {

        $('.alert').alert();
        var loadingModal = $("#modalInteraction");

        Ping.get(function(data, options) {
            console.log("PING OK");
            $("#navAccountMenu").show();
            $("#navLoginMenu").hide();
            $("#navCreateUserMenu").hide();
            if (data) {
                UserService.cacheUser(data);
            }
        }, function(data, options) {
            console.log("PING NOT OK");
            $("#navAccountMenu").hide();
            $("#navLoginMenu").show();
            $("#navCreateUserMenu").show();
            //HACK : to account for session reset when viewing user update screen
            if ($location.path() == "/user/update") {
                $location.path('/shops');
            }
        });

        var alertMsg = $("#alert-error");
        var errorAlert = $("#alert-error-text");
        var alertSuccess = $("#alert-success");
        var alertSuccessText = $("#alert-info-text");

        scope.$on('event:errorMessage', function(evt, data) {
            errorAlert.text(data.data.errorMessage);
            alertMsg.show();
            setTimeout(function() {
                alertMsg.fadeOut(500);
            }, 2500);
        });

        scope.$on('event:successMessage', function(evt, data) {
            alertSuccessText.text(data.message);
            alertSuccess.show();
            setTimeout(function() {
                alertSuccess.fadeOut(500);
            }, 2500);
        });

        scope.$on('event:createAccountConfirmed', function(evt, data) {
            UserService.cacheUser(data);
            $("#navAccountMenu").show();
            $("#navLoginMenu").hide();
            $("#navCreateUserMenu").hide();
        });

        scope.$on('event:logoutConfirmed', function(evt, data) {
            UserService.clearCachedUser();
            $("#navAccountMenu").hide();
            $("#navLoginMenu").show();
            $("#navCreateUserMenu").show();
            alertSuccessText.text("You have been logged out");
            alertSuccess.show();
            setTimeout(function() {
                alertSuccess.fadeOut(500);
            }, 2500);
        });

        scope.$on('event:showLoadingModal', function(evt, data) {
            loadingModal.modal('show');
        });

        scope.$on('event:dismissLoadingModal', function(evt, data) {
            loadingModal.modal('hide');
        });

        /**
         *  Deals with Replay of requests on 401
         */
        var oldLocation = null;
        scope.$on('event:unauthorized', function() {
            $('.modal-backdrop').hide(); //hide any present modal backdrops
            loadingModal.modal('hide');
            oldLocation = $location.path();
            $("#password").val('');
            $("#modalLogin").modal('show');
        });

        scope.requests401 = [];

        scope.$on('event:loginConfirmed', function() {
            $("#navAccountMenu").show();
            $("#navLoginMenu").hide();
            $("#navCreateUserMenu").hide();

            var i, requests = scope.requests401;
            for (i = 0; i < requests.length; i++) {
                retry(requests[i]);
            }
            scope.requests401 = [];

            function retry(req) {
                $http(req.config).then(function(response) {
                    req.deferred.resolve(response);
                });
            }

            if (oldLocation) {
                $location.path(oldLocation);
            } else {
                $location.path('/shops');
            }
        });

}]);

/**
 * Deals w/ replay of requests
 */
 ps.config(function($httpProvider) {
     // Two functions below are inspired by:
     // http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application
     var interceptor = [ '$rootScope', '$q', function(scope, $q) {
        function success(response) {
            scope.$broadcast('event:dismissLoadingModal');
            return response;
        }

        function error(response) {
            scope.$broadcast('event:dismissLoadingModal');
            var status = response.status;

            if (status == 401) {
                var deferred = $q.defer();
                var req = {
                    config : response.config,
                    deferred : deferred
                };
                scope.requests401.push(req);
                scope.$broadcast('event:unauthorized');
                return deferred.promise;
            }
            // otherwise
                return $q.reject(response);
            }

            return function(promise) {
                return promise.then(success, error);
            }
     }];
     $httpProvider.responseInterceptors.push(interceptor);
 });



