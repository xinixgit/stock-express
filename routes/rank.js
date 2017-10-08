const express = require('express');
const router = express.Router();
const mysql = require('mysql');


const configs = require('../utils/configs');
const DataHelper = require('../utils/data-helper')

const pool = mysql.createPool(configs.DBConfigs);

router.get('/:termNo', function(req, res, next){
  let termNo = req.params.termNo;
  let obj = {
    ranked_data: [],
    mappings: {}
  };

  DataHelper.extractMapping(obj, pool).then(() => {
    return DataHelper.getRankedTermsByValue(termNo, obj, pool);
  }, DataHelper.logError).then(() => {
    res.json({
      term_no: termNo,
      term_name: obj.mappings.regular[termNo] || obj.mappings.daily[termNo],
      data: obj.ranked_data
    });
  }, DataHelper.logError);
});

module.exports = router;