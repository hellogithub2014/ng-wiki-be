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


function decrementArticleLikesCount(articleId, cb) {
    pool.query(articlesSQL.decrementLikesCount, [articleId], (err, results) => {
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

function getLikesFlag(articleId, likerId, cb) {
    pool.query(articlesSQL.getLikesFlag, [articleId, likerId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results[0]["count"] ? true : false);
    });
}

function insertArticleLiker(articleId, likerId, cb) {
    pool.query(articlesSQL.insertArticleLiker, [articleId, likerId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results);
    });
}


function deleteArticleLiker(articleId, likerId, cb) {
    pool.query(articlesSQL.deleteArticleLiker, [articleId, likerId], (err, results) => {
        if (err) {
            cb(err);
        }
        cb(undefined, results);
    });
}

exports.addArticleVisitCount = addArticleVisitCount;
exports.addArticleLikesCount = addArticleLikesCount;
exports.decrementArticleLikesCount = decrementArticleLikesCount;
exports.addArticleSharedCount = addArticleSharedCount;
exports.getLikesFlag = getLikesFlag;
exports.insertArticleLiker = insertArticleLiker;
exports.deleteArticleLiker = deleteArticleLiker;