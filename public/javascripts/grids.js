/**
 * grids.js handle the calculation between (longitude, latitude) and grids
 * 
 * 主要包含grid配置信息的获取，保存和地图引擎上grid相关的交互。
 * 
 * 
 */

/**
 * size is the number of grids on each side of the network
 */

function Grid(size, confService) {

  this.size = size;
  this.lat_per_grid = 180 / size;
  this.lng_per_grid = 360 / size;

  if (typeof(window) == "undefined") {
    this.server = true;
  } else {
    this.server = false;
    if(typeof(confService) == "undefined"){
      throw "confSerivce is null";
    }
    this.confService = confService;
  }

  //configuration cache
  this.conf = {};

  //grid lines
  this.grid_lines = [];
  //grid avatars
  this.grid_avatars = {};
  this.grid_buildings = {};
}



Grid.prototype.degreeToRadians = function(degree) {
  return degree * (Math.PI / 180);
}

Grid.prototype.radiansToDegree = function(rad) {
  return rad / (Math.PI / 180);
}

/**
 * lat range from -89.5 to 89.5
 * lng range from -180 to 180
 * @param {*} lat 
 * @param {*} lng 
 */
Grid.prototype.fromLatLngToGrid = function(lat, lng) {
  x = parseInt((parseFloat(lng) + 180) / this.lng_per_grid);
  y = parseInt((parseFloat(lat) + 90) / this.lat_per_grid);
  return y * this.size + x;
}

Grid.prototype.showGrids = function(show) {
  var self = this;
  self.grid_lines.forEach(function(line) {
    line.show = show;
  });


  Object.keys(self.grid_avatars).forEach(function(grid){
    self.grid_avatars[grid].polygon.show = show;
  })

}

Grid.prototype.drawGrids = function(viewer) {

  /*
   * first draw const longitude lines
   * lat range from (-90,90)
   */
  var i = 0;
  for (i = 0; i < this.size; i++) {
    var lng = this.lng_per_grid * i;
    var pos = [];
    for (var lat = -89.5; lat <= 89.5; lat++) {
      pos.push(Cesium.Cartesian3.fromDegrees(lng, lat));
    }
    var line = viewer.entities.add({
      polyline: {
        followSurface: true,
        width: 0.1,
        material: Cesium.Color.GRAY,
        positions: pos
      }
    })
    this.grid_lines.push(line);
  }

  /*
   * then latitude
   */
  for (i = 1; i < this.size; i++) {
    var lat = this.lat_per_grid * (i - this.size / 2);
    var pos = [];
    for (var lng = -179.5; lng < 179.5; lng++) {
      pos.push(Cesium.Cartesian3.fromDegrees(lng, lat));
    }

    var line = viewer.entities.add({
      polyline: {
        followSurface: true,
        width: 0.1,
        material: Cesium.Color.GRAY,
        positions: pos
      }
    });
    this.grid_lines.push(line);
  }
}

Grid.prototype.drawGridAvatars = function(viewer, callback){
  var self = this;
  self.confService.loadAllConf(self.confService.CATEGORY["GRID_CONF_CATEGORY"], (err, conf) => {
    if(err){
      return callback && callback(err);
    } else {
      Object.keys(conf).forEach(function(grid){
        var grid_conf = conf[grid];

        self.gridAvatar(grid, (err, url) => {
          if(err){

          } else {
            if(url){
              self.drawGridAvatar(grid, url, viewer, (err) => {

              })
            }            
          }
        });
      });
    }
  });
}
/**
 * get the edge points of a specified grid 
 * @param {*} index 
 */
Grid.prototype.fromGridIndexToDegrees = function(index) {
  var y = Math.floor(index / this.size);
  var x = index - y * this.size;
  //(x, y + 1) (x + 1, y + 1)
  //(x, y) (x + 1, y)
  var points = [];

  var p1 = this.fromOffsetToDegrees(x, y);
  points.push(p1.lng, p1.lat);
  var p2 = this.fromOffsetToDegrees(x + 1, y);

  for (var delta = 1; p1.lng + delta < p2.lng; delta += 1) {
    points.push(p1.lng + delta, p1.lat);
  }

  points.push(p2.lng, p2.lat);

  var p3 = this.fromOffsetToDegrees(x + 1, y + 1);

  for (var delta = 1; p2.lat + delta < p3.lat; delta += 1) {
    points.push(p2.lng, p2.lat + delta);
  }

  points.push(p3.lng, p3.lat);
  var p4 = this.fromOffsetToDegrees(x, y + 1);

  for (var delta = 1; p3.lng - delta > p4.lng; delta += 1) {
    points.push(p3.lng - delta, p3.lat);
  }

  points.push(p4.lng, p4.lat);

  for (var delta = 1; p4.lat - delta > p1.lat; delta += 1) {
    points.push(p4.lng, p4.lat - delta);
  }
  return points;
}

Grid.prototype.fromOffsetToDegrees = function(x, y) {
  //TODO: validation
  var lng = x * this.lng_per_grid - 180;
  var lat = y * this.lat_per_grid - 90;
  return {
    lng: lng,
    lat: lat
  };
}

Grid.prototype.fromGridIndexToXY = function(grid) {
  if (grid < 0 || grid >= (this.size * this.size)) {
    throw "invalid grid " + grid;
  }

  grid = Math.floor(grid);

  var y = Math.floor(grid / this.size);
  var x = grid - y * this.size;
  return {
    x: x,
    y: y
  };
}

Grid.prototype.gridCenterInDegree = function(grid_idx) {
  //point2 point3
  //point0 point1
  var point0XY = this.fromGridIndexToXY(grid_idx);
  var point0 = this.fromOffsetToDegrees(point0XY.x, point0XY.y);
  var point1 = this.fromOffsetToDegrees(point0XY.x + 1, point0XY.y);
  var point2 = this.fromOffsetToDegrees(point0XY.x, point0XY.y + 1);
  var center_lng = (point0.lng + point1.lng) / 2;
  var center_lat = (point0.lat + point2.lat) / 2;

  return {
    lng: center_lng,
    lat: center_lat
  };
}

Grid.prototype.destory = function() {

}

//Grid.prototype.
/*
Grid.prototype.setGridImageTmp = function(grid, image_url, viewer) {
  if (this.grid_avatars.hasOwnProperty(grid)) {
    //change the material
    this.grid_avatars[grid].polygon.material = image_url;
  } else {
    var self = this;
    var points = self.fromGridIndexToDegrees(grid);
    var gridPic = viewer.entities.add({
      name: "grid_picture",
      polygon: {
        height: 10000,
        material: image_url,
        outline: true,
        hierarchy: Cesium.Cartesian3.fromDegreesArray(points)
      }
    });
    this.grid_avatars[grid] = gridPic;
  }
};*/

/**
 * Grid Service will both work in server side and client side
 * 
 * in client side:
 * * load configuration from server
 * * user can temporarily modidify the conf
 * * user can save conf to server.
 * 
 * in server side:
 * * load configuration from database
 * * return configuration to client side
 * * save configuration to database
 * @param {*} callback 
 */
/*
Grid.prototype.loadGridAvatar = function(callback) {

};*/

/*
Grid.prototype.SaveConf = function(category, conf, callback){
  if(this.server){
    if(typeof(path) == "undefined"){
      var path = require("path");
    }
    var filePath = path.join(__dirname, "..", "..", "pub_conf", category + ".json");
    if(typeof(jsonfile) == "undefined") {
      var jsonfile = require("jsonfile");
    }
    return jsonfile.writeFile(filePath, conf, callback);
  } else {
    return callback("client side not suppored yet");
  }
};*/

/**
 * if in the server side, load conf from file
 * if in the client side, load conf from server
 * @param {*} category 
 * @param {*} callback 
 */
/*
Grid.prototype.LoadConf = function(category, callback){
  if(this.server){
    if(typeof(path) == "undefined"){
      path = require("path");
    }
    var filePath = path.join(__dirname, "..", "..", "pub_conf", category + ".json");
    //read the specified json file

    var jsonfile = require("jsonfile");

    jsonfile.readFile(filePath, function(err, obj){
      if(err){
        //TODO: error handling
      } else {
        return callback(null, obj);
      }
    });
  } else {
    var n = (new Date()).getTime();
    $.get("/conf/" + category + "?t=" + n, function(ret){
      return callback(null, ret);
    }).fail(function(){
      console.log("what");
    });
  }
}*/

/*
Grid.prototype.GetConf = function(category, callback){
  var self = this;
  if(self.conf.hasOwnProperty(category)){
    return callback(null, this.conf[category]);
  } else {
    self.LoadConf(category, function(err, ret){
      if(err){
        return callback(err);
      } else {
        self.conf[category] = ret;
        return callback(null, ret);
      }
    });
  }
}*/

Grid.prototype.gridAvatar = function(grid_idx, callback){
  var self = this;
  self.confService.getConf(
    self.confService.CATEGORY["GRID_CONF_CATEGORY"], 
    grid_idx,
    (err, conf) => {
      if(err){
        return callback(err);
      } else if(conf && conf.avatar){
        return callback(null, self.confService.Params["GRID_PIC_URL_BASE"] + conf.avatar);
      } else {
        return callback();
      }
  })
}

//Draw grid avatar on earth
Grid.prototype.drawGridAvatar = function(grid_idx, url, viewer){
  var self = this;
  if(self.grid_avatars.hasOwnProperty(grid_idx)){
    self.grid_avatars[grid_idx].polygon.material = url;
  } else {
    var points = self.fromGridIndexToDegrees(grid_idx);
    var gridPic = viewer.entities.add({
      name: "grid_picture",
      polygon: {
        height: 10000,
        material: url, 
        outline: false,
        hierarchy: Cesium.Cartesian3.fromDegreesArray(points)
      }
    });
  
    self.grid_avatars[grid_idx] = gridPic;
  }
}

Grid.prototype.updateGridAvatar = function(grid_idx, viewer){
  var self = this;
  self.gridAvatar(grid_idx, (err, url) => {
    if(err){
      //TODO:
    } else {
      if(!url){
        self.removeGridAvatar(grid_idx, viewer);
      } else {
        self.drawGridAvatar(grid_idx, url, viewer)
      }
    }
  })
}

Grid.prototype.removeGridAvatar = function(grid_idx, viewer){
  var self = this;
  if(self.grid_avatars.hasOwnProperty(grid_idx)){
    viewer.entities.remove(self.grid_avatars[grid_idx]);
    delete self.grid_avatars[grid_idx];
  }
}

Grid.prototype.gridBuilding = function(grid_idx, model_url, scale, height, viewer){
  var self = this;
  if(self.grid_buildings.hasOwnProperty(grid_idx)){
    viewer.scene.primitives.remove(self.grid_buildings[grid_idx]);
    delete self.grid_buildings[grid_idx];
  }

  var postion = self.gridCenterInDegree(grid_idx);
  position = Cesium.Cartesian3.fromDegrees(postion.lng, postion.lat, height);
  var hpRoll = new Cesium.HeadingPitchRoll();  //heading, pitch, roll
  var fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');
  
  var building = viewer.scene.primitives.add(Cesium.Model.fromGltf({
    url: model_url,
    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
    minimumPixelPriceSize: 128,
    shadows: Cesium.ShadowMode.DISABLED,
    scale: scale
  }));

  self.grid_buildings[grid_idx] = building;
}

if (typeof(module) != "undefined") {
  module.exports = Grid;
}

