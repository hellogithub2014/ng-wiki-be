var express = require('express');
var router = express.Router();
var pool = require('../core/mysql-pool');
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'comments' });
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
            .then(_ => res.send(JSON.stringify({ items: comments })))
            .catch(error => next(error));
    });

});

module.exports = router;