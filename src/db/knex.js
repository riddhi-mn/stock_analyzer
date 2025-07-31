// src/db/knex.js
const knexLib   = require('knex');              
const knexfile  = require('../../knexfile.js'); 

const env    = process.env.NODE_ENV || 'development';  
const config = knexfile[env];                   

const knex = knexLib(config);                  

module.exports = knex;                          
