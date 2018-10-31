/**
 * controller to display hello world
 */

angular.module('MainModule')
    .controller('MainModuleCtrl', ['userService', function(userService) {

        var self = this;

        self.username = 'Yair Aronshtam';
        self.nsid = '';
		self.userphotosurl = '';
		self.usericonurl = '';
		self.userrealname = '';
		self.usertotalphotos = 0;
		self.userPhotos = [];

        self.photosLimit = 500;

        self.allUserFans = [];	/* array of all user fans []<{nsid, total_likes}> */
        self.bestUserFans = []; /* array of best user fans []<User> */

		self.userService = userService;	/* add Service to the scope, in order to access variables of service */

        self.resetData = function resetData() {
        	self.userrealname = '';
        	self.usericonurl = '';
        	self.nsid = '';
        	self.usertotalphotos = 0;
        	self.allUserFans = [];
        	self.bestUserFans = [];
            userService.allUserFansCounter = 0;
            RemoveTableOfPhotos();
        }

		self.getAllUserFansCounter = function getAllUserFansCounter(){
			return self.allUserFansCounter;
		}

        self.searchByUsername = function searchByUsername() {
        	self.resetData();
        	userService.findByUsername(self.username)
	       		.then(function(user){
	       			/* after getting user by username */
	       			self.nsid = user.getNsid();
                    if (self.nsid != -1) {
    	       			var promiseB = userService.getInfo(self.nsid)
    	       				.then(function(user){
    	       					/* after getting user info */
    	       					self.userphotosurl = user.getPhotosUrl();
    	       					self.usericonurl = user.getIconUrl();
    	       					self.userrealname = user.getRealname();
    	       					self.usertotalphotos = user.getTotalPhotos();
    	       				})
                            .then(function(){
                                self.getUserPhotos();
                            });
                    }
                    else {
                        self.userrealname = "User no found";
                        self.usericonurl = '';
                        self.nsid = '';
                        self.userphotosurl = '';
                    }
	       		});
        }

        self.getUserPhotos = function getUserPhotos() {
            /* 2016 unixtime: from 1451606400 till 1483228800000 */
        	userService.searchPhotosByDate(self.nsid, self.photosLimit, 1451606400, 1483228800000)
        		.then(function(photos){
        			/* after getting user photos []<Photo> */
        			self.userPhotos = photos;
        		}).then(function(){
        			self.getPhotosPopulatiry();
        		})
        }

        self.getPhotosPopulatiry = function getPhotosPopulatiry() {
        	self.bestUserFans = [];
        	userService.getPhotosPopulatiry(self.userPhotos)
        	    .then(function(photos){
        			self.userPhotos = photos;
                    /* Continue */
                    // sort by total favs
                    self.userPhotos.sort(function(a, b){
                        return b.getTotalFavs()-a.getTotalFavs()
                    })
        			console.log('Total favs: '+userService.userPhotosTotalFavs);

                    AddTableOfPhotos(self.userPhotos);
        		});

        }
}]);
