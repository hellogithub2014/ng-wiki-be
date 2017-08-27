var articlesSQL = require('../sqls/articles.sql');
var pool = require('../core/mysql-pool');


/**
 * 根据文章id列表获取对应的文章列表
 * 
 * @param {any} articleIdList 
 * @param {any} successCb 
 * @param {any} errorCb 
 */
function getArticlesById(articleIdList, successCb, errorCb) {
    let sqlGetArticle = `
      SELECT 
          id, 
          author_id as authorId,
          title, 
          content, 
          visit_count as visitCount, 
          likes_count as likesCount,
          shared_count as sharedCount
      FROM
        article
      WHERE 
        id in (?)
        ; `; // 根据id获取article表中的数据
    let sqlGetCommentIdList = `
        SELECT
          comment_id as commentId
        FROM  
          article_comment_rel
        WHERE 
          article_id=?
        `; // 根据文章id获取评论列表数据
    // 先查不带评论的文章数组
    pool.query(sqlGetArticle, [articleIdList], function(error, results, fields) {
        if (error) {
            errorCb(error);
        }
        let articles = results; //没有查到时是一个空数组
        let articlesPromises = [];

        // 然后根据每篇文章的id去查找他对应的评论id列表,
        // TODO: 可以直接类似sqlGetArticle查到所有评论，然后再在内存中分配到每个article
        for (let article of articles) {
            articlesPromises.push(
                new Promise((resolve, reject) => {
                    pool.query(sqlGetCommentIdList, [+article.id], function(error, results, fields) {
                        if (error) {
                            reject(error);
                        }
                        article.comments = results.map(result => result.commentId);
                        resolve();
                    });
                })
            );
        }
        Promise.all(articlesPromises)
            .then(_ => successCb(articles))
            .catch(error => errorCb(error));
    });
}

/**
 * 获取指定作者的文章id列表
 * 
 * @param {any} userId 
 * @param {any} cb 
 */
function getArticleIdListByUser(userId, cb) {
    pool.query(articlesSQL.getArticleIdListByUser, [userId], (err, results) => {
        if (err) {
            cb(err);
            return;
        }
        cb(undefined, results.map(result => result.articleId));
    });
}

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

function insertArticle(article, cb) {
    pool.query(articlesSQL.insertArticle, [article.authorId, article.title, article.content], function(error, results, fields) {
        if (error) {
            next(error);
        }
        cb(undefined, results.insertId);
    });
}

function insertAuthorArticleRel(authorId, articleId, cb) {
    pool.query(articlesSQL.insertAuthorArticleRel, [authorId, articleId], (err, results) => {
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
exports.insertArticle = insertArticle;
exports.insertAuthorArticleRel = insertAuthorArticleRel;
exports.getArticleIdListByUser = getArticleIdListByUser;
exports.getArticlesById = getArticlesById;