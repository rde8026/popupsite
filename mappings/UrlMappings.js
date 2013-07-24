/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/24/13
 * Time: 7:17 AM
 * To change this template use File | Settings | File Templates.
 */


exports.urls = {
    USER_NEW : "/users/new"
    , USER_CREATE : "/users/create"
    , USER_VIEW : "/users/view/:id"
    , USER_UPDATE : "/users/update/:id"
    , USER_DELETE : "/users/delete/:id"
    , USER_SEARCH : "/users/search"
    , USER_GET_AJAX : "/users/ajax"

    , LOGIN_GET : "/users/login"
    , LOGIN_POST : "/users/login"

    , ACCOUNT_VIEW : "/users/account/view"
    , ACCOUNT_ARTISAN_PROFILE_NEW : "/users/artisan/profile/new"
    , ACCOUNT_ARTISAN_PROFILE_SAVE : "/profiles/artisan"
    , ACCOUNT_MERCHANT_PROFILE_VIEW : "/users/merchant/profile/view"
    , ACCOUNT_ARTISAN_PROFILE_GET_AJAX : "/profiles/artisan/:artisanProfileId"

    , ACCOUNT_ARTISAN_PROFILE_PRODUCT_NEW : "/users/artisan/product/new"
    , PRODUCT_CREATE_ASYNC  : "/products/create/async"
    , PRODUCT_GET_AJAX : "/products/artisan/:artisanId"
    , PRODUCT_REMOVE_AJAX : "/products/remove/:productId"

    , SHOP_LIST : "/shops/list"
    , SHOP_NEW : "/shops/new"
    , SHOP_CREATE : "/shops/create"
    , SHOP_VIEW : "/shops/view/:id"
    , SHOP_UPDATE : "/shops/update/:id"
    , SHOP_SEARCH : "/shops/search"

    , LOGOUT : "/users/logout"
};