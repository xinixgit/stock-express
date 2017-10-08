var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var configs = require('../utils/configs')
var DBUtils = require('../utils/dbutils')
const Log = require('../utils/logging')

var pool = mysql.createPool(configs.DBConfigs);

router.get('/:symbols/:termLeng', function (req, res) {
  let symb = req.params.symbols;
  let termLen = req.params.termLeng;

  if (!symb || !termLen) {
    throw 'Not all parameters provided.';
  }

  let symbolArray = symb.split(',');
  for (let i = 0; i < symbolArray.length; i++) {
    symbolArray[i] = symbolArray[i].trim().toUpperCase();
  }

  console.log('Now retrieving data for symbols: ' + symbolArray)

  let obj = {
    term_len: termLen,
    symbols: symbolArray,
    data: {},
    daily_data: {},
    mappings: {}
  };

  const onError = (err) => { Log.error(err); }

  const extractMapping = (obj) => {
    return DBUtils.queryDb(
      'SELECT * FROM anl_terms_map;', 
      [],
      pool
    ).then((rows, fields) => {
      let mappings = {
          regular: {},
          daily: {}
      };

      for (let i = 0; i < rows.length; i++) {
        let r = rows[i];
        let no = r.term_no;
        let name = r.term_name;

        if(no < 100) {
          mappings.regular[no] = name;
        } else {
          mappings.daily[no] = name;
        }
      }

      obj.mappings = mappings;
    }, onError);
  };

  const extractStandardData = (obj, symbolArray, termLen) => {
    return DBUtils.queryDb(
      'SELECT * FROM anl_terms WHERE symbol in (?) AND term_length = ?;', 
      [symbolArray, termLen],
      pool
    ).then(function(rows, fields) {
      let map = {};
      for (let i = 0; i < rows.length; i++) {
        let r = rows[i];

        let symb = r.symbol;
        let endDate = r.term_end_date;
        let no = r.term_no;
        let val = r.term_value;

        if (map[symb] == null) {
          map[symb] = {};
        }

        if (map[symb][endDate] == null) {
          map[symb][endDate] = {};
        }

        map[symb][endDate][no] = val;
      }

      obj.data = map;
    }, onError);
  };

  const extractSpecialData = (obj, symbolArray) => {
    return DBUtils.queryDb(
      'SELECT * FROM anl_terms WHERE symbol in (?) AND term_length = ?;', 
      [symbolArray, 'daily'],
      pool,
    ).then((rows, fields) => {
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
    }, onError);
  }

  extractMapping(obj).then(() => {
    return extractStandardData(obj, symbolArray, termLen);
  }).then(() => {
    return extractSpecialData(obj, symbolArray);
  }).then(() => res.send(obj))

});

module.exports = router;
