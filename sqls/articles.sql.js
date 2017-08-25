const addArticleVisitCount = `
    UPDATE article
    SET visit_count=visit_count+1
    WHERE id=?
`;

const addArticleLikesCount = `
    UPDATE article
    SET likes_count=likes_count+1
    WHERE id=?
`;

const addArticleSharedCount = `
    UPDATE article
    SET shared_count=shared_count+1
    WHERE id=?
`;

exports.addArticleVisitCount = addArticleVisitCount;
exports.addArticleLikesCount = addArticleLikesCount;
exports.addArticleSharedCount = addArticleSharedCount;