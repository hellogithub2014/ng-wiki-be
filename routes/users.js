var express = require('express');
var pool = require('../core/mysql-pool');
var usersService = require('../services/users.service');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/**
 * 获取所有的作者列表
 */
router.get('/author-list', (req, res, next) => {
    let sqlGetAuthorList = `
      SELECT 
          id, 
          name,
          yst_number  as ystNumber, 
          department, 
          speciality, 
          hobby
      FROM
        author; `;

    let sqlGetArticleIdList = `
        SELECT
          article_id as articleId
        FROM  
          author_article_rel
        WHERE 
          author_id=?
        `;
    pool.query(sqlGetAuthorList, function(error, authors, fields) {
        console.log(authors);
        // 根据每个作者的id去查找他对应的文章id列表
        let articlesPromises = [];
        for (let author of authors) {
            let curPromise = new Promise((resolve, reject) => {
                pool.query(sqlGetArticleIdList, [author.id], function(error, results, fields) {
                    if (error) {
                        console.error(error);
                        reject(error);
                        next(error);
                    }
                    author.articles = results.map(result => result.articleId);
                    resolve();
                })
            });
            articlesPromises.push(curPromise);
        }
        // 因为query是异步的，所以必须等到所有查询全部结束，才能返回authors
        Promise.all(articlesPromises).then(_ => {
            res.send(JSON.stringify(authors))
        });
    })
});

/**
 * 根据id获取作者
 */
router.get('/author/:id', (req, res, next) => {
    let authorId = req.params.id;

    let sqlGetAuthorById = `
      SELECT 
          id, 
          name,
          yst_number  as ystNumber, 
          department, 
          speciality, 
          hobby
      FROM
        author
      WHERE 
        id=?
        ; `;

    let sqlGetArticleIdList = `
        SELECT
          article_id as articleId
        FROM  
          author_article_rel
        WHERE 
          author_id=?
        `;
    pool.query(sqlGetAuthorById, [+authorId], function(error, results, fields) {
        if (error) {
            next(error);
        }
        let author = results[0];
        if (!author) {
            res.send(JSON.stringify("null"));
            return;
        }
        // 根据每个作者的id去查找他对应的文章id列表
        pool.query(sqlGetArticleIdList, [author.id], function(error, results, fields) {
            if (error) {
                next(error);
            }
            author.articles = results.map(result => result.articleId);
            res.send(JSON.stringify(author));
        })
    });
});

/**
 * 注册新用户
 */
router.post('/add-author', (req, res, next) => {
    const userInfo = req.body;
    usersService.insertAuthor(userInfo, (err, userId) => {
        if (err) {
            next(err);
        }
        res.send(JSON.stringify(userId));
    });
});

/**
 * 登录
 */
router.post('/login', (req, res, next) => {
    const userInfo = req.body;
    usersService.validateLogin(userInfo, (error, result) => {
        if (error) {
            next(error);
        }
        res.send(JSON.stringify(result));
    })
});

module.exports = router;