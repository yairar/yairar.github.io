/**
 * User class
 */

angular.module('MainModule')
    .factory('User', function(){

        return function User(name, nsid){

            var self = this;

            var _name = name || '';
            var _nsid = nsid || -1;  
            var _iconurl = 'https://www.flickr.com/images/buddyicon.gif'; /* default icon */
            var _photosurl = '';
            var _realname = '';
            var _total_likes = 0;
            var _total_photos = 0;

            self.getName = function getName(){
                return _name;
            }
            self.getNsid = function getNsid(){
                return _nsid;
            }
            self.getIconUrl = function getIconUrl(){
                return _iconurl;
            }
            self.getPhotosUrl = function getPhotosUrl(){
                return _photosurl;
            }           
            self.getRealname = function getRealname(){
                return _realname;
            }
            self.getTotalLikes = function getTotalLikes(){
                return _total_likes;
            }
            self.getTotalPhotos = function getTotalPhotos(){
                return _total_photos;
            }            

            self.setIconProperties = function setIcon(iconserver, iconfarm){
                _iconurl = 'http://farm'+iconfarm+'.staticflickr.com/'+iconserver+'/buddyicons/'+_nsid+'.jpg';
            }

            self.setProperties = function setProperties(realname, photosurl, totalphotos){
                _realname = realname;
                _photosurl = photosurl;
                _total_photos = totalphotos;
            }

            self.setTotalLikes = function setTotalLikes(totallikes){
                _total_likes = totallikes;
            }

        }
    });