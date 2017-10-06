var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var configs = require('../configs/configs')

var pool = mysql.createPool(configs.DBConfigs);

router.get('/:symbols/:termLeng', function (req, res) {
  var symb = req.params.symbols;
  var termLen = req.params.termLeng;

  if (!symb || !termLen) {
      throw 'Not all parameters provided.';
  }

  var symbolArray = symb.split(',');
  for (var i = 0; i < symbolArray.length; i++) {
      symbolArray[i] = symbolArray[i].trim().toUpperCase();
  }

  console.log('Now retrieving data for symbols: ' + symbolArray)

  var obj = {
      term_len: termLen,
      symbols: symbolArray,
      data: {},
      daily_data: {},
      mappings: {}
  };

  var onError = function(err) {
  	console.log(err);
  };

	// 1. Get the mapping files
  extractMapping(obj).then(function(){
  	// 2. Get the standard analysis terms data
  	return extractStandardData(obj, symbolArray, termLen);
  }, onError).then(function(){
  	// 3. Get the special terms data
  	return extractSpecialData(obj, symbolArray);
  }, onError).then(function(){    	
  	res.send(obj);
  }, onError);
});

function queryDb(sql, vals, onSuccess, onError) {
	return new Promise(function(onSuccess, onError){
		pool.getConnection(function(err, connection) {
      connection.query({
        sql: sql,
        values: vals
      }, function (err, rows, fields) {
        if (err)
            onError(err)

        connection.release();
        onSuccess(rows, fields);	            
      });
    });
	});
}

function extractMapping(obj) {
	return new Promise(function(onSuccess, onError){
		queryDb(
			'SELECT * FROM anl_terms_map;', 
			[]
		).then(function(rows, fields){
	    var mappings = {
	        regular: {},
	        daily: {}
	    };

	    for (var i = 0; i < rows.length; i++) {
	        var r = rows[i];
	        var no = r.term_no;
	        var name = r.term_name;

	        if(no < 100) {
	            mappings.regular[no] = name;
	        } else {
	            mappings.daily[no] = name;
	        }
	    }

	    obj.mappings = mappings;
	    onSuccess();
    },function(err) {
    	onError(err);
    });
 	});
};

function extractStandardData(obj, symbolArray, termLen) {
	return new Promise(function(onSuccess, onError){
		queryDb(
			'SELECT * FROM anl_terms WHERE symbol in (?) AND term_length = ?;', 
			[symbolArray, termLen]
		).then(function(rows, fields) {
      var map = {};
      for (var i = 0; i < rows.length; i++) {
          var r = rows[i];

          var symb = r.symbol;
          var endDate = r.term_end_date;
          var no = r.term_no;
          var val = r.term_value;

          if (map[symb] == null) {
              map[symb] = {};
          }

          if (map[symb][endDate] == null) {
              map[symb][endDate] = {};
          }

          map[symb][endDate][no] = val;
      }

      obj.data = map;
      onSuccess();
    }, function(err){
    	onError(err);
    });
	});
};

function extractSpecialData(obj, symbolArray) {
	return new Promise(function(onSuccess, onError){
		queryDb('SELECT * FROM anl_terms WHERE symbol in (?) AND term_length = ?;', [symbolArray, 'daily'])
		.then(function(rows, fields) {
      var map = {};
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var symb = r.symbol;
        var no = r.term_no;
        var val = r.term_value;

        if(map[symb] == null) {
            map[symb] = {};
        }

        map[symb][no] = val;
      }

      obj.daily_data = map;
      onSuccess();
    }, function(err) {
    	onError(err);
    });
	});
};

module.exports = router;