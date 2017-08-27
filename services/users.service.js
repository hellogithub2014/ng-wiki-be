var pool = require('../core/mysql-pool');
var usersSQL = require('../sqls/users.sql');
var articlesService = require('./articles.service');

function insertAuthor(authorInfo, cb) {
    pool.query(usersSQL.insertAuthor, [authorInfo.name, authorInfo.ystNumber, authorInfo.department, authorInfo.speciality, authorInfo.hobby], function(err, results) {
        if (err) {
            cb(err);
            return;
        }
        cb(undefined, results.insertId); // 返回主键id，也就是authorId
    })
}

function validateLogin(userInfo, cb) {
    pool.query(usersSQL.getUserByNameAndNumber, [userInfo.name, userInfo.ystNumber], function(err, results) {
        if (err) {
            cb(err);
            return;
        }
        // 未查到信息
        if (!results || results.length <= 0) {
            cb(undefined, { status: false, errMsg: '信息校验失败' })
            return;
        }
        //获取作者的articles数组
        articlesService.getArticleIdListByUser(results[0].id, (error, articleIdList) => {
            if (error) {
                cb(error);
                return;
            }
            // 登录成功,
            cb(undefined, {
                status: true,
                user: Object.assign({}, userInfo, results[0], { articles: articleIdList })
            });
        });


    })
}

exports.insertAuthor = insertAuthor;
exports.validateLogin = validateLogin;