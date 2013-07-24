/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 2/8/13
 * Time: 1:36 PM
 */

'use strict';

describe('Run e2e Tests', function() {

    /*beforeEach(function() {
        browser().navigateTo('../../index.html');
    });*/

    describe('Fill out form and submit user!', function() {

        it('should automatically redirect to /shops when location hash/fragment is empty', function() {
            browser().navigateTo('../../index.html');
            expect(browser().location().url()).toBe('/shops');
            //pause();
        });
        it('should click on create user and fill out form!', function() {
            element('#navCreateUserHref').click();
            expect(browser().location().url()).toBe('/user/new');
            input('user.email').enter('e2etest@popup.com');
            input('user.firstName').enter('e2dFirstName');
            input('user.lastName').enter('e2dLastName');
            input('user.password').enter('dummypassword');
            input('user.confirm').enter('dummypassword');
            element('#createUser').click();
            expect(browser().location().url()).toBe('/shops');
        });
    });


    describe('Create Artisan Test', function() {

        describe('Fill out form and submit artisan!', function() {

            it('should navigate to artisan page', function() {
                element("#navArtisanProfileHref").click();
                expect(browser().location().url()).toBe('/profile/artisan');
            });

            it('should fill out form and create artisan', function() {
                input('artisan.companyName').enter('e2eCompanyName');
                input('artisan.website').enter('http://e2eTest.com');
                input('artisan.location').enter('Boston, MA');
                input('artisan.story').enter('e2d story');
                select('artisan.classification').option('Class1');
                element("#createArtisanProfileBtn").click();
                element("#navShopHref").click();
            });

        });

    });

    describe('Delete Artisan Test', function() {
        it ('should remove artisan profile', function() {
            element("#navArtisanProfileHref").click();
            expect(browser().location().url()).toBe('/profile/artisan');
            element("#deleteArtisanProfileBtn").click();
            element("#confirmRemoveProfile").click();
        });
    });

});
