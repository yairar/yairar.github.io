/**
 * Photo class
 */

angular.module('MainModule')
 .factory('Photo', function(){

    return function Photo(id){

        var self = this;

        var _id = id || '';
        var _title = '';
        var _photourlbase = ''; /* need to add '_[mstzb].jpg' */
        var _owner = '';
        var _fansIds = [];
        var _totalfavs = 0;

        self.getId = function getId(){
            return _id;
        }
        self.setProperties = function setProperties(title, farm, server, secret, owner){
        	_title = title;
            _photourlbase = 'https://farm'+farm+'.staticflickr.com/'+server+'/'+_id+'_'+secret;
            _owner = owner;
        }
        self.setTotalFavs = function setTotalFavs(totalfavs){
            _totalfavs = totalfavs;
        }

        self.getUrl = function getUrl(size){
        	return _photourlbase+'_'+size+'.jpg';
        }
        self.getPageUrl = function getPageUrl(){
        	return 'https://www.flickr.com/photos/'+_owner+'/'+_id+'/';
        }
        self.getTotalFavs = function getTotalFavs(){
            return _totalfavs;
        }

	}
 });