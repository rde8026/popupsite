/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/31/13
 * Time: 2:12 PM
 */

var cardTypeUrls = {
    visa : "https://checkout.stripe.com/assets/cards/visa.png"
    , visa2x : "https://checkout.stripe.com/assets/cards/visa@2x.png"
    , mc : "https://checkout.stripe.com/assets/cards/mastercard.png"
    , mc2x : "https://checkout.stripe.com/assets/cards/mastercard@2x.png"
    , amex : "https://checkout.stripe.com/assets/cards/amex.png"
    , amex2x : "https://checkout.stripe.com/assets/cards/amex@2x.png"
    , discover : "https://checkout.stripe.com/assets/cards/discover.png"
    , discover2x : "https://checkout.stripe.com/assets/cards/discover@2x.png"
};

function AppCntl($scope) {
}

function HeaderCntl($scope, $location, LoginService) {
    $scope.isActive = function(route) {
        return route === $location.path();
    };
}

function ShopCntl($scope, $rootScope, $route, $routeParams, $location, Ping) {
    $scope.registerClick = function(e) {
        console.log(e);
    };
}

function UserCntl($scope, profile, $http, $rootScope, $route, $routeParams, $location, UserService) {
    if (profile != "null" && profile != null) {
        $scope.user = profile;
        $scope.user.password = null;
    }
    $scope.$on('$viewContentLoaded', function(event) {

    });
    $scope.createUser = function() {
        var formUser = $scope.user;
        if (!formUser.id) {
            UserService.create(formUser, function(data) {
                $scope.user = data;
                $location.path("/shops");
            }, function(error, options) {

            });
        } else {
            UserService.update(formUser, function() {

            }, function() {

            });
        }
    };
}

UserCntl.resolve = {
    profile : function($http, $q) {
        var deferred = $q.defer();
        $http.get('/users')
            .success(function(user, options) {
                if (user.data != "null") {
                    deferred.resolve(user);
                } else {
                    deferred.resolve(null);
                }
            })
            .error(function(data, options) {
                deferred.resolve(null);
            });
        return deferred.promise;
    }
};


function AccessCntl($scope, $rootScope, $route, $routeParams, $location, LoginService) {
    var loginModal = $("#modalLogin");
    var loginErrorAlert = $("#login-alert-error");
    $scope.logUserOut = function() {
        LoginService.logout(function() {
            $location.path('/shops');
        }, function() {

        });
    };

    $scope.passwordEnter = function($event) {
        $event.preventDefault();
        var email = $scope.email, password = $scope.password;
        LoginService.login(email, password, function(user) {
            loginModal.modal('hide');
        }, function(error) {
            loginErrorAlert.show();
            setTimeout(function() {
                loginErrorAlert.fadeOut(500);
            }, 2500);
        });
    };

    $scope.showLoginModal = function() {
        loginModal.modal('show');
    };

    $scope.logUserIn = function() {
        var email = $scope.email, password = $scope.password;
        LoginService.login(email, password, function(user) {
            loginModal.modal('hide');
        }, function(error) {
            loginErrorAlert.show();
            setTimeout(function() {
                loginErrorAlert.fadeOut(500);
            }, 2500);
        });
    };

    $scope.showShops = function() {
        loginModal.modal('hide');
        $location.path('/shops');
    };

    $scope.createUser = function() {
        loginModal.modal('hide');
        $location.path('/user/new');
    }
}

