const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const Configs = require('../utils/configs')
const DataHelper = require('../utils/data-helper')

const pool = mysql.createPool(Configs.DBConfigs);

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

  DataHelper.extractMapping(obj, pool).then(() => {
    return DataHelper.extractStandardData(symbolArray, termLen, obj, pool);
  }).then(() => {
    return DataHelper.extractSpecialData(symbolArray, obj, pool);
  }).then(() => res.send(obj))

});

module.exports = router;
