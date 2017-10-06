var express = require('express');
var rank = require('./routes/rank');
var lookup = require('./routes/lookup');
var configs = require('./configs/configs')

var app = express();
app.use(express.static('public'));

app.use('/rank', rank);
app.use('/lookup', lookup)

app.listen(configs.ServerConfigs.port, () => { console.log('Server started...') });