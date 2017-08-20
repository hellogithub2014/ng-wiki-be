var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'liubin119712!',
    database: 'ng-wiki'
});

module.exports = pool;