function ArtisanCntl($scope, profile, $http, $rootScope, $route, $routeParams, $location, ArtisanService) {
    var tempProfilePath = null;
    var cardInfoSection = $("#cardInfoSection"), cardDetails = $("#cardDetails"), removeArtisanProfile = $("#deleteArtisanProfileBtn")
        , modalRemoveArtisan = $("#modalRemoveArtisan");
    cardInfoSection.hide();
    cardDetails.hide();
    removeArtisanProfile.hide();
    if (profile.profile != null) {
        $scope.artisan = profile.profile;
        removeArtisanProfile.show();
        $scope.stripeCustomer = profile.stripeCustomer;
        if ($scope.stripeCustomer != null) {
            setCardType();
        }
        if ($scope.artisan != null) {
            cardInfoSection.show();
        }
    }

    function setCardType() {
        if ($scope.stripeCustomer != null && typeof $scope.stripeCustomer.active_card != 'undefined') {
            if ($scope.stripeCustomer.active_card.type == "Visa") {
                $scope.cardTypeUrl = cardTypeUrls.visa;
            } else if ($scope.stripeCustomer.active_card.type == "MasterCard") {
                $scope.cardTypeUrl = cardTypeUrls.mc;
            } else if ($scope.stripeCustomer.active_card.type == "American Express") {
                $scope.cardTypeUrl = cardTypeUrls.amex;
            } else {
                $scope.cardTypeUrl = cardTypeUrls.discover;
            }
            cardDetails.show();
        }
    }

    $('#fileupload', this.el).fileupload({
        dataType: 'json'
        , url: '/images/temp/image'
        , xhrFields: {withCredentials: true}
        , acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .bar').css(
                'width',
                progress + '%'
            );
        },
        done: function (e, data) {
            $("#artisanProfilePhotoTemp").attr('src', data.result.url);
            tempProfilePath = data.result.filePath;
        }
    });

    $scope.saveProfile = function() {
        var profile = $scope.artisan;
        profile.tempFilePath = tempProfilePath;
        if (!profile.id) {
            ArtisanService.createArtisan(profile, function(data, options) {
                $scope.artisan = data;
                $scope.stripeCustomer = profile.stripeCustomer;
                removeArtisanProfile.show();
                setCardType();
                cardInfoSection.show();
                tempProfilePath = null;
            }, function(data, options) {

            });
        } else {
            ArtisanService.updateArtisan(profile, function(data, options) {
                tempProfilePath = null;
            }, function(data, options) {
                console.log("update error");
            });
        }
    };

    $scope.removeProfile = function() {
        var profile = $scope.artisan;
        modalRemoveArtisan.modal('hide');
        ArtisanService.deleteArtisan(profile, function(data, options) {
            $scope.artisan = null;
            $location.path('/user/update');
        }, function(data, options) {
            console.log("error deleting");
        });
    };

    $scope.showRemoveConfirm = function() {
        modalRemoveArtisan.modal('show');
    };

    $scope.removeConfirmModal = function() {
        modalRemoveArtisan.modal('hide');
    };

    $scope.addStripeCustomerId = function(id) {
        ArtisanService.addStripeCustomer(id, function(data, options) {
            $scope.stripeCustomer = data.stripeCustomer;
            setCardType();
        }, function(data, options) {
            console.log("error!");
            $scope.stripeCustomer = null;
        });
    };

}

ArtisanCntl.resolve = {
    profile : function($http, $q) {
        var deferred = $q.defer();
        $http.get('/profile/artisan')
            .success(function(profile, options) {
                if (profile.data != "null") {
                    deferred.resolve(profile);
                } else {
                    deferred.resolve(null);
                }
            })
            .error(function(data, options) {
                deferred.resolve(null);
            });
        return deferred.promise;
    }
};

function MerchantCntl($scope, merchProfile, $http, $rootScope, $route, $routeParams, $location, MerchantService) {
    var tempProfilePath = null;
    var merchLocationList = $("#merchLocationList");
    if (merchProfile != "null" && merchProfile != null) {
        $scope.merchant = merchProfile.profile;
        $scope.locations = merchProfile.locations;
    }
    console.log(merchProfile);
    if ($scope.locations == null || $scope.locations.length == 0) {
        merchLocationList.hide();
    } else {
        merchLocationList.show();
    }

    $('#fileupload', this.el).fileupload({
        dataType: 'json'
        , url: '/images/temp/image'
        , xhrFields: {withCredentials: true}
        , acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .bar').css(
                'width',
                progress + '%'
            );
        },
        done: function (e, data) {
            $("#merchantProfilePhotoTemp").attr('src', data.result.url);
            tempProfilePath = data.result.filePath;
        }
    });

    $scope.saveProfile = function() {
        var profile = $scope.merchant;
        profile.tempFilePath = tempProfilePath;
        if (!profile.id) {
            MerchantService.createMerchant(profile, function(data, options) {
                $scope.merchant = data.profile;
                tempProfilePath = null;
            }, function(data, options) {
                console.log("error creating profile");
            });
        } else {
            MerchantService.updateMerchant(profile, function(data, options) {
                $scope.merchant = data.profile;
                tempProfilePath = null;
            }, function(data, options) {
                console.log("error creating profile");
            });
        }
    }

}

MerchantCntl.resolve = {
    merchProfile : function($http, $q) {
        var deferred = $q.defer();
        $http.get('/profile/merchant')
            .success(function(profile, options) {
                if (profile.data != "null") {
                    deferred.resolve(profile);
                } else {
                    deferred.resolve(null);
                }
            })
            .error(function(data, options) {
                deferred.resolve(null);
            });
        return deferred.promise;
    }
};

