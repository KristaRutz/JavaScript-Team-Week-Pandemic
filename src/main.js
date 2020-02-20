import $ from 'jquery';
import 'bootstrap' ; 
import 'bootstrap/dist/css/bootstrap.min.css' ; 
import './styles.css' ;
import { Game, Player } from './game';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = 'pk.eyJ1Ijoia3Jpc3RhcnV0eiIsImEiOiJjazZqdWtlbjMwMDFtM2xxcG5zMjlscDJlIn0.XETFmQnM9jiwbDtcAEZfEQ';
var map = new mapboxgl.Map({
  container: 'mapDiv',
  style: 'mapbox://styles/kristarutz/ck6r0bnj10oui1irvwnqjyp9u',
  zoom: 0.5,
  minZoom: 0.5,
  maxZoom: 5,
  center: [-100,35]
});

var size = 200;
 
// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),
 
  // get rendering context for the map canvas when layer is added to the map
  onAdd: function() {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext('2d');
    },
 
  // called once before every frame where the icon will be used
  render: function() {
    var duration = 1000;
    var t = (performance.now() % duration) / duration;
    
    var radius = (size / 2) * 0.3;
    var outerRadius = (size / 2) * 0.7 * t + radius;
    var context = this.context;
    
    // draw outer circle
    context.clearRect(0, 0, this.width, this.height);
    context.beginPath();
    context.arc(
      this.width / 2,
      this.height / 2,
      outerRadius,
      0,
      Math.PI * 2
    );
    context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
    context.fill();
  
    // draw inner circle
    context.beginPath();
    context.arc(
    this.width / 2,
    this.height / 2,
    radius,
    0,
    Math.PI * 2
    );
    context.fillStyle = 'rgba(255, 100, 100, 1)';
    context.strokeStyle = 'white';
    context.lineWidth = 2 + 4 * (1 - t);
    context.fill();
    context.stroke();
 
    // update this image's data with data from the canvas
    this.data = context.getImageData(
    0,
    0,
    this.width,
    this.height
    ).data;
    
    // continuously repaint the map, resulting in the smooth animation of the dot
    map.triggerRepaint();
    
    // return `true` to let the map know that the image was updated
    return true;
  }
};
 
map.on('load', function() {
  map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

    map.addSource('points', {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
          'features': [
            {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [-122, 47]
            }
          }
        ]
      }
    });
    map.addLayer({
      'id': 'points',
      'type': 'symbol',
      'source': 'points',
      'layout': {
        'icon-image': 'pulsing-dot'
      }
   });
});

let game;

function updateGameVars(){
  $("#actionCount").text(game.player.actionPoints);
  $("#currentLocation").text(game.cities[game.player.currentLocation].name);
  $("#researchPoints").text(game.player.researchPoints*5 + "%");
  $("#currentMonth").text("March"); // use the turn count to generate
  $("#currentYear").text("2021");
  $("#total-disease").text(game.getTotalDiseaseCount());

  for (let i = 0; i < game.cities.length; i++){
    $(`#city-${i}-disease`).text(game.cities[i].diseaseCount);
  }
}

function updateControlPanel(){
  setTravelButtons();
  if (game.player.actionPoints > 0){
    $("#treatBtn").show();
    $("#travelBtn").show();
    $("#researchBtn").show();
  } else {
    $("#treatBtn").hide();
    $("#travelBtn").hide();
    $("#researchBtn").hide();
  }
}

function checkWin(){
  game.checkWin();
  game.checkLoss();
  if (game.isGameWon === true){
    $("#gameOverDiv").show();
    $("#winScreen").show();
    $("#loseScreen").hide();
    $("#gameBoardDiv").hide();
    $("#controlPanel").hide();
  } else if (game.isGameLost === true){
    $("#gameOverDiv").show();
    $("#winScreen").hide();
    $("#loseScreen").show();
    $("#gameBoardDiv").hide();
    $("#controlPanel").hide();
  }
}

function checkSameCity(city) {
  return city === this;
}

function setTravelButtons(){
  for (let i = 0; i < game.cities.length; i++){
    $(`#city-${i}-btn`).hide();
  }

  let currentCity = game.cities[game.player.currentLocation];

  for (let i = 0; i < currentCity.connections.length; i++){
    let currentConnection = currentCity.connections[i];
    let currentConnectionIndex = game.cities.findIndex(checkSameCity, currentConnection);
    $(`#city-${currentConnectionIndex}-btn`).show();
  }
}

$(document).ready(function() {
  let gamesCount = 0;
  const INITIAL_DISEASE = 8;
  const INFECTION_RATE = 2;

  $("#tutorialButton").click(function(){
    $("#tutorialIsland").show();
    $("#gameBoardDiv").hide();
    $("#controlPanel").hide();
  });

  $("#newGameButton").click(function(){
    gamesCount++;
    $("#tutorialIsland").hide();
    $("#gameBoardDiv").show();
    $("#gameOverDiv").hide();
    $("#controlPanel").show();
    

    let player1 = new Player(gamesCount);
    game = new Game(player1);
    game.player.currentLocation = Math.floor(Math.random() * 10);
    game.infectRandom(INITIAL_DISEASE);

    updateControlPanel();
    updateGameVars();
  });

  $("#treatBtn").click(function(){  
    game.player.treat(game.cities[game.player.currentLocation]);
    updateGameVars();
    updateControlPanel();
    checkWin();
  });

  $("#researchBtn").click(function(){ 
    game.player.research();
    updateControlPanel();
    checkWin();
    updateGameVars();        
  });

  $("#endTurnBtn").click(function(){ 
    game.endTurn();
    game.infectRandom(INFECTION_RATE);
    updateGameVars();
    updateControlPanel();
    checkWin();
  });

  $("#city-0-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.tokyo));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-1-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.paris));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-2-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.seattle));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-3-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.toronto));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-4-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.baghdad));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-5-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.bangkok));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-6-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.nairobi));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-7-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.rio));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-8-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.la));
    updateGameVars();
    updateControlPanel();
  });
  $("#city-9-btn").click(function(){
    game.setPlayerLocation(game.cities.findIndex(checkSameCity, game.moscow));
    updateGameVars();
    updateControlPanel();
  });
});

