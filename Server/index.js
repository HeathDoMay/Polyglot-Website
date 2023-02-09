//Libraries
const express = require('express');
const multer  = require('multer');
const mysql = require('mysql2');

//Setup defaults for script
const app = express();
const upload = multer()
const port = 80 //Default port to http server
const connection = mysql.createConnection({
    host: "student-databases.cvode4s4cwrc.us-west-2.rds.amazonaws.com",
    user: "in_class_activity",
    password: "in_class_activity",
    database: 'in_class_activity'
});

//The * in app.* needs to match the method type of the request
app.post('/', upload.none(), (request, response) => {
        let selectSql = `SELECT 
                            m.abbreviation AS major, 
                            c.number,
                            CONCAT(f.first_name, ' ', f.last_name) AS professor 
                        FROM classes c
                        INNER JOIN majors m ON c.major_id = m.id
                        INNER JOIN faculty f ON c.faculty_id = f.id`,
            whereStatements = [],
            orderByStatements = [],
            queryParameters = [];

        if (typeof request.body.gimm !== 'undefined' && parseInt(request.body.gimm) === 0) {
            whereStatements.push("m.abbreviation != 'GIMM'"); 
        }
        
        if (typeof request.body.instructor !== 'undefined' && request.body.instructor.length > 0) {
            const instructor = request.body.instructor;
            whereStatements.push("CONCAT(f.first_name, ' ', f.last_name) LIKE ?");
            queryParameters.push('%' + instructor + '%');
        }
        
        if (typeof request.body.level !== 'undefined' && parseInt(request.body.level) !== 0) {
            const classLevel = parseInt(request.body.level);
            whereStatements.push('c.number BETWEEN ? AND ?'); 
            queryParameters.push(classLevel);
            queryParameters.push((classLevel + 99));
        }
        
        if (typeof request.body.sort !== 'undefined') {
            const sort = request.body.sort;
            if (sort === 'ASC') {
                orderByStatements.push('c.number ASC');
            } else if (sort === 'DESC') {
                orderByStatements.push('c.number DESC')
            }
        }

        //Dynamically add WHERE expressions to SELECT statements if needed
        if (whereStatements.length > 0) {
            selectSql = selectSql + ' WHERE ' + whereStatements.join(' AND ');
        }

        //Dynamically add ORDER BY expressions to SELECT statements if needed
        if (orderByStatements.length > 0) {
            selectSql = selectSql + ' ORDER BY ' + orderByStatements.join(', ');
        }

        //Dynamically add ORDER BY expressions to SELECT statements if needed
        if (typeof request.body.limit !== 'undefined' && request.body.limit > 0 &&  request.body.limit < 6) {
            selectSql = selectSql + ' LIMIT ' + request.body.limit;
        }

        console.log(selectSql);
        connection.query(selectSql, queryParameters, (error, result) => {
        if (error)  {
            console.log(error);
            return response
                .status(500) //Error code when something goes wrong with the server
                .setHeader('Access-Control-Allow-Origin', '*') //Prevent CORS error
                .json({message: 'Something went wrong with the server.'});
        } else {
            //Default response object
            response
                .setHeader('Access-Control-Allow-Origin', '*') //Prevent CORS error
                .json({'data': result});
        }
    }); 
});

app.listen(port, () => {
    console.log(`Application listening at http://localhost:${port}`);
})