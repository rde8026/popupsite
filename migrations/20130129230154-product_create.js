var product_db = require('../database/Product')
    , artisan = require('../database/ArtisanProfile')
    , dbConnection = require('../database/db_conn').Connection;

module.exports = {
  up: function(migration, DataTypes) {

      artisan.artisanProfile.hasMany(product_db.product, { foreignKey : "artisanProfileId", as : 'Products'});
      product_db.product.belongsTo(artisan.artisanProfile, { foreignKey : "artisanProfileId", as : "ArtisanProfile"});


      dbConnection.sync()
          .success(function() {

              for (var i = 0; i < 124; i++) {
                  product_db.product.build({
                      name : "Widget " + i,
                      price : 10 * i,
                      description : "This is Widget " + i + "!",
                      thumbnailImage : 'http://s3.amazonaws.com/site_api_images/product/rvp6hatZH7.png'
                  }).save()
                      .complete(function(err, product) {
                          if (err) {
                              console.log(err);
                          }
                          else {
                              console.log("added product");
                              setArtisanProfile(product);
                          }
                      });
              }

          });

  },
  down: function(migration) {
    // add reverting commands here
  }
};

function setArtisanProfile(product) {
    artisan.findArtisanProfileById(1, function(err, profile) {
        product.setArtisanProfile(profile)
            .complete(function(err, prod) {
                console.log("created product " + prod.name);
            });
    });
}