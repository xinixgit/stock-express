angular.module('stockapp', [])
.controller('BodyController', function($scope, $http){
	$scope.result = {};
	$scope.inputs = {};
	$scope.ctrl = {};

	var parseSymbols = function(data) {
		$scope.result.symbols = data.symbols;
	};

	var parseTimeLength = function(data) {
		var symbols = data.symbols;
		var termLeng = [];

		for(var i=0; i<symbols.length; i++) {
			var symbol = symbols[i];
			var obj = data.data[symbol];
			if(!obj) {
				termLeng.push('');
				continue;
			}

			var arr = Object.keys(obj);
			var str = '';
			for(var j=0; j<arr.length; j++) {
				var timeStr = arr[j];
				var yr = timeStr.substring(2, 4);
				var mth = timeStr.substring(5, 7);
				var dt = timeStr.substring(8, 10);

				var shortTimeStr = mth + '.' + dt + '.' + yr;
				
				if(!str) {
					str = shortTimeStr;
				} else {
					str = str + ' | ' + shortTimeStr;
				}
			}

			termLeng.push(str);
		}

		$scope.result.termLeng = termLeng;
	};

	var parseAnalysisData = function(data) {
		var symbols = data.symbols;
		var mappings = data.mappings.regular;
		var termNoList = Object.keys(mappings);

		for(var k=0; k<termNoList.length; k++) {
			var termNo = termNoList[k];
			var termName = mappings[termNo];
			var row = [];

			for(var i=0; i<symbols.length; i++) {
				var symbol = symbols[i];
				var termLengObj = data.data[symbol];
				if(!termLengObj) {
					row.push('');
					continue;
				}

				var termLengKeys = Object.keys(termLengObj);
				var s = '';

				for(var j=0; j<termLengKeys.length; j++) {
					var termLeng = termLengKeys[j];
					var termDataMap = termLengObj[termLeng];	    			
					var termData = termDataMap[termNo];
					if(!termData) {
						s += '-';
					} else {
						s += (termData.substring(termData.length-3, termData.length) == '.00') ? 
								termData.substring(0, termData.length-3) : termData;
					}
					
					if(j < termLengKeys.length-1) {
						s += ' | ';
					}
				}

				row.push(s);
			}

			$scope.result.data[termName] = row;
		}

	}

	var parseDailyAnalysisData = function(data){
		var symbList = data.symbols;
		var dailyData = data.daily_data;
		var mappings = data.mappings.daily;
		var termNoList = Object.keys(mappings);

		for(var k=0; k<termNoList.length; k++) {
			var termNo = termNoList[k];
			var termName = mappings[termNo];
			var row = [];

			for(var i=0; i<symbList.length; i++) {
				var symbol = symbList[i];
				var termVal = '-';
				if (dailyData[symbol]) {
					termVal = dailyData[symbol][termNo] || '-';
				}
				row.push(termVal);
			}

			$scope.result.data[termName] = row;
		}
	}

	var handleData = function(data) {
		parseSymbols(data);
		parseTimeLength(data);
		parseAnalysisData(data);
		parseDailyAnalysisData(data);
	};

	$scope.ctrl.querySymbols = function() {
		$scope.result = {
			symbols: [],
			termLeng: [],
			data: {}
		};

		var inputs = $scope.inputs;
		var url = '/lookup/' + inputs.symbols + '/' + inputs.termLeng;

		$http.get(url).then(function(response){
			handleData(response.data);
		}, function(err){
			console.log(err);
		});
	};      
});