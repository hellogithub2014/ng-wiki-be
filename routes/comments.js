var express = require('express');
var router = express.Router();
var pool = require('../core/mysql-pool');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'comments' });
});

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
        `;

    let sqlGetReplyListById = `
        SELECT 
          comment_id as commentId,
          reply_id as replyId
        FROM
            comment_reply_rel
        WHERE 
            comment_id IN (?)
        `;

    // 先根据articleId查出所对应的评论列表
    pool.query(sqlGetCommentListById, [articleId], function(error, results, fields) {
        if (error) {
            next(error);
        }
        let comments = results;
        const commentIdList = comments.map(comment => comment.id);
        // 再获取这些评论列表的回复列表
        pool.query(sqlGetReplyListById, [commentIdList], function(error, replyList, fields) {
            if (error) {
                next(error);
            }
            for (let comment of comments) {
                comment.replyList = replyList
                    .filter(reply => reply.commentId === comment.id)
                    .map(reply => reply.replyId);
            }
            res.send(JSON.stringify({ items: comments }));
        });
    });
});

module.exports = router;