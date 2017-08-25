var articlesSQL = require('../sqls/articles.sql');
var pool = require('../core/mysql-pool');

function addArticleVisitCount(articleId, cb) {
    pool.query(articlesSQL.addArticleVisitCount, [articleId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results);
    });
}


function addArticleLikesCount(articleId, cb) {
    pool.query(articlesSQL.addArticleLikesCount, [articleId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results);
    });
}


function addArticleSharedCount(articleId, cb) {
    pool.query(articlesSQL.addArticleSharedCount, [articleId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results);
    });
}


exports.addArticleVisitCount = addArticleVisitCount;
exports.addArticleLikesCount = addArticleLikesCount;
exports.addArticleSharedCount = addArticleSharedCount;