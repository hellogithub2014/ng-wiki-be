const updateVisitCount = `
    UPDATE article
    SET visit_count=visit_count+1
    WHERE id=?
`;

const addLikesCount = `
    UPDATE article
    SET likes_count=likes_count+1
    WHERE id=?
`;

const decrementLikesCount = `
    UPDATE article
    SET likes_count=likes_count-1
    WHERE id=? AND likes_count>0
`;

const updateSharedCount = `
    UPDATE article
    SET shared_count=shared_count+1
    WHERE id=?
`;

const getLikesFlag = `
    SELECT COUNT(1) as count
    FROM article_likers
    WHERE article_id=? AND liker_id=?
`;

const insertArticleLiker = `
    INSERT INTO article_likers (article_id,liker_id)
    VALUES (?,?)
`;


const deleteArticleLiker = `
    DELETE FROM article_likers
    WHERE article_id=? AND liker_id=?
`;

exports.addArticleVisitCount = updateVisitCount;
exports.addArticleLikesCount = addLikesCount;
exports.decrementLikesCount = decrementLikesCount;
exports.addArticleSharedCount = updateSharedCount;
exports.getLikesFlag = getLikesFlag;
exports.insertArticleLiker = insertArticleLiker;
exports.deleteArticleLiker = deleteArticleLiker;