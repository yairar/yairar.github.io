/**
 * singleton for interacting with the task api
 */

angular.module('MainModule')
 .service('userService', ['User', 'Photo', '$http', '$q', 'FLICKR_API_URL', 'API_KEY', 
    function(User, Photo, $http, $q, FLICKR_API_URL, API_KEY){

    var self = this;
    
    /* Service variables */
    self.numberOfBestFans = 10;
    self.userPhotosCounter = 0;
    self.userPhotosTotalFavs = 0;

    /**
     * flickr.people.findByUsername
     * @returns {Promise<User>}
     */
    self.findByUsername = function findByUsername(username){
        return $http({
            method: 'GET',
            url: FLICKR_API_URL,
			params: {
				'format':'json',
				'method':'flickr.people.findByUsername',
				'api_key': API_KEY,
				'nojsoncallback':'1',
				
				'username': username
			}                
        }).then(function(res){
        	/*
        	example response:
        	{ "user": { "id": "93288407@N02", "nsid": "93288407@N02", 
			  "username": { "_content": "Yair Aronshtam" } }, "stat": "ok" }
        	*/
        	var user;
        	if (res.data.stat == "fail")
        	{
        		user = new User("Used not found", 0);
        	}
        	else
        	{
        		user = new User(res.data.user.username._content, res.data.user.nsid);
        	}
            return user;
        });
    }        

    /**
     * flickr.people.getInfo
     * @returns {Promise<User>}
     */
    self.getInfo = function getInfo(user_id){
        return $http({
            method: 'GET',
            url: FLICKR_API_URL,
			params: {
				'format':'json',
				'method':'flickr.people.getInfo',
				'api_key': API_KEY,
				'nojsoncallback':'1',
				
				'user_id': user_id
			}                
        }).then(function(res){
    		/*
			{ "person": { "id": "93288407@N02", "nsid": "93288407@N02", "ispro": 0, "can_buy_pro": 0, "iconserver": "7372", "iconfarm": 8, "path_alias": "yairar", "has_stats": 0, 
					    "username": { "_content": "Yair Aronshtam" }, 
					    "realname": { "_content": "Yair Aronshtam" }, 
					    "location": { "_content": "Israel" }, 
					    "timezone": { "label": "Jerusalem", "offset": "+02:00", "timezone_id": "Asia\/Jerusalem" }, 
					    "description": { "_content": "Welcome!\n\nI love taking pictures and photo processing. This is one of my hobbies (Check out my website too!)\n\nI'm still in the beginning of learning photo techniques:\n* Using Canon EOS 550D (Rebel T2i) since March 2012\n* Using Lens EF85mm f\/1.8 USM since September 2015\n* Started RAW processing in October 2015\n  Using: RawTherapee, Digital Photo Professional (Canon) for &quot;HDR from single RAW&quot; \n\nUsing Auto Exposure Bracketing (AEB) method for creating HDR photos since May 2016\nUsing Brenizer method for creating photographs with shallow depth of field not possible with a single shot since August 2016\n\n<a href=\"http:\/\/www.flickriver.com\/photos\/yairar\/popular-interesting\/\" rel=\"nofollow\"><img class='notsowide' src=\"https:\/\/ec.yimg.com\/ec?url=http%3A%2F%2Fwww.flickriver.com%2Fbadge%2Fuser%2Fall%2Finteresting%2Fshuffle%2Fmedium-horiz%2Fffffff%2F333333%2F93288407%40N02.jpg&t=1481197325&sig=xvRXSABeCjPdn_DBGKtRzQ--~C\" alt=\"Yair Aronshtam - View my most interesting photos on Flickriver\" title=\"Yair Aronshtam - View my most interesting photos on Flickriver\" \/><\/a>" }, 
					    "photosurl": { "_content": "https:\/\/www.flickr.com\/photos\/yairar\/" }, 
					    "profileurl": { "_content": "https:\/\/www.flickr.com\/people\/yairar\/" }, 
					    "mobileurl": { "_content": "https:\/\/m.flickr.com\/photostream.gne?id=93268059" }, 
					    "photos": { 
					      "firstdatetaken": { "_content": "2007-04-06 00:40:57" }, 
					      "firstdate": { "_content": "1387450127" }, 
					      "count": { "_content": "497" } } }, "stat": "ok" }
    		*/
            var user = new User(res.data.person.username._content, res.data.person.nsid);
            user.setIconProperties(res.data.person.iconserver, res.data.person.iconfarm);
            user.setProperties(res.data.person.username._content || '',
            			       (res.data.person.photosurl._content || ''),
            			       (res.data.person.photos.count._content || 0) );
            return user;
        }, function(err){
        	console.log(err);
        });
    }   

    /**
     * flickr.people.getPhotos
     * @returns {Promise []<Photo>}
     */
    self.getPhotos = function getPhotos(user_id, per_page){
        return $http({
            method: 'GET',
            url: FLICKR_API_URL,
			params: {
				'format':'json',
				'method':'flickr.people.getPhotos',
				'api_key': API_KEY,
				'nojsoncallback':'1',
				
				'user_id': user_id,
				'per_page': per_page /* The maximum allowed value is 500 */
			}                
        }).then(function(res){
        	/*
			{ "photos": { "page": 1, "pages": 5, "perpage": 100, "total": "497", 
			    "photo": [
			      { "id": "30692337833", "owner": "93288407@N02", "secret": "f18dfcf155", "server": "185", "farm": 1, "title": "Autumn", "ispublic": 1, "isfriend": 0, "isfamily": 0 },
			    ] }, "stat": "ok" }
        	*/
        	var result = [];
        	angular.forEach(res.data.photos.photo, function(photo){
        		var p = new Photo(photo.id);
        		p.setProperties(photo.title, photo.farm, photo.server, photo.secret, photo.owner);
        		result.push(p);
        	})
        	return result;
       	});
    }

    /**
     * flickr.photos.search
     * @returns {Promise []<Photo>}
     */
    self.searchPhotosByDate = function searchPhotosByDate(user_id, per_page, min_upload_date, max_upload_date){
        return $http({
            method: 'GET',
            url: FLICKR_API_URL,
            params: {
                'format':'json',
                'method':'flickr.photos.search',
                'api_key': API_KEY,
                'nojsoncallback':'1',
                
                'user_id': user_id,
                'per_page': per_page, /* The maximum allowed value is 500 */
                'min_upload_date': min_upload_date,
                'max_upload_date': max_upload_date
            }                
        }).then(function(res){
            /*
            { "photos": { "page": 1, "pages": 1, "perpage": "500", "total": "158", 
                "photo": [
                  { "id": "31387032050", "owner": "93288407@N02", "secret": "58a400a4eb", "server": "5578", "farm": 6, "title": "Коряга", "ispublic": 1, "isfriend": 0, "isfamily": 0 },
                ] }, "stat": "ok" }
            */
            var result = [];
            angular.forEach(res.data.photos.photo, function(photo){
                var p = new Photo(photo.id);
                p.setProperties(photo.title, photo.farm, photo.server, photo.secret, photo.owner);
                result.push(p);
            })
            return result;
        });
    }

    /**
     * flickr.photos.getFavorites for one photo
     * @returns {Promise []<user_id>}
     */
    self.getFavorites = function getFavorites(photo, page){
			// get all Favorites for this photo id
			return $http({
	            method: 'GET',
	            url: FLICKR_API_URL,
				params: {
					'format':'json',
					'method':'flickr.photos.getFavorites',
					'api_key': API_KEY,
					'nojsoncallback':'1',
					
					'photo_id': photo.getId(),
					'per_page': 50, /* The maximum allowed value is 50 */
					'page': page
				}                
        	});
    }

    /**
     * flickr.photos.comments.getList - Returns the comments for a photo
     * @returns 
     */
    self.getComments = function getComments(photo){
	/*
	{ "comments": { "photo_id": "30692337833", 
	    "comment": [
	      { "id": "93268059-30692337833-72157677479446216", "author": "60342453@N06", "author_is_deleted": 0, "authorname": "Luís Henrique Boucault", "iconserver": "3225", "iconfarm": 4, "datecreate": "1481197342", "permalink": "https:\/\/www.flickr.com\/photos\/yairar\/30692337833\/#comment72157677479446216", "path_alias": "lhboucault", "realname": "Luís Henrique de Moraes Boucault", "_content": "Very nice shot! Well done!" },
	      { "id": "93268059-30692337833-72157673688247273", "author": "93288407@N02", "author_is_deleted": 0, "authorname": "Yair Aronshtam", "iconserver": "7372", "iconfarm": 8, "datecreate": "1481211265", "permalink": "https:\/\/www.flickr.com\/photos\/yairar\/30692337833\/#comment72157673688247273", "path_alias": "yairar", "realname": "Yair Aronshtam", "_content": "[https:\/\/www.flickr.com\/photos\/lhboucault] Thanks!" },
	      { "id": "93268059-30692337833-72157673692022553", "author": "22695810@N04", "author_is_deleted": 0, "authorname": "lunaryuna", "iconserver": "1462", "iconfarm": 2, "datecreate": "1481216518", "permalink": "https:\/\/www.flickr.com\/photos\/yairar\/30692337833\/#comment72157673692022553", "path_alias": "lunaryuna", "realname": "", "_content": "splendid piece of work!" },
	      { "id": "93268059-30692337833-72157676068361791", "author": "93288407@N02", "author_is_deleted": 0, "authorname": "Yair Aronshtam", "iconserver": "7372", "iconfarm": 8, "datecreate": "1481408689", "permalink": "https:\/\/www.flickr.com\/photos\/yairar\/30692337833\/#comment72157676068361791", "path_alias": "yairar", "realname": "Yair Aronshtam", "_content": "[https:\/\/www.flickr.com\/photos\/lunaryuna] Thanks!" }
	    ] }, "stat": "ok" }
	*/

	}

    /**
     * using getFavorites, getComments, getViews
     * Input: photoArr - []<Photo> (array of Photo objects)
     * @returns []<Photo> - array of Photo objects with updated "Numeber of Favs, Number of Comments, Number of Views"
     */
    self.getPhotosPopulatiry = function getPhotosPopulatiry(photosArr){
    	var all_fans = {};
    	var promises = [];
    	self.userPhotosCounter = 0;
        self.userPhotosTotalFavs = 0;
		angular.forEach(photosArr, function(photo) {
			// get all Favorites for this photo id
			var promise = self.getFavorites(photo, 1).then(function(res){
	        	/*
				{ "photo": { 
				    "person": [
				      { "nsid": "138308002@N07", "username": "dombinadi", "realname": "Dombina Di", "favedate": "1481229540", "iconserver": "1690", "iconfarm": 2, "contact": 0, "friend": 0, "family": 0 },
				    ], 
				    "id": "30692337833", "secret": "f18dfcf155", "server": "185", "farm": 1, "page": 1, "pages": 2, "perpage": 10, 
				    "total": 17 }, "stat": "ok" }
	        	*/
	        	self.userPhotosCounter++;
                self.userPhotosTotalFavs += Number(res.data.photo.total);
	        	console.log('getFavorites: id:'+res.data.photo.id+' favs:'+res.data.photo.total);
	        	photo.setTotalFavs(res.data.photo.total);
	        });
	        promises.push(promise);
	    });
	    return $q.all(promises).then(function(){
	    	return photosArr;
	    })
    }

    }]); /* end of constructor function */
