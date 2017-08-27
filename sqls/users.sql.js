const insertAuthor = `
    INSERT INTO author (name,yst_number, department, speciality, hobby)
    VALUES (?,?,?,?,?)
`;

const getUserByNameAndNumber = `
      SELECT 
          id, 
          department, 
          speciality, 
          hobby,
          email
      FROM
        author
      WHERE 
        name=? AND yst_number=?
        ; `;

exports.insertAuthor = insertAuthor;
exports.getUserByNameAndNumber = getUserByNameAndNumber;