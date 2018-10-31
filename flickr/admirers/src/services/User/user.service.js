/**
 * singleton for interacting with the task api
 */

angular.module('MainModule')
 .service('userService', ['User', 'Photo', '$http', '$q', 'FLICKR_API_URL', 'API_KEY', 
    function(User, Photo, $http, $q, FLICKR_API_URL, API_KEY){

    var self = this;
    
    /* Service variables */
    self.allUserFansCounter = 0;
    self.numberOfBestFans = 10;

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
     * using getFavorites
     * @returns []{nsid, total_likes}
     */
    self.getPhotosFans = function getPhotosFans(photosArr){
    	var all_fans = {};
    	var promises = [];
    	self.allUserFansCounter = 0;
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
	        	console.log('getFavorites: id:'+res.data.photo.id+' favs:'+res.data.photo.total)
				angular.forEach(res.data.photo.person, function(value, key){
					// add to all_fans
					if (all_fans[value.nsid])
					{
						all_fans[value.nsid]++;
					}
					else
					{
						all_fans[value.nsid] = 1;
					}
					self.allUserFansCounter = Object.keys(all_fans).length;
					//debugger;
				});				
	        	if (res.data.photo.total > 50)
	        	{
					// get Favorites - page 2
					console.log(res.data.photo.id + ' - adding page 2');
					return self.getFavorites(photo, 2).then(function(res){
						console.log('getFavorites(page 2): id:'+res.data.photo.id+' favs:'+res.data.photo.total)
						//debugger;
						angular.forEach(res.data.photo.person, function(value, key){
							// add to all_fans
							if (all_fans[value.nsid])
							{
								all_fans[value.nsid]++;
							}
							else
							{
								all_fans[value.nsid] = 1;
							}
							self.allUserFansCounter = Object.keys(all_fans).length;
						});
						return res;        		
	        		}).then(function(res){
	        			if (res.data.photo.total > 100)
			        	{
							// get Favorites - page 3
							console.log(res.data.photo.id + ' - adding page 3');
							return self.getFavorites(photo, 3).then(function(res){
								console.log('getFavorites(page 3): id:'+res.data.photo.id+' favs:'+res.data.photo.total)
								//debugger;
								angular.forEach(res.data.photo.person, function(value, key){
									// add to all_fans
									if (all_fans[value.nsid])
									{
										all_fans[value.nsid]++;
									}
									else
									{
										all_fans[value.nsid] = 1;
									}
									self.allUserFansCounter = Object.keys(all_fans).length;
								});		        		
			        		});
			        	}
	        		});
	        	}
       		});
			promises.push(promise);
    	});
    	return $q.all(promises).then(function(){
    		var all_fans_array = [];
    		console.log('all promises finished.');
    		// create new array
    		angular.forEach(all_fans, function(value, key) {
    			all_fans_array.push({'nsid':key, 'total_likes':value});
    		})
    		// sort by total_likes
    		all_fans_array.sort(function(a, b){ // sort objects by total_likes field
				return b.total_likes-a.total_likes
			})
    		console.log('all_fans_array: '+JSON.stringify(all_fans_array));
    		return all_fans_array;
    	});
    }

    /**
     * users - []<{nsid, total_likes}>
     * @returns []<User>
     */
    self.getBestFans = function getBestFans(users){
	    var promises = [];
	    var bestFans = [];
    	for (var i = 0; i<self.numberOfBestFans; i++) {
    		var promise = self.getInfo(users[i].nsid).then(function(user_obj){
    			bestFans.push(user_obj);
    		});
    		promises.push(promise);
    	}

    	return $q.all(promises).then(function(){
    		for (var i = 0; i<self.numberOfBestFans; i++) {
    			for (var j= 0; j<self.numberOfBestFans; j++) {
    				if (bestFans[i].getNsid() == users[j].nsid) {
    					bestFans[i].setTotalLikes(users[j].total_likes);
    					break;
    				}
    			}
    		}
    		return bestFans;
		});
    }
    		

    }]); /* end of constructor function */