function ArtisanProductCntl($scope, response, $http, $q, $rootScope, $route, $routeParams, $location, $timeout, ArtisanService) {
    var productThumbnailImg = $("#productThumbnailImg"), productFeatureImg = $("#productFeatureImg")
        , productTable = $("#product-table"), modalRemoveProduct = $("#modalRemoveProduct"), productDeleteInfo = $("#productDeleteInfo")
        , paginationSection = $("#pagination");
    var tempThumbnailPath, tempFeaturePath;
    if (response != null && (response.products != "null" && response.products != null && response.products.length > 0)) {
        $scope.artisanProducts = response.products;
        $scope.pages = response.pages;
        $scope.currentPageNumber = 0;
        $scope.lastPageNumber = response.pages.length - 1;
        if (response.pages.length <= 1) {
            paginationSection.hide();
        }
    } else {
        $scope.artisanProducts = [];
        productTable.hide();
    }

    $("#fileuploadThumbnail", this.el).fileupload({
        dataType: 'json'
        , url: '/images/temp/image'
        , xhrFields: {withCredentials: true}
        , acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .bar').css(
                'width',
                progress + '%'
            );
        },
        done: function (e, data) {
            $("#productThumbnailImg").attr('src', data.result.url);
            tempThumbnailPath = data.result.filePath;
        }
    });

    $("#fileuploadFeature", this.el).fileupload({
        dataType: 'json'
        , url: '/images/temp/image'
        , xhrFields: {withCredentials: true}
        , acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .bar').css(
                'width',
                progress + '%'
            );
        },
        done: function (e, data) {
            $("#productFeatureImg").attr('src', data.result.url);
            tempFeaturePath = data.result.filePath;
        }
    });

    var refreshListProduct = {
        list : function($q, $http) {
            var deferred = $q.defer();
            $http.get('/profile/artisan/products')
                .success(function(response, options) {
                    deferred.resolve(response);
                })
                .error(function(response, options) {
                    deferred.resolve([]);
                });
            return deferred.promise;
        }
        , paginateList : function($q, $http, start) {
             var deferred = $q.defer();
             $http.get('/profile/artisan/products?start=' + start)
                 .success(function(response, options) {
                     deferred.resolve(response);
                 })
                 .error(function(response, options) {
                     deferred.resolve([]);
                 });
             return deferred.promise;
         }
    };

    function resetCounters(data) {
        $scope.artisanProducts = data.products;
        $scope.pages = data.pages;
        $scope.currentPageNumber = 0;
        $scope.lastPageNumber = data.pages.length - 1;

        if ($scope.artisanProducts && $scope.artisanProducts.length == 0) {
            productTable.hide();
        }
    }

    $scope.saveProduct = function() {
        var product = $scope.product;
        product.tempThumbnailPath = tempThumbnailPath;
        product.tempFeaturePath = tempFeaturePath;
        if (!product.id) {
            ArtisanService.addProduct(product, function(data, options) {
                $scope.product = null;
                refreshListProduct.list($q, $http).then(function(data) {
                    resetCounters(data);
                });
                productThumbnailImg.attr('src', 'img/140_placeholder.png');
                productFeatureImg.attr('src', 'img/140_placeholder.png');
                productTable.show();
            }, function(data, options) {
                console.log("error");
            });
        } else {
            ArtisanService.updateProduct(product, function(data, options) {
                $scope.product = null;
                refreshListProduct.list($q, $http).then(function(data) {
                    resetCounters(data);
                });
                productThumbnailImg.attr('src', 'img/140_placeholder.png');
                productFeatureImg.attr('src', 'img/140_placeholder.png');
                productTable.show();
            }, function(data, options) {
                console.log("update error");
            });
        }
    };

    $scope.deleteProduct = function() {
        if ($scope.productToBeDelete != null) {
            var artisanProduct = $scope.productToBeDelete;
            ArtisanService.removeProduct(artisanProduct, function(data, options){
                $scope.productToBeDelete = null;
                modalRemoveProduct.modal('hide');
                refreshListProduct.list($q, $http).then(function(data) {
                    resetCounters(data);
                });
            }, function(data, options) {
                console.log(data);
                console.log("error");
            });
        }
    };

    $scope.deleteProductConfirm = function(artisanProduct) {
        $scope.productToBeDelete = artisanProduct;
        productDeleteInfo.text("Are you sure you want to delete " + artisanProduct.name + "?");
        modalRemoveProduct.modal('show');
    };

    $scope.deleteProductCancel = function() {
        $scope.productToBeDelete = null;
        modalRemoveProduct.modal('hide');
    };

    $scope.editProduct = function(artisanProduct) {
        $scope.oldData = angular.copy($scope.product);
        $scope.product = artisanProduct;
    };

    $scope.clearProduct = function() {
        if ($scope.oldData != null || typeof $scope.oldData != 'undefined') {
            $scope.product = angular.copy($scope.oldData);
            $scope.oldData = null;
        } else {
            $scope.product = null;
        }
    };

    $scope.paginate = function(start, number) {
        $scope.currentPageNumber = number;
        console.log("next start is %s | current page will be %s | last page will be %s", start, $scope.currentPageNumber, $scope.lastPageNumber);
        refreshListProduct.paginateList($q, $http, start).then(function(data) {
            $scope.artisanProducts = data.products;
            $scope.pages = response.pages;
        });
    };

    $scope.paginatePrev = function() {
        if ($scope.currentPageNumber > 0) {
            $scope.currentPageNumber--;
            var start = ($scope.currentPageNumber) * 10;
            console.log("next start is %s | current page will be %s | last page is %s", start, $scope.currentPageNumber, $scope.lastPageNumber);
            refreshListProduct.paginateList($q, $http, start).then(function(data) {
                $scope.artisanProducts = data.products;
                $scope.pages = data.pages;
            });
        }
    };

    $scope.paginateNext = function() {
        if ($scope.currentPageNumber < $scope.lastPageNumber) {
            var start = ($scope.currentPageNumber + 1) * 10;
            $scope.currentPageNumber++;
            console.log("next start is %s | current page will be %s | last page is %s", start, $scope.currentPageNumber, $scope.lastPageNumber);
            refreshListProduct.paginateList($q, $http, start).then(function(data) {
                $scope.artisanProducts = data.products;
                $scope.pages = data.pages;
            });
        }
    };

}

