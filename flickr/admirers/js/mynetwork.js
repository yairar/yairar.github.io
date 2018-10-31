var nodes = [];
var edges = [];
var network = null;

// Called when the Visualization API is loaded.
function draw() {
  // create people.
  // value corresponds with the age of the person

/*
  nodes = [
    {id: 1,  shape: 'circularImage', image: 'http://c4.staticflickr.com/8/7372/buddyicons/93288407@N02.jpg', label:"Yair Aronshtam", title:"https://www.flickr.com/photos/yairar/"},
    {id: 2,  shape: 'circularImage', image: 'http://c2.staticflickr.com/2/1714/buddyicons/135336432@N08_r.jpg', label:"Aleksander Kovach", title:"https://www.flickr.com/photos/135336432@N08"},
    {id: 3,  shape: 'circularImage', image: 'http://c4.staticflickr.com/8/7436/buddyicons/100087202@N06_r.jpg', label:"Ori Lubin", title:"https://www.flickr.com/photos/100087202@N06"},
  ];
*/

  // create connections between people
  // value corresponds with the amount of contact between two people
/*
  edges = [
    {from: 1, to: 2},
    {from: 1, to: 3},
  ];
*/
  // create a network
  var container = document.getElementById('mynetwork');
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {
    width:'100%',
    height:'500px',
    nodes: {
      borderWidth:4,
      size:30,
      color: {
       border: 'black',
       background: 'white'
      },
      font:{color:'black'}
    },
    edges: {
      color: 'lightgray'
    }
  };
  network = new vis.Network(container, data, options);

  network.on('click', function(properties) {
    window.open(network.body.nodes[properties.nodes].options.title);
  });
}