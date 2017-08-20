var express = require('express');
var router = express.Router();
var pool = require('../core/mysql-pool');

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
        ; `;
    let sqlGetCommentIdList = `
        SELECT
          comment_id as commentId
        FROM  
          article_comment_rel
        WHERE 
          article_id=?
        `;
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

router.get('/article/:id', function(req, res, next) {
    let articleId = req.params.id;
    getArticlesById([articleId],
        articles => res.send(JSON.stringify(articles[0])),
        error => next(error)
    );
});

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
module.exports = router;