ArtisanProductCntl.resolve = {
    response : function($http, $q) {
        var deferred = $q.defer();
        $http.get('/profile/artisan/products')
            .success(function(response, options) {
                deferred.resolve(response);
            })
            .error(function(data, options) {
                deferred.resolve(null);
            });
        return deferred.promise;
    }
};

function MerchantLocationCntl($scope, $http, $q, $rootScope, $route, $routeParams, $location, $timeout, $compile, MerchantService) {
    $scope.imagePane = '/templates/account/partials/location-images.html';
    var imageView = $("#images");
    var locationImages = $("#locationImages");
    $scope.tabName = "images";
    var filePaths = [];
    //$scope.merchantLocation = null;

    $scope.$on('$viewContentLoaded', function(event) {

        $("#fileupload").fileupload({
            dataType: 'json'
            , url: '/images/temp/image'
            , xhrFields: {withCredentials: true}
            , acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            progress: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .bar').css(
                    'width',
                    progress + '%'
                );
            },
            done: function (e, data) {
                filePaths.push({filePath : data.result.filePath});
                var id = getRandom();
                imageView.append($compile(createLocationImageView(data.result.url, data.result.filePath, id))($scope));
            }
        });
    });

    $scope.saveLocation = function() {
        var location = $scope.merchantLocation;
        location.images = filePaths;
        MerchantService.createMerchantLocation(location, function(data, options) {
            console.log("success");
        }, function(data, options) {
            console.log("error");
        });
    };

    $scope.tabClick = function(tabName) {
        $scope.tabName = tabName;
    };

    $scope.removeTempImage = function(filePath, id) {
        MerchantService.removeTempImage(filePath, function(data, options) {
            $scope.filePaths.forEach(function(path, index) {
                if (path == filePath) {
                    $scope.filePaths.splice(index, 1);
                }
            }, this);
            $("#" + id).remove();
        }, function(data, options) {
            //nothing i guess
        });
    };

    function getRandom() {
        return Math.floor(Math.random() * 1000);
    }

}

function createLocationImageView(url, filePath, id) {
    var variable = "'" + filePath + "', '" + id + "'";
    var html = '<li id="'+id+'"><div class="thumbnail">';
    html += '<a colorbox="{transition:\'fade\', photo:true}" href="'+url+'">';
    html += '<img class="thumbnail" src="'+ url +'" alt="location image" style="width: 120px; height: 120px;"/>';
    html += "</a>";
    html += '<p style="text-align: center; margin-top: 3px;"><a ng-click="removeTempImage(' + variable + ')" class="btn btn-danger">Delete</a></p>';
    html += '</div></li>';
    return html;
}