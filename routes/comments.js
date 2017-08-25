var express = require('express');
var router = express.Router();
var pool = require('../core/mysql-pool');
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'comments'
    });
});

/**
 * 根据文章id获取对应的评论列表
 */
router.post('/comment-list', (req, res, next) => {
    let articleId = req.body.articleId;
    if (!articleId) {
        return;
    }
    let sqlGetCommentListById = `
        SELECT 
          b.id, 
          b.article_id as articleId,
          b.content, 
          b.date, 
          b.user_id as userId, 
          b.to
        FROM
            article_comment_rel a
        INNER JOIN  comment b 
        ON  a.comment_id = b.id
        WHERE 
            a.article_id= ?
        `; // 根据id获取comment表中的评论列表

    let sqlGetReplyListById = `
        SELECT 
          comment_id as commentId,
          reply_id as replyId
        FROM
            comment_reply_rel
        WHERE 
            comment_id IN (?)
        `; // 根据id获取评论的回复列表

    let sqlGetAuthorById = `
      SELECT 
          id, 
          name
      FROM
        author
      WHERE 
        id IN (?)
        ; `; // 根据id获取用户列表

    // 先根据articleId查出所对应的评论列表
    pool.query(sqlGetCommentListById, [articleId], function(error, results, fields) {
        if (error) {
            next(error);
        }
        if (!results || results.length <= 0) { // 没有数据，返回空数组
            res.send(JSON.stringify({
                items: []
            }));
            return;
        }

        let comments = results.map(comment => Object.assign(comment, {
            date: moment(comment.date).format('YYYY-MM-DD HH:mm:ss') // 时间格式化
        }));
        const commentIdList = comments.map(comment => comment.id); // id是主键，故无需去重
        const commentUserIdList = Array.from(new Set(comments.map(comment => comment.userId))); // 写评论的userId列表，去重

        // 因为如下两个查询可以并行进行，但要等到都处理完成，整个请求才能完成，故使用promise控制
        let commentsPromises = [];
        commentsPromises.push(new Promise((resolve, reject) => {
            // 获取这些评论列表的回复列表
            pool.query(sqlGetReplyListById, [commentIdList], function(error, replyList, fields) {
                if (error) {
                    reject(error);
                }
                // replyList是所有评论的回复列表，需要筛选出来
                for (let comment of comments) {
                    comment.replyList = replyList
                        .filter(reply => reply.commentId === comment.id)
                        .map(reply => reply.replyId);
                }
                resolve();
            });
        }));
        commentsPromises.push(new Promise((resolve, reject) => {
            // 获取这些评论列表对应的username
            pool.query(sqlGetAuthorById, [commentUserIdList], function(error, userList, fields) {
                if (error) {
                    reject(error);
                }
                // replyList是所有的user列表，同样需要筛选出来
                for (let comment of comments) {
                    comment.userName = userList.find(user => user.id === comment.userId).name;
                }
                resolve();
            });
        }));

        Promise.all(commentsPromises)
            .then(_ => res.send(JSON.stringify({
                items: comments
            })))
            .catch(error => next(error));
    });

});

/**
 * 给文章添加评论，此评论可能是直接回复的文章，也可能是回复的某个另一条评论
 * 
 * @param {any} comment 
 * @param {any} addReplyFunc 如果是回复的某个另一条评论，那么会在此函数中编写多余的逻辑，参数是连接池中获得的connection
 */
function addArticleComment(comment, addReplyFunc, finishFunc) {
    pool.getConnection(function(err, connection) {
        if (err) {
            throw err;
        }
        // 整个过程需要在一个事务中进行
        connection.beginTransaction(function(err) { // 开始事务
            if (err) {
                throw err;
            }
            const to = comment.to || -1; // 评论的回复id，默认-1，表示直接回复的文章
            const now = moment().format('YYYY-MM-DD HH:mm:ss'); // 插入评论的时间
            // 往article_comment_rel插入一条数据
            const sqlInsertArticleCommentRel = `
                INSERT INTO  article_comment_rel(
                    article_id,
                    comment_id    
                )
                VALUES
                    (?,?)
                ; `;
            // 往comment插入一条数据
            const sqlInsertComment =
                'INSERT INTO  comment(' +
                'article_id,' +
                'content,' +
                'date,' +
                'user_id,' +
                '`to`' +
                ') VALUES( ? , ? , ? , ? , ? );';
            // 先插入评论
            pool.query(sqlInsertComment, [comment.articleId, comment.content, now, comment.userId, to],
                function(error, results, fields) {
                    if (error) {
                        return connection.rollback(function() {
                            throw error;
                        });
                    }
                    const commentId = results.insertId; // 新插入的评论的主键id
                    comment.id = commentId;


                    // 由于往article_comment_rel/comment_reply_rel插数据可以并行，所以使用promise
                    let promises = [];
                    promises.push(new Promise((resolve, reject) => {
                        // 根据获得的评论id往article_comment_rel插入一条数据
                        pool.query(
                            sqlInsertArticleCommentRel, [comment.articleId, commentId],
                            function(error, results, fields) {
                                if (error) {
                                    reject(error);
                                }
                                resolve();
                            });
                    }));
                    promises.push(new Promise((resolve, reject) => {
                        if (addReplyFunc) {
                            // 根据获得的评论id往comment_reply_rel插入一条数据
                            addReplyFunc(comment, connection, resolve, reject);
                        } else {
                            resolve();
                        }
                    }));

                    Promise.all([promises])
                        .then(_ => {
                            return new Promise((resolve, reject) => {
                                connection.commit(function(err) { // 提交事务
                                    if (err) {
                                        connection.rollback(function() {
                                            reject(err);
                                        });
                                    }
                                    // 等到所有表的数据都插完，返回前端感兴趣的数据
                                    resolve({
                                        commentId,
                                        commentDate: now
                                    });
                                });
                            })
                        })
                        .catch(err => {
                            return new Promise((resolve, reject) => {
                                connection.rollback(function() {
                                    console.error(err);
                                    resolve(null);
                                });
                            });
                        })
                        .then(result => finishFunc(result));
                });
        });
    });
}

/**
 * 给评论添加回复，此函数仅仅在comment-reply-rel中添加数据
 * 
 * @param {any} comment 回复
 * @param {any} connection 控制事务的数据库连接
 * @param {any} resolve promise的参数
 * @param {any} reject promise的参数
 */
function addReply(comment, connection, resolve, reject) {
    const sqlInsertCommentReplyRel = `
        INSERT INTO  comment_reply_rel(
            comment_id,
            reply_id
        )
        VALUES
            (?,?)
        ; `;
    connection.query(sqlInsertCommentReplyRel, [comment.to, comment.id], function(error, results, fields) {
        if (error) {
            reject(error);
        }
        resolve();
    });
}

/**
 * 添加评论的回复
 */
router.post('/add-comment-reply', (req, res, next) => {
    let comment = req.body;
    addArticleComment(comment, addReply, (result) => res.send(JSON.stringify(result)));
});

/**
 * 添加文章的评论
 */
router.post('/add-article-comment', (req, res, next) => {
    let comment = req.body;
    addArticleComment(comment, undefined, (result) => res.send(JSON.stringify(result)));
});

module.exports = router;