var express = require('express');
var router = express.Router();
var pool = require('../core/mysql-pool');

var articlesService = require('../services/articles.service');

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

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'atticle home page' });
});

/**
 * 根据id获取单条文章
 */
router.get('/article/:id', function(req, res, next) {
    let articleId = req.params.id;
    getArticlesById([articleId],
        articles => res.send(JSON.stringify(articles[0])),
        error => next(error)
    );
});
/**
 * 根据id列表获取对应的文章列表。 id列表由逗号分隔，如"1,2,3"
 */
router.post('/articles', (req, res, next) => {
    let articleIdList = req.body.idList.split(',');
    getArticlesById(articleIdList,
        articles => res.send(JSON.stringify(articles)),
        error => next(error)
    );
});
/**
 * 创建新文章，返回新建的文章id
 */
router.post('/create-article', (req, res, next) => {
    let article = req.body;
    if (!article) {
        return;
    }
    let sqlInsertArticle = `
        INSERT INTO  article(
            author_id,
            title, 
            content)
        VALUES
            (?,?,?)
        ; `;
    pool.query(sqlInsertArticle, [article.authorId, article.title, article.content], function(error, results, fields) {
        if (error) {
            next(error);
        }
        res.status(200).send(results.insertId); // 返回主键id
    });
});

/**
 * 为文章阅读量加1
 */
router.post('/add-article-visit-count', (req, res, next) => {
    let articleId = req.body.articleId;
    articlesService.addArticleVisitCount(articleId, (error, result) => {
        if (error) {
            next(error);
        }
        res.send(JSON.stringify(true)); // 操作成功返回true
    })
});


/**
 * 切换文章点赞，若之前点过赞，则取消点赞
 * 
 * 查询文章和点赞用户id的关系表，若数据库中存在记录，则表示此用户点过赞，此时从数据库中删除记录
 * 若不存在记录，则插入一条记录。
 * 
 */
router.post('/toggle-article-likes-flag', (req, res, next) => {
    let { articleId, likerId } = req.body;
    // 先查询是否点过赞
    articlesService.getLikesFlag(articleId, likerId, (error, result) => {
        if (error) {
            next(error);
        }
        // 点过赞则result=true，没点过result=false
        if (result) {
            // 删除点赞记录
            articlesService.deleteArticleLiker(articleId, likerId, (err, result) => {
                if (err) { next(err) }
                // 并将文章点赞数减1
                articlesService.decrementArticleLikesCount(articleId, (error, result) => {
                    if (error) {
                        next(error);
                    }
                    res.send(JSON.stringify(true)); // 操作成功返回true
                })
            });
        } else {
            // 插入一条点赞记录
            articlesService.insertArticleLiker(articleId, likerId, (err, result) => {
                if (err) { next(err) }
                // 并将文章点赞数加1
                articlesService.addArticleLikesCount(articleId, (error, result) => {
                    if (error) {
                        next(error);
                    }
                    res.send(JSON.stringify(true)); // 操作成功返回true
                })
            });
        }
    });


});

/**
 * 查询某人是否给谋篇文章点过赞
 */
router.post('/get-article-likes-flag', (req, res, next) => {
    let { articleId, likerId } = req.body;
    articlesService.getLikesFlag(articleId, likerId, (error, result) => {
        if (error) {
            next(error);
        }
        res.send(JSON.stringify(result)); // 点过赞则返回true，没点过返回false
    });
});

/**
 * 为文章分享量加1
 */
router.post('/add-article-shared-count', (req, res, next) => {
    let articleId = req.body.articleId;
    articlesService.addArticleSharedCount(articleId, (error, result) => {
        if (error) {
            next(error);
        }
        res.send(JSON.stringify(true)); // 操作成功返回true
    })
});

module.exports = router;