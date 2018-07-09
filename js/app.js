// Global Variables
let map;
let currentLocation;

// This is the function that creates the application viewmodel - Javascript that defines the data and
// behavior of the UI.
function initMap() {
  ko.applyBindings(new ViewModel());
}

const Location = function(location) {
  // Set a variable for closures.
  const self = this;
  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon("FF0000");

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon("FFFF24");

  // Create an InfoWindow object for displaying information about a marker.
  this.largeInfoWindow = new google.maps.InfoWindow();

  // Set properties of our new object.
  this.title = location.title;
  this.lat = location.location.lat;
  this.lng = location.location.lng;
  this.apiID = location.apiID;
  this.street = "";
  this.city = "";
  this.pictureURL = "";
  // If the infowindow is open (true) or closed (false)
  this.isOpen = false;
  // If the listing is showing (true) or hidden (false)
  this.isShowingListing = false;
  // If the marker is visible (true) or hidden (false)
  this.isMarkerVisible = ko.observable(true);

  // Foursquare API clientID and clientSecret.
  let clientID = "PJF0Y2XC0M0DQ1VEO4ZU2OL0YOFGMVATB1XT5P3DKL5BYBIL";
  let clientSecret = "E4MHZL455TIK30B2B1CZRLFCISIFNNDBZWR0W44XJOGHQLAW";

  var requestURL =
    "https://api.foursquare.com/v2/venues/search?ll=" +
    this.lat +
    "," +
    this.lng +
    "&client_id=" +
    clientID +
    "&client_secret=" +
    clientSecret +
    "&v=20180708" +
    "&query=" +
    this.title;
  var requestPhotos =
    "https://api.foursquare.com/v2/venues/" +
    this.apiID +
    "/photos?" +
    "&client_id=" +
    clientID +
    "&client_secret=" +
    clientSecret +
    "&v=20180708";
  $.getJSON(requestURL)
    .done(function(data) {
      var JSONResponse = data.response.venues[0];
      self.street = JSONResponse.location.formattedAddress[0]
        ? JSONResponse.location.formattedAddress[0]
        : "N/A";
      self.city = JSONResponse.location.formattedAddress[1]
        ? JSONResponse.location.formattedAddress[1]
        : "N/A";
    })
    .fail(function() {
      alert("Something went wrong with the Foursquare API");
    });

  $.getJSON(requestPhotos).done(function(data) {
    var JSONResponse = data.response.photos.items[0];
    self.pictureURL = JSONResponse.prefix + "100x100" + JSONResponse.suffix;
  });

  this.marker = new google.maps.Marker({
    map: map,
    icon: defaultIcon,
    position: { lat: self.lat, lng: self.lng },
    title: self.title,
    animation: google.maps.Animation.DROP
  });
  // Event listeners
  // Toggles if the marker is showing
  this.toggleMarker = ko.computed(function() {
    self.isMarkerVisible() ? self.marker.setMap(map) : self.marker.setMap(null);
    return true;
  }, this);
  // Create an onclick event to open an infowindow at each marker.
  this.marker.addListener("click", function() {
    if (currentLocation === undefined) {
      currentLocation = self;
      currentLocation.largeInfoWindow.open(map, this);
      currentLocation.largeInfoWindow.setContent(
        "<div>" +
          currentLocation.marker.title +
          "<h4>" +
          "Street Name: " +
          currentLocation.street +
          "</h4>" +
          "<h4>" +
          "City: " +
          currentLocation.city +
          "</h4>" +
          "<img src=' " +
          currentLocation.pictureURL +
          "'" +
          "</div>"
      );
      currentLocation.marker.setAnimation(google.maps.Animation.BOUNCE);
    } else if (currentLocation === self) {
      currentLocation.largeInfoWindow.close();
      currentLocation.marker.setAnimation(null);
      currentLocation = undefined;
    } else {
      currentLocation.largeInfoWindow.close();
      currentLocation.marker.setAnimation(null);
      currentLocation = self;
      currentLocation.largeInfoWindow.open(map, this);
      currentLocation.largeInfoWindow.setContent(
        "<div>" +
          currentLocation.marker.title +
          "<h4>" +
          "Street Name: " +
          currentLocation.street +
          "</h4>" +
          "<h4>" +
          "City: " +
          currentLocation.city +
          "</h4>" +
          "<img src=' " +
          currentLocation.pictureURL +
          "'" +
          "</div>"
      );
      currentLocation.marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  });
  // Make sure the marker property is cleared if the infowindow is closed.
  this.largeInfoWindow.addListener("closeclick", function() {
    currentLocation.marker.setAnimation(null);
    currentLocation = undefined;
  });
  // Two event listeners - one for mouseover, one for mouseout,
  // to change the colors back and forth.
  this.marker.addListener("mouseover", function() {
    this.setIcon(highlightedIcon);
  });
  this.marker.addListener("mouseout", function() {
    this.setIcon(defaultIcon);
  });
  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      "http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|" +
        markerColor +
        "|40|_|%E2%80%A2",
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34)
    );
    return markerImage;
  }
};
const ViewModel = function() {
  const self = this;
  // ViewModel properties
  this.isOpen = ko.observable(true);
  // Styles for our map
  var styles = [
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [
        {
          saturation: 36
        },
        {
          color: "#000000"
        },
        {
          lightness: 40
        }
      ]
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [
        {
          visibility: "on"
        },
        {
          color: "#000000"
        },
        {
          lightness: 16
        }
      ]
    },
    {
      featureType: "all",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 20
        }
      ]
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 17
        },
        {
          weight: 1.2
        }
      ]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 20
        }
      ]
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 21
        }
      ]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 17
        }
      ]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 29
        },
        {
          weight: 0.2
        }
      ]
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 18
        }
      ]
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 16
        }
      ]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 19
        }
      ]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000"
        },
        {
          lightness: 17
        }
      ]
    }
  ];
  // Create a LatLngBounds object so we can view all of our markers at once.
  var bounds = new google.maps.LatLngBounds();
  // Store the coordinates of Shibuya, Tokyo
  const coordinates = { lat: 35.661777, lng: 139.704051 };
  // Create a new blank array for all locations that we want to visit
  let markers = new Array();
  // Create a map variable to store the map we request from Google.
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: coordinates.lat, lng: coordinates.lng },
    styles: styles,
    mapTypeControl: false,
    zoom: 13
  });

  var locations = [
    {
      title: "Akihabara Station",
      location: { lat: 35.6984, lng: 139.7731 },
      apiID: "4b19f917f964a520abe623e3"
    },
    {
      title: "Aoyama-itchōme Station",
      location: { lat: 35.6729, lng: 139.7238 },
      apiID: "4b063a75f964a520e0e922e3"
    },
    {
      title: "Hachikō Memorial Statue",
      location: { lat: 35.65905, lng: 139.70056 },
      apiID: "4b6c0f00f964a520c6212ce3"
    },
    {
      title: "Harajuku Station",
      location: { lat: 35.6702, lng: 139.7027 },
      apiID: "4b67a5c4f964a52069592be3"
    },
    {
      title: "Ichigaya Station",
      location: { lat: 35.6912, lng: 139.7356 },
      apiID: "4b493c33f964a520fc6a26e3"
    },
    {
      title: "Ikebukuro Station",
      location: { lat: 35.7295, lng: 139.7109 },
      apiID: "4b243a7df964a520356424e3"
    },
    {
      title: "Inokashira Park",
      location: { lat: 35.6997, lng: 139.5732 },
      apiID: "4b56bde5f964a520041a28e3"
    },
    {
      title: "Kanda Station",
      location: { lat: 35.6918, lng: 139.7709 },
      apiID: "4b19f962f964a520afe623e3"
    },
    {
      title: "Meiji Shrine",
      location: { lat: 35.6764, lng: 139.6993 },
      apiID: "4b5bd0a2f964a520c31729e3"
    },
    {
      title: "Ogikubo Station",
      location: { lat: 35.7046, lng: 139.6201 },
      apiID: "4b24aa1ff964a520506924e3"
    },
    {
      title: "Sangen-Jaya Station",
      location: { lat: 35.643515, lng: 139.671162 },
      apiID: "4b151fbff964a52083a823e3"
    },
    {
      title: "Shibuya 109",
      location: { lat: 35.6596, lng: 139.6988 },
      apiID: "4b0587baf964a5205aa122e3"
    },
    {
      title: "Shibuya Station",
      location: { lat: 35.658, lng: 139.7016 },
      apiID: "4b093eeff964a520e51423e3"
    },
    {
      title: "Shinjuku Station",
      location: { lat: 35.6896, lng: 139.7004 },
      apiID: "4b0587a6f964a5203d9e22e3"
    },
    {
      title: "Tokyo Dome City",
      location: { lat: 35.7047, lng: 139.7534 },
      apiID: "4b7b36aef964a52059582fe3"
    },
    {
      title: "Ueno Zoo",
      location: { lat: 35.7165, lng: 139.7713 },
      apiID: "4ba5b7e0f964a520181e39e3"
    },
    {
      title: "Yoyogi Park",
      location: { lat: 35.6717, lng: 139.6949 },
      apiID: "4b5a3a54f964a520cdb528e3"
    }
  ];
  /**
   * Initializes the markers array and adds click listeners to each marker.
   * @param {any} markers Before this function is called markers is an empty array. Once
   * the function completes will hold a location object for each location inside of the
   * locations array.
   */
  function initMarkers(locations, markers) {
    for (var i = 0; i < locations.length; i++) {
      var LatLngBounds = new google.maps.LatLng(
        locations[i].location.lat,
        locations[i].location.lng
      );
      bounds.extend(LatLngBounds);
      map.fitBounds(bounds);
    }

    locations.forEach(location => {
      markers.push(new Location(location));
    });
  }
  initMarkers(locations, markers);

  this.toggleMenu = function() {
    if (self.isOpen() === true) {
      self.isOpen(false);
    } else {
      self.isOpen(true);
    }
  };

  // this.toggleMenu = ko.pureComputed( function(){
  //   return isOpen ? "applicationOptions" : "applicationsOptions hideMenu";
  // })
  this.searchQuery = ko.observable("");
  // In this anyonmous function we create a result array that stores the results of our query and
  // return the array. We do this by looping through markers array and checking to see if the
  // title property matches the letters of the query. If it does we push that marker onto the
  // results array and set the marker's visible property to true. Else we set the marker's
  // visibility property to false.
  this.displayLocations = ko.computed(function() {
    var result = [];
    for (var i = 0; i < markers.length; i++) {
      var markerLocation = markers[i];
      if (
        markerLocation.title
          .toLowerCase()
          .includes(this.searchQuery().toLowerCase())
      ) {
        result.push(markerLocation);
        markers[i].isMarkerVisible(true);
      } else {
        markers[i].isMarkerVisible(false);
      }
    }
    return result;
  }, this);

  // This anonymous function is bound to our <li> elements in our HTML.
  this.clickLocation = function(location) {
    if (currentLocation === undefined) {
      currentLocation = location;
      currentLocation.marker.setAnimation(google.maps.Animation.BOUNCE);
      currentLocation.largeInfoWindow.open(map, currentLocation.marker);
      currentLocation.largeInfoWindow.setContent(
        "<div>" +
          currentLocation.marker.title +
          "<h4>" +
          "Street Name: " +
          currentLocation.street +
          "</h4>" +
          "<h4>" +
          "City: " +
          currentLocation.city +
          "</h4>" +
          "<img src=' " +
          currentLocation.pictureURL +
          "'" +
          "</div>"
      );
    } else if (currentLocation === location) {
      currentLocation.largeInfoWindow.close();
      currentLocation.marker.setAnimation(null);
      currentLocation = undefined;
    } else {
      currentLocation.marker.setAnimation(null);
      currentLocation.largeInfoWindow.close();
      currentLocation = location;
      currentLocation.marker.setAnimation(google.maps.Animation.BOUNCE);
      currentLocation.largeInfoWindow.open(map, currentLocation.marker);
      currentLocation.largeInfoWindow.setContent(
        "<div>" +
          currentLocation.marker.title +
          "<h4>" +
          "Street Name: " +
          currentLocation.street +
          "</h4>" +
          "<h4>" +
          "City: " +
          currentLocation.city +
          "</h4>" +
          "<img src=' " +
          currentLocation.pictureURL +
          "'" +
          "</div>"
      );
    }
  };
  googleError = function googleError() {
    alert(
      "Oops. Google Maps did not load. Check your internet connection and refresh the page."
    );
  };
};
