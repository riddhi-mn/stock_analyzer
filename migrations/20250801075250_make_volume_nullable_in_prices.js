exports.up = function(knex) {
  return knex.schema.alterTable('prices', table => {
    table.bigInteger('volume').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('prices', table => {
    table.bigInteger('volume').notNullable().alter();
  });
};
