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

        self.photosLimit = 10;

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
                                /* Reset network */
                                if (network){
                                    network.setData({nodes: [], edges: []});
                                }
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
        	userService.getPhotos(self.nsid, self.photosLimit)
        		.then(function(photos){
        			/* after getting user photos []<Photo> */
        			self.userPhotos = photos;
        		}).then(function(){
        			self.getPhotosFans();
        		})
        }

        self.getPhotosFans = function getPhotosFans() {
        	self.bestUserFans = [];
        	userService.getPhotosFans(self.userPhotos)
        	    .then(function(result){
        			self.allUserFans = result;
                    /* Continue to search best Fans */
        			var promise = self.getBestFans();
        		});

        }

        self.getBestFans = function getBestFans() {
        	userService.getBestFans(self.allUserFans)
        	    .then(function(result){
        			self.bestUserFans = result;

                    /* create nodes for Vis */
                    nodes = [];
                    /* first node is user itself */
                    var nodeofuser = {
                        id: 1,
                        shape: 'circularImage',
                        image: self.usericonurl,
                        label: self.userrealname,
                        title: self.userphotosurl
                    }
                    nodes.push(nodeofuser);
                    /* other nodes are fans */
                    self.bestUserFans.forEach(function(user, index) {
                        var node = {
                            id: (index+2),
                            shape: 'circularImage',
                            image: user.getIconUrl(),
                            label: (user.getRealname()+' ('+user.getTotalLikes()+')'),
                            title: user.getPhotosUrl()
                        };
                        nodes.push(node);
                    });
                    /* create edges */
                    edges = [];
                    for (var i = 2; i <= (self.userService.numberOfBestFans+1); i++) {
                        var edge = {
                            from: 1,
                            to: i
                        };
                        edges.push(edge);
                    };
                    if (network) {
                        /* Set new data */
                        network.setData({nodes: nodes, edges: edges});
                    } else {
                        /* Draw first time */
                        draw();
                    }
        		});
        }

        var promiseFirstTime = self.searchByUsername();

    }]);

