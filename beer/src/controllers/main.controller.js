/**
 * Main controller
 */
 
angular.module('MainModule', [])
	.controller('MainController', ['$http', 'BEERS', function($http, BEERS) {
		var self = this;

		self.BEERS = BEERS;
		self.typefilter = '';
}]);
	