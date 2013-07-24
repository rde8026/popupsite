/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/24/13
 * Time: 7:44 AM
 * To change this template use File | Settings | File Templates.
 */


exports.getBootStrapAlertMsg = function(msg) {
    return {class : "'alert alert-error fade in alert-style'", message : (msg) ? msg : "Sorry, an unknown error has occurred."};
};


exports.message = {
    //Create User
    PASSWORD_DO_NOT_MATCH : "Your password does not match the confirm"
    , GENERAL_ACCOUNT_CREATION_ERROR : "Sorry, there was a problem creating your account"
    , SESSION_CREATION_ERROR : "Sorry, there was a problem creating a session for you - please login again"
    , FIND_FULL_USER_ERROR : "Oops, we ran into a problem. Please try again!"
    , UPDATE_USER_ERROR : "Unable to update user"
    , USER_UPDATE_PASSWORD_MISSING_DATA : "You must provide your old password in order to update your password"
    , USER_UPDATE_SUCCESS_MESSAGE : "Your profile has been updated"
    //Login
    , LOGIN_GENERAL_ERROR : "Unable to login user"
    , LOGIN_NO_USER_FOUND : "No User found"

    //Profile
    , GENERAL_ARTISAN_ACCOUNT_CREATION_ERROR : "Sorry, there was a problem creating your profile."
    , GENERAL_ARTISAN_PROFILE_CREATION_ERROR : "Unable to create profile"
    , GENERAL_ARTISAN_PROFILE_UPDATE_ERROR : "Sorry, we were unable to update your profile"
    , FIND_ARTISAN_PROFILE_ERROR : "Unable to find artisan profile"

    , FIND_MERCHANT_PROFILE_GENERAL_ERROR : "Sorry, we were unable to find your profile"
    , CREATE_MERCHANT_PROFILE_GENERAL_ERROR : "Sorry, we were unable to create your profile"
    , CREATE_MERCHANT_PROFILE_SUCCESS : "Your profile has been created"
    , UPDATE_MERCHANT_PROFILE_GENERAL_ERROR : "Sorry, we were unable to update your profile"
    , UPDATE_MERCHANT_PROFILE_SUCCESS : "Your profile has been updated"

    , S3_STORAGE_ERROR : "We were unable to save your image"

    , PRODUCT_ASYNC_CREATE_GENERAL_ERROR : "Sorry we couldn't save your product"
    , PRODUCT_ASYNC_GET_GENERAL_ERROR : "Sorry we couldn't get your products"
    , PRODUCT_ASYNC_DELETE_GENERAL_ERROR : "Sorry we couldn't remove your product"
    , PRODUCT_ASYNC_UPDATE_GENERAL_ERROR : "Sorry we couldn't update your product"
    , PRODUCT_ASYNC_UPDATE_GENERAL_SUCCESS : "Your product has been updated"
    , PRODUCT_ASYNC_UPDATE_MISSING_ID_ERROR : "Missing product id"
};

exports.sqlUserErrorMappings = [
    {
        ER_DUP_ENTRY : "Sorry, a user with that username already exists"
    }
];

exports.activeTab = {
    SHOP_ACTIVE : {shop : true, account :false}
    , ACCOUNT_ACTIVE : {shop : false, account : true}
};