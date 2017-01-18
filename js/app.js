////////object model for autocomplete searchbar inputId: id of input element as string

var SearchBar = function(inputId){
  var self = this;
  self.input = document.getElementById(inputId);
  self.place = ko.observable();
  var options = {types : ['geocode']};

  self.autocomplete = new google.maps.places.Autocomplete(self.input,options);

  self.autocomplete.addListener("place_changed", function(){
    var place = self.autocomplete.getPlace();
    if(!place.formatted_address){return;};
    self.place(place);
  });
}

///////object model for map | mapId: id of map div as string

var Map = function(mapId){
  var self = this;
  self.div = document.getElementById(mapId);

  var mapOptions = {
    center:{
      lat: 0, lng:0
    },
     zoom:1,
     backgroundColor: "black"
  };

  self.map = new google.maps.Map(self.div, mapOptions);

  self.marker = new google.maps.Marker({Map:self.map});

  self.positionMapAndMarker = function(place){
    if(place.geometry.viewport){
      self.map.fitBounds(place.geometry.viewport);
    } else{
      self.map.setCenter(place.geometry.location);
      self.map.setZoom(10);
    }
    self.marker.setPosition(place.geometry.location);
  }
}

///////object model for wiki links loader

var Wiki = function(){
  var self = this;
  self.links = ko.observableArray();

  self.loadLinks = function(placeObj){
    var place = placeObj.name;
    $.ajax(
      {url: "https://en.wikipedia.org/w/api.php?action=opensearch&search="+place,
      dataType: "jsonp",
      success: function(linkArray){
        var formattedLinks = [];/////////////////format in the form of [{heading:, link:},{heading:, link:},{heading:, link:}]
        for(var i =0; i<linkArray[1].length; i++){
          formattedLinks.push({
            "heading": linkArray[1][i],
            "link":  linkArray[3][i]
          });
        }
        self.links(formattedLinks);
      }
    });

  };
}

/////object model for newyork times articles loader

var NYTimes = function(){
  var self = this;
  self.articles = ko.observableArray();

  self.loadArticles = function(placeObj){
    var place = placeObj.name;
    var  nytUrl = "https://api.nytimes.com/svc/search/v2/articlesearch.json?q="
    + place + "&api-key=54ad366bcd14459e85f1035824e962e6";

    $.getJSON(nytUrl,function(json){
      self.articles(json.response.docs);
    });
  }
}

////object model for image loader

var Images = function(){
  var self = this;
  self.imageUrls = ko.observableArray();

  this.loadImages = function(place){
    var photos = place.photos;
    var urls = [];
    var imageDimensions = {
      'maxWidth' : 450,
      'maxheight': 320
    };
    for(var i = 0; i<photos.length; i++)
    {
      urls.push(photos[i].getUrl(imageDimensions));
    };

    self.imageUrls(urls);
  }
}

////// main controller for app

var ViewModel = function(){
  var self = this;

  var search = new SearchBar("search-input");
  var map = new Map("map");
  var wiki = new Wiki();
  var nyt = new NYTimes();
  var images = new Images();

  this.wikiLinks = wiki.links;
  this.nytArticles = nyt.articles;
  this.imageUrls = images.imageUrls;
  var place = ko.computed(function(){
    return search.place();
  });

  place.subscribe(wiki.loadLinks);
  place.subscribe(map.positionMapAndMarker);
  place.subscribe(nyt.loadArticles);
  place.subscribe(images.loadImages);
}

//////method invoked by google map api after loading

function setupMap(){

  ko.applyBindings(new ViewModel());

}


////////news api https://newsapi.org/v1/articles?source=techcrunch&apiKey=c29e3a12aea5480b94987bf698c36328
