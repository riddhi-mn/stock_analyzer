exports.up = function(knex) {
  return knex.schema.createTable('prices', table => {
    table.increments('id').primary();
    table.string('ticker', 10).notNullable();
    table.timestamp('timestamp').notNullable();
    table.decimal('open', 14, 4).notNullable();
    table.decimal('high', 14, 4).notNullable();
    table.decimal('low', 14, 4).notNullable();
    table.decimal('close', 14, 4).notNullable();
    table.bigInteger('volume').notNullable();     //check later if volume is available thru API
    table.index(['ticker', 'timestamp'], 'idx_prices_ticker_timestamp');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('prices');
};
