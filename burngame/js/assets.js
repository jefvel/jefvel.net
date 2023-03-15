 
var assetsToLoad = [
    "img/explo1.png",
    "img/tree.png",
    "img/tree_burn.png",
    "img/tree_small.png",
    "img/guy.png",
    "img/smoke.png",
    //UI Elements
    "img/activebtn.png",
    "img/guybtn.png",
    "img/explobtn.png",
    "img/pausebtn.png",
    "img/logo.png",
    "img/start.png"
];

var onLoaded = function(){
    BurnGame.init();
}

var loader = new PIXI.AssetLoader(assetsToLoad);
loader.onComplete = onLoaded;
loader.load();


//////////////
//Load sound

var soundsToLoad = [
    "sound/stroll",
    "sound/plonk",
    "sound/explo",
    "sound/place",
    "sound/swap",
    "sound/upgrade",
    "sound/upgrades",
    "sound/cool",
    "sound/defeated"
];

var soundFormats = ["mp3", "ogg"];

var Sounds = {};
soundsToLoad.forEach(function(e){
    var index = e.lastIndexOf("/") + 1;
    var soundname = e;
    if(index != 0){
        soundname = e.substr(index);
    }
    Sounds[soundname] = new buzz.sound(e, {formats: soundFormats});
});
