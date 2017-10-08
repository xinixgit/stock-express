const DBUtils = require('../utils/dbutils')
const Log = require('../utils/logging')

const logError = (err) => { Log.error(err); }

const extractMapping = (obj, pool, onError = logError) => {
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

const extractStandardData = (symbolArray, termLen, obj, pool, onError = logError) => {
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

const extractSpecialData = (symbolArray, obj, pool, onError = logError) => {
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
};

const getRankedTermsByValue = (termNumber, obj, pool, limit = 100, onError = logError) => {
  return DBUtils.queryDb(
    'SELECT t.*, m.term_name, cast(term_value as decimal(9, 2)) tv_int FROM anl_terms t, anl_terms_map m WHERE t.term_no = ? AND m.term_no = t.term_no ORDER BY tv_int desc limit ?;',
    [termNumber, limit],
    pool
  ).then((rows, fields) => {
    if(rows.length == 0) {
      return {};
    }

    let a = [];
    let termName = rows[0].term_name || '';

    for (let i = 0; i < rows.length; i++) {
      let r = rows[i];
      delete r.term_no;
      delete r.tv_int;
      delete r.term_name;
      a.push(r);
    }

    obj.ranked_data = a
  }, onError);
};

module.exports = {
  logError,
  extractMapping,
  extractStandardData,
  extractSpecialData,
  getRankedTermsByValue
};