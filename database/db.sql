ALTER TABLE rolesusers ADD CONSTRAINT fk_role_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
ALTER TABLE rolesusers ADD CONSTRAINT fk_role_role FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE rolesusers DROP FOREIGN KEY fk_role_user,
ALTER TABLE rolesusers DROP FOREIGN KEY fk_role_role;

ALTER TABLE artisan_profiles ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE artisan_profiles DROP FOREIGN KEY fk_user;

ALTER TABLE merchant_profiles ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE merchant_profiles DROP FOREIGN KEY fk_user;

ALTER TABLE products ADD CONSTRAINT fk_artisan FOREIGN KEY (artisanProfileId) REFERENCES artisan_profiles(id) ON DELETE CASCADE;
ALTER TABLE products DROP FOREIGN KEY fk_artisan;

ALTER TABLE merchant_locations ADD CONSTRAINT fk_merch_location FOREIGN KEY (merchantProfileId) REFERENCES merchant_profiles(id) ON DELETE CASCADE;
ALTER TABLE merchant_locations DROP FOREIGN KEY fk_merch_location;

ALERT TABLE location_images ADD CONSTRAINT fk_location_img FOREIGN KEY (merchantLocationId) REFERENCES merchant_locations(id) ON DELETE CASCADE;
ALTER TABLE location_images DROP FOREIGN KEY fk_location_img;
