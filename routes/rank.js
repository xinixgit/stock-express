var express = require('express');
var mysql = require('mysql');

var router = express.Router();
var configs = require('../utils/configs')

var pool = mysql.createPool(configs);

function queryDb(sqlStr, valArray, callback) {
    pool.getConnection(function (err, connection) {
        connection.query({
            sql: sqlStr,
            values: valArray
        }, function (err, rows, fields) {
            if (err)
                throw err;

            callback(rows, fields);
            connection.release();
        });
    });
};

router.get('/:termNo', function(req, res, next){
	var termNo = req.params.termNo;
	queryDb('SELECT t.*, m.term_name, cast(term_value as decimal(9, 2)) tv_int FROM anl_terms t, anl_terms_map m WHERE t.term_no = ? AND m.term_no = t.term_no ORDER BY tv_int desc limit ?;', 
        [termNo, 100], function(rows, fields){
        var a = [];
        var termName = rows[0].term_name || '';

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            delete r.term_no;
            delete r.tv_int;
            delete r.term_name;
            a.push(r);
        }

        res.json({
            data: a,
            term_no: termNo,
            term_name: termName
        })
    });
});

module.exports = router;