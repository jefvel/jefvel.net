var GAME_WIDTH = 960;
var GAME_HEIGHT= 540;

var FONT_NAME  = "Fredoka One";

var stage = new PIXI.Stage(0x5d7e3e);

//Create and add renderer.
var renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT);
renderer.view.id = "gamecanvas";
document.body.appendChild(renderer.view);

//Scale canvas properly.
var scaler = new window.AutoScaler(document.body, GAME_WIDTH, GAME_HEIGHT, false);

//Game constants.
var MIN_SCALE = 0.05;
var WORLD_WIDTH = GAME_WIDTH / MIN_SCALE;
var WORLD_HEIGHT= GAME_HEIGHT/ MIN_SCALE;
var TREE_AMOUNT  = 3000;
var WORLD_CENTER = new PIXI.Point(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5);
var TREE_BURN_TIME = 5;
var TREE_PADDING = 600;

var GUY_AMOUNT = 100;
var GUY_SPEED  = 8;

var CELLS_X = 40;
var CELLS_Y = parseInt(WORLD_HEIGHT / WORLD_WIDTH * CELLS_X);
var CELL_WIDTH = WORLD_WIDTH / CELLS_X;
var CELL_HEIGHT= WORLD_HEIGHT/ CELLS_Y;

var MAX_PARTICLES = 1000;

var EXPLOTOOL = 0;
var GUYTOOL   = 1;

var toolTopLeft = new PIXI.Point();

var burnedArea = new PIXI.Graphics();

//Parameters
var START_EXPLOSIONS = 5;
var START_GUYS = 1;

//Score for burning one guy
var GUY_SCORE = 100;
//Multiplier for burning multiple guys.
var GUY_MULTIPLIER = 1.1;
//Score for clearing cell
var CELL_SCORE = 800;
//Score for burning tree.
var TREE_SCORE = 20;

var MONEY_PER_SCORE = 0.1;

var EXPLOSION_LEVEL = 0;
var EXPLOSION_COSTS =       [200, 500, 600,  1000, 1400, 2000, 5000, 7000, 10000, "Done!"];
var EXPLOSION_AMOUNTS=      [5  , 7  , 10 ,  15  , 18  , 21  , 26  , 30,   40   , 99];
var EXPLOSION_LEVELS = EXPLOSION_AMOUNTS.length;

var EXPLOSION_RAD_LEVEL = 0;
var EXPLOSION_RAD_COSTS =   [132, 250, 345, 900, 1000, 5559, 12000, "100%!"];
var EXPLOSION_RADS =        [100, 120, 150, 200, 300,  400,  400,   650];
var EXPLOSION_RAD_LEVELS = EXPLOSION_RADS.length;

var GUY_LEVEL = 0;
var GUY_COSTS =             [190, 250, 999,  1337, 3000, 6666, 9000, 10000, "all bought up!"];
var GUY_AMOUNTS=            [1  , 2  , 3  ,  6   , 8   , 12  , 14,   16   ,  25]
var GUY_LEVELS = GUY_AMOUNTS.length;

var GUY_RAD_LEVEL = 0;
var GUY_RAD_COSTS =         [400, 700, 900, 1200, 2000, 4500, 6000, 7000, 12000, "finished!"];
var GUY_RADS =              [300, 330, 360, 400,  460 , 500,  550 , 600,  700,   750];
var GUY_RAD_LEVELS = GUY_RADS.length;

var GUY_LIFE_LEVEL = 0;
var GUY_LIFE_COSTS=         [500, 600, 1500, 3000, 5000, 8000, 18069, 21000, 30000,  40000, "All maxed out!"];
var GUY_LIVES=              [100, 120, 150,  250 , 400 , 500 , 550 ,  630,   700,    800,   900]; 
var GUY_LIFE_LEVELS= GUY_LIVES.length;

var BurnCell = function(x, y){
    this.objects = [];
    this.x = x;
    this.y = y;
    this.worldX = CELL_WIDTH * x + CELL_WIDTH * 0.5;
    this.worldY = CELL_HEIGHT* y + CELL_HEIGHT* 0.5;
    this.burned = false;
    this.totalTrees = 0;

    this.isEmpty = function(){
        return this.objects.length == 0;
    }

    this.removeObject = function(o){
        var v = this.objects.indexOf(o);
        if(v >= 0){
            this.objects.splice(v, 1);
        }else{
            return;
        }
        this.fillIfEmpty();
    }
    this.fillIfEmpty = function(){
        //Fill in cleared area.
        if(this.isEmpty()){
            burnedArea.beginFill(0xff1122, 0.3);
            burnedArea.drawRect(this.x * CELL_WIDTH, 
                    this.y * CELL_HEIGHT,
                    CELL_WIDTH, CELL_HEIGHT);
            burnedArea.endFill();
        }
    }

    this.drawCleared = function(){
        burnedArea.beginFill(0x00ff00, 0.5);
        burnedArea.drawRect(this.x * CELL_WIDTH, 
                this.y * CELL_HEIGHT,
                CELL_WIDTH, CELL_HEIGHT);
        burnedArea.endFill();
    }

    //Sets the current state to the cell's initial state.
    this.updateInitialState = function(){
        this.totalTrees = this.objects.length;
    }
}

//A grid of BurnCells
var burngrid;
var allcells;

function getCell(worldX, worldY){
    worldX = Math.clamp(worldX, 0, WORLD_WIDTH);
    worldY = Math.clamp(worldY, 0, WORLD_HEIGHT);
    var cellX = parseInt(worldX / CELL_WIDTH);
    var cellY = parseInt(worldY / CELL_HEIGHT);

    return burngrid[cellX][cellY];
}

function getCellByIndex(ix, iy){
    if(ix < 0) return undefined;
    if(iy < 0) return undefined;
    if(ix >= CELLS_X)return undefined;
    if(iy >= CELLS_Y)return undefined;
    return burngrid[ix][iy];
}

//Start game code stuff
var BurnGame = {};

var worldContainer = new PIXI.DisplayObjectContainer();
var spriteContainer = new PIXI.DisplayObjectContainer();
var particleContainer=new PIXI.SpriteBatch();
var explosionContainer = new PIXI.DisplayObjectContainer();

var uiContainer = new PIXI.DisplayObjectContainer();

worldContainer.addChild(burnedArea);
worldContainer.addChild(spriteContainer);
worldContainer.addChild(particleContainer);
worldContainer.addChild(explosionContainer);

var trees = [];

BurnGame.loaded = false;

BurnGame.loadAnimations = function(){
    var a = {};
    a.guy = Utils.generateTileSheet(PIXI.Texture.fromImage("img/guy.png"), 2, 2);
    a.explosion = Utils.generateTileSheet(PIXI.Texture.fromImage("img/explo1.png"), 2, 4);
    a.burningtree = Utils.generateTileSheet(PIXI.Texture.fromImage("img/tree_burn.png"), 2, 2);

    this.animations = a;

    var s = {};
    s.smoke= PIXI.Texture.fromImage("img/smoke.png");
    s.tree = PIXI.Texture.fromImage("img/tree.png");

    s.guybtn   = PIXI.Texture.fromImage("img/guybtn.png");
    s.explobtn = PIXI.Texture.fromImage("img/explobtn.png");
    s.activebtn= PIXI.Texture.fromImage("img/activebtn.png");
    s.pausebtn = PIXI.Texture.fromImage("img/pausebtn.png");

    s.logo     = PIXI.Texture.fromImage("img/logo.png");

    this.textures = s;

    BurnGame.showMainMenu();
}

BurnGame.init = function(){
    //Utils.muteAll(true);
    this.loadAnimations();


    this.loaded = true;

    this.critters = [];

    stage.addChildAt(worldContainer, 0);

    this.initUI();
    requestAnimFrame(animate);
    this.fadeouts = [];
}

BurnGame.startGame = function(){
    this.totalMoney = 0;
    this.totalScore = 0;
    this.startLevel();
}

BurnGame.clearGrid = function(){
    burngrid = [];
    allcells = [];
    for(x = 0; x < CELLS_X; x++){
        burngrid.push([]);
        for(y = 0; y < CELLS_Y; y++){
            var c = new BurnCell(x, y);
            burngrid[x].push(c);
            allcells.push(c);
        }
    }
}

BurnGame.cleanLevel = function(){
    //Used for pausing the game.
    this.unusedTime = 0;
    this.roundEnded = false;
    this.explosionsLeft = EXPLOSION_AMOUNTS[EXPLOSION_LEVEL];
    this.guysLeft       = GUY_AMOUNTS[GUY_LEVEL];

    this.guyCombos = [];

    this.setTool(GUYTOOL);
    this.targetScale = 1.0;

    topLeft = new PIXI.Point(0, 0);
    botRight= new PIXI.Point(0, 0);

    not_set = true;

    this.targetPosition = new PIXI.Point();

    for(t in trees){
        trees[t].parent.removeChild(trees[t]);
    }

    this.clearGrid();
    burnedArea.clear();

    trees = [];
    this.burning_trees = [];
    this.burning_guys  = [];
    this.cleared_cells = [];
    this.burned = 0;
    this.burningTrees = 0;
    this.paused_trees = false;

    this.removeAllCritters();
    this.burnCenter = new PIXI.Point(WORLD_CENTER.x, WORLD_CENTER.y);
}

BurnGame.startLevel = function(){
    BurnGame.showUI();
    BurnGame.hideUpgrades();
    BurnGame.hideMainMenu();

    BurnGame.pause(false);
    BurnGame.strollMusic = Utils.playSound("stroll", true, true);
    if(!this.loaded){
        return;
    }
    //Clean level.
    this.cleanLevel();

    //Add a buncha trees.
    var treeTex = this.textures.tree;

    var startX = TREE_PADDING;
    var startY = TREE_PADDING;

    var areaWidth = WORLD_WIDTH - TREE_PADDING * 2;
    var areaHeight= WORLD_HEIGHT- TREE_PADDING * 2;

    for(i = 0; i < TREE_AMOUNT; i++){
        var tree = new PIXI.MovieClip([treeTex]);//this.animations.burningtree.tiles);// new PIXI.Sprite(treeTex);

        tree.anchor.y = 1;
        tree.anchor.x = 0.5;

        tree.position.x = startX + Math.random() * (areaWidth- treeTex.width) + treeTex.width * 0.5;
        tree.position.y = startY + Math.random() * (areaHeight- treeTex.height)+ treeTex.height;

        tree.startrot = Math.random() * 100;

        tree.hitArea = new PIXI.Ellipse(0, - treeTex.height * 0.5, treeTex.width * 0.5, treeTex.height * 0.5);

        spriteContainer.addChild(tree);
        trees.push(tree);
        //        tree.mouseover = function(e){  BurnGame.burnTree(this);}
        tree.setInteractive(true);
        tree.startX = tree.position.x;
        tree.startY = tree.position.y;

        getCell(tree.position.x, tree.position.y).objects.push(tree);
    }

    for(i = 0; i < GUY_AMOUNT; i++){
        this.spawnCritter(startX + Math.random() * areaWidth, startY + Math.random() * areaHeight);
    }

    allcells.forEach(function(c){
        c.fillIfEmpty();
        c.updateInitialState();
    });

    BurnGame.setViewPort(WORLD_CENTER, WORLD_CENTER, true);
    BurnGame.gameStarted = true;

    //this.spawnCritter(WORLD_CENTER.x, WORLD_CENTER.y);
}

var topLeft = new PIXI.Point(0, 0);
var botRight= new PIXI.Point(0, 0);

var not_set = true;

//Pauses animations of trees.
BurnGame.pauseTrees = function(){
    if(!this.paused_trees){
        this.paused_trees = true;
        for(t in trees){
            //trees[t].animationSpeed = 0.1;
            //trees[t].stop();
        }
    }
}

BurnGame.burnAllTrees = function(){
    for(t in trees){
        this.burnTree(trees[t]);
    }
}

BurnGame.burnTree = function(tree){
    if(!tree.burned){
        this.burning_trees.push(tree);
        tree.burned = true;
        tree.textures = this.animations.burningtree.tiles;
        tree.animationSpeed = 0.2 - Math.random() * 0.2;

        if(this.burning_trees.length < 100){
            tree.play();
        }

        if(this.burned > 10){
            this.pauseTrees();
        }

        tree.burnTime = time;
        tree.burnColor = new Color(1,0.5, 1);

        this.burned ++;

        this.centerOnBurningTrees();
        //this.centerOnBurningGuys();

    }
}

BurnGame.centerOnBurningTrees = function(){
    if(this.roundEnded){
        return;
    }

    topLeft.x = WORLD_WIDTH;
    topLeft.y = WORLD_HEIGHT;
    botRight.x= 0;
    botRight.y= 0;

    var centerX = 0;
    var centerY = 0;

    this.burning_trees.forEach(function(tree){
        if(topLeft.x > tree.x - tree.width * 0.5){
            topLeft.x = tree.x - tree.width* 0.5;
        }
        if(topLeft.y > tree.y - tree.height){
            topLeft.y = tree.y - tree.height;
        }

        if(botRight.x < tree.x + tree.width*0.5){
            botRight.x = tree.x + tree.width*0.5;
        }
        if(botRight.y < tree.y){
            botRight.y = tree.y;
        }

        centerX += tree.x;
        centerY += tree.y;
    });

    if(this.burning_trees.length == 0){
        topLeft.x = botRight.x = this.burnCenter.x;
        topLeft.y = botRight.y = this.burnCenter.y;
    }else{
        centerX /= this.burning_trees.length;
        centerY /= this.burning_trees.length;
        this.burnCenter.x = centerX;
        this.burnCenter.y = centerY;
    }

    BurnGame.setViewPort(topLeft, botRight);
}

BurnGame.centerOnBurningGuys = function(){
    if(this.roundEnded){
        return;
    }

    topLeft.x  = WORLD_WIDTH;
    topLeft.y  = WORLD_HEIGHT;
    botRight.x = 0;
    botRight.y = 0;

    var centerX = 0;
    var centerY = 0;

    this.burning_guys.forEach(function(tree){
        if(topLeft.x > tree.x - tree.width * 0.5){
            topLeft.x = tree.x - tree.width* 0.5;
        }
        if(topLeft.y > tree.y - tree.height){
            topLeft.y = tree.y - tree.height;
        }

        if(botRight.x < tree.x + tree.width*0.5){
            botRight.x = tree.x + tree.width*0.5;
        }
        if(botRight.y < tree.y){
            botRight.y = tree.y;
        }

        centerX += tree.x;
        centerY += tree.y;
    });

    if(this.burning_trees.length == 0){
        topLeft.x = botRight.x = this.burnCenter.x;
        topLeft.y = botRight.y = this.burnCenter.y;
    }else{
        centerX /= this.burning_trees.length;
        centerY /= this.burning_trees.length;
        this.burnCenter.x = centerX;
        this.burnCenter.y = centerY;
    }

    BurnGame.setViewPort(topLeft, botRight);
}

BurnGame.finishTree = function(tree){
    if(tree.finished){
        return;
    }
    tree.finished = true;

    var burnid = this.burning_trees.indexOf(tree);
    if(burnid != -1){
        this.burning_trees.splice(burnid, 1);
    }

    spriteContainer.removeChild(tree);
    trees.splice(trees.indexOf(tree), 1);

    var cell = getCell(tree.startX, tree.startY);
    cell.removeObject(tree);

    if(cell.objects.length == 0){
        this.cleared_cells.push(cell);
    }

    this.addParticles(tree.startX, tree.startY - 60, Math.random() * 10 + 10, 10);

    this.centerOnBurningTrees();
    //this.centerOnBurningGuys();
}

BurnGame.setViewPort = function(topLeft, botRight, immediate){
    var sx = botRight.x - topLeft.x;
    var sy = botRight.y - topLeft.y;

    var cx = (botRight.x + topLeft.x)/2;
    var cy = (botRight.y + topLeft.y)/2;

    if(cx == 0){
        cx = WORLD_WIDTH * 0.5;
    }

    if(cy == 0){
        cy = WORLD_HEIGHT * 0.5;
    }

    var worldSize, windowSize;
    if(sx / GAME_WIDTH > sy / GAME_HEIGHT){
        worldSize = WORLD_WIDTH;
        windowSize= GAME_WIDTH;
        s = sx;
    }else{
        worldSize = WORLD_HEIGHT;
        windowSize= GAME_HEIGHT;
        s = sy;
    }

    s += windowSize;

    var scale = windowSize / s * 0.96;


    scale = Math.min(1, scale);
    scale = Math.max(MIN_SCALE, scale);

    if(immediate){
        worldContainer.position.x = GAME_WIDTH  * 0.5 - cx * scale;
        worldContainer.position.y = GAME_HEIGHT * 0.5 - cy * scale;
        worldContainer.scale.x = scale;
        worldContainer.scale.y = scale;
    }

    BurnGame.targetScale = scale;

    BurnGame.targetPosition.x = GAME_WIDTH  * 0.5 - cx * scale;
    BurnGame.targetPosition.y = GAME_HEIGHT * 0.5 - cy * scale;
}

BurnGame.treesWithinRadius = function(x, y, r){
    var result = [];
    var rr = r*r;
    var r2 = r*2;
    var sw = parseInt(r2 / CELL_WIDTH)  + 1;
    var sh = parseInt(r2 / CELL_HEIGHT) + 1;
    var sx = parseInt(x  / CELL_WIDTH)  - parseInt(sw * 0.5);
    var sy = parseInt(y  / CELL_HEIGHT) - parseInt(sh * 0.5);
    var dx = 0, dy = 0, c = undefined;

    var xx = x;
    var yy = y;

    for(var ox = sx - 1; ox < sx + sw + 1; ox ++){
        for(var oy = sy - 1; oy < sy + sh + 1; oy ++){
            c = getCellByIndex(ox, oy);

            if(c != undefined){
                c.objects.forEach(function(t){
                    dx = xx - t.startX;
                    dy = yy - t.startY;

                    if(dx * dx + dy * dy < rr){
                        result.push(t);
                    }
                });
            }
        }
    }
    return result;
}

BurnGame.addParticles = function(x, y, pcount, r){
    if(r == undefined){
        r = 10;
    }
    for(i = 0; i < pcount; i++){
        if(particleContainer.children.length > MAX_PARTICLES){
            return;
        }
        var s = new PIXI.Sprite(this.textures.smoke);
        s.x = x;
        s.y = y;
        s.y +=   Math.random()  * r*2 - r;
        s.x +=   Math.random()  * r*2 - r;
        s.vx =  (Math.random()  * 2  - 1) * 0.5;
        s.vy = -(Math.random()) * 1;

        s.rotation = Math.random() * Math.PI * 2;

        s.lifeTime = Math.random() * 2 + 1;

        s.startTime = time;

        particleContainer.addChild(s);
    }
}

//worldContainer.interactive = true;
//worldContainer.hitArea = new PIXI.Rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

BurnGame.screenToWorld = function(x, y){
    var res = new PIXI.Point();
    res.x = x / worldContainer.scale.x;
    res.y = y / worldContainer.scale.y;
    res.x -= worldContainer.position.x / worldContainer.scale.x;
    res.y -= worldContainer.position.y / worldContainer.scale.x;
    return res;
}

BurnGame.worldToScreen = function(x, y){
    var res = new PIXI.Point(0, 0);
    res.x = x + worldContainer.position.x / worldContainer.scale.x;
    res.y = y + worldContainer.position.y / worldContainer.scale.x;
    res.x *= worldContainer.scale.x;
    res.y *= worldContainer.scale.y;
    return res;
}


stage.mousedown = function(e){
    BurnGame.mouseDown = true;
}

stage.mouseup = function(e){
    BurnGame.mouseDown =false;
}

stage.click = function(e){
    var p = e.global;
    //If clicked pause
    if(!BurnGame.roundEnded && p.x > pauseBtn.x && p.y < pauseBtn.y + pauseBtn.height){
        BurnGame.togglePause();
        return;
    }

    //If game is paused, nothing should happen.
    if(BurnGame.paused || !BurnGame.gameStarted){
        return;
    }

    //If clicmed in tool swap area
    if(p.x > toolTopLeft.x && p.y > toolTopLeft.y){
        BurnGame.swapTool();
        return;
    }

    p = BurnGame.screenToWorld(p.x, p.y);

    if(e.originalEvent.button == 0){
        if(BurnGame.currentTool == EXPLOTOOL){
            if(!BurnGame.useExploTool(p.x, p.y)){
                BurnGame.swapTool();
            }
        }else{
            if(!BurnGame.useGuyTool(p.x, p.y)){
                BurnGame.swapTool();
            }
        }
    }else if(e.originalEvent.button == 2){
        if(BurnGame.currentTool == GUYTOOL){
            BurnGame.useExploTool(p.x, p.y);
        }else{
            BurnGame.useGuyTool(p.x, p.y);
        }
        //BurnGame.startLevel();
    }

    if(BurnGame.isGameOver()){
        BurnGame.endRound();
    }
}

BurnGame.useExploTool = function(x, y){
    if(this.explosionsLeft > 0){
        this.explosionsLeft --;
        this.makeExplosion(x, y, EXPLOSION_RADS[EXPLOSION_RAD_LEVEL]);
        this.updateToolBtns();
    }
    return (this.explosionsLeft > 0);
}

BurnGame.useGuyTool = function(x, y){
    if(this.guysLeft > 0){
        this.guysLeft --;
        var c = BurnGame.spawnCritter(x, y);
        c.vy = (Math.random() - 0.5) * 5;
        c.vx = (Math.random() - 0.5) * 5;
        this.updateToolBtns();
        Utils.playSound("place");
    }
    return (this.guysLeft > 0);
}


//UI STUFF BUTTONS WHOA SOMETHING
var uimargin = 10;
var guyBtn;
var exploBtn;
var pauseBtn;
// Text color 2c2c2c
BurnGame.initUI = function(){
    var activeBtn = new PIXI.Sprite(this.textures.activebtn);
    uiContainer.addChild(activeBtn);

    //////////////
    //Guy Button
    guyBtn = new PIXI.Sprite(this.textures.guybtn);
    guyBtn.position.x = GAME_WIDTH - guyBtn.width - uimargin;
    guyBtn.position.y = GAME_HEIGHT- guyBtn.height- uimargin * 0.5;

    guyBtn.label = new PIXI.Text("", {fill:"#ffffff", font:"20px "+FONT_NAME})
        guyBtn.addChild(guyBtn.label);
    guyBtn.label.y = 44;
    guyBtn.label.x = 28;

    uiContainer.addChild(guyBtn);

    ////////////////////
    //Explosion button
    exploBtn = new PIXI.Sprite(this.textures.explobtn);

    exploBtn.position.x = guyBtn.position.x - exploBtn.width - uimargin;
    exploBtn.position.y = guyBtn.position.y;

    toolTopLeft.x = exploBtn.position.x;
    toolTopLeft.y = exploBtn.position.y;

    activeBtn.position.x = toolTopLeft.x;
    activeBtn.position.y = toolTopLeft.y;

    exploBtn.label = new PIXI.Text("", {fill:"#ffffff", font:"20px "+FONT_NAME})
        exploBtn.addChild(exploBtn.label);
    exploBtn.label.y = 44;
    exploBtn.label.x = 28;

    uiContainer.addChild(exploBtn);

    ////////////////
    //PAUSE BUTTON
    pauseBtn = new PIXI.Sprite(this.textures.pausebtn);
    pauseBtn.position.x = GAME_WIDTH - pauseBtn.width - uimargin;
    pauseBtn.position.y = uimargin * 0.5;
    uiContainer.addChild(pauseBtn);


}

BurnGame.showUI = function(){
    stage.addChild(uiContainer);
}

BurnGame.hideUI = function(){
    if(uiContainer.parent){
        uiContainer.parent.removeChild(uiContainer);
    }
}

BurnGame.swapTool = function(){
    if(this.roundEnded){
        return;
    }
    switch(this.currentTool){
        case EXPLOTOOL:
            this.setTool(GUYTOOL);
            break;
        case GUYTOOL:
            this.setTool(EXPLOTOOL);
            break;
    }
    Utils.playSound("swap");
    this.updateToolBtns();
}

BurnGame.setTool = function(t){
    var x1 = toolTopLeft.x;
    switch(t){
        case EXPLOTOOL:
            exploBtn.x = x1;
            guyBtn.x = exploBtn.x + exploBtn.width + uimargin;
            this.currentTool = EXPLOTOOL;
            break;
        case GUYTOOL:
            guyBtn.x = x1;
            exploBtn.x = guyBtn.x + guyBtn.width + uimargin;
            this.currentTool = GUYTOOL;
            break;
    }
    this.updateToolBtns();
}

var grayfilter = new PIXI.GrayFilter();
BurnGame.updateToolBtns = function(){
    if(this.explosionsLeft <= 0){
        exploBtn.filters = [grayfilter];
    }else{
        exploBtn.filters = null;
    }
    if(this.guysLeft <= 0){
        guyBtn.filters = [grayfilter];
    }else{
        guyBtn.filters = null;
    }

    guyBtn.label.setText(this.guysLeft);
    exploBtn.label.setText(this.explosionsLeft);
}

BurnGame.treesInRect = function(sx, sy, ex, ey){

}

BurnGame.guysInRect =  function(sx, sy, ex, ey){
    var res = [];
    this.critters.forEach(function(e){
        if(e.sprite.position.x - e.sprite.width * 0.5 < ex && e.sprite.position.x + e.sprite.width * 0.5 > sx){
            if(e.sprite.position.y - e.sprite.height < ey && e.sprite.position.y > sy){
                res.push(e);
            }
        }
    });
    return res;
}

//these are the conditions that determine if a game is over
//-no explosions left, and no burning trees or burning guys
//-no guys left on screen or inventory, and no burning guys.
BurnGame.isGameOver = function(){
    var gFT = this.screenToWorld(0, 0);
    var gFB = this.screenToWorld(GAME_WIDTH, GAME_HEIGHT);

    //First ending condition
    if(this.explosionsLeft == 0){
        if(this.burning_guys.length <= 0){
            return true;
        }
    }

    if(this.explosionsLeft > 0){
        if(this.guysLeft == 0){
            //If no guys on screen.
            var glist = this.guysInRect(gFT.x, gFT.y, gFB.x, gFB.y);
            if(glist.length == 0){
                if(this.burning_guys == 0){
                    return true;
                }
            }
        }
    }

    return false;
}

var someColor = new Color();
var Critter = function(_x, _y){
    this.x = _x;
    this.y = _y;

    this.vx = 0;
    this.vy = 0;

    this.pulse = 20;
    this.lifetime = GUY_LIVES[GUY_LIFE_LEVEL];

    this.onAdd = function(){}
    this.onRemove= function(){
        BurnGame.addParticles(this.x, this.y, 20, 5);
    }

    this.sprite = new PIXI.Sprite(BurnGame.animations.guy.tiles[0]);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 1.0;

    this.y += this.sprite.height * 0.5;

    this.sprite.x = _x;
    this.sprite.y = _y;

    spriteContainer.addChild(this.sprite);

    this.update = function(){
        if(this.burning){
            if(this.pulse-- <= 0){
                this.pulse = 20;
                this.burnTreesWithinRadius(GUY_RADS[GUY_RAD_LEVEL]);
            }

            if(Math.random() > 0.9){
                BurnGame.addParticles(this.x, this.y - 20, 1, 1);
            }

            this.x += this.vx;
            this.y += this.vy;
            if(this.lifetime--  <0){
                this.remove();
                var i = BurnGame.burning_guys.indexOf(this);
                if(i != -1){
                    BurnGame.burning_guys.splice(i, 1);
                }
            }

            var dt = this.lifetime / GUY_LIVES[GUY_LIFE_LEVEL];
            someColor.r = 1;
            someColor.g = someColor.b = dt;
            this.sprite.tint = someColor.getHex();
            //this.sprite.alpha = 0.1 + 0.9 * dt;
        }

        this.sprite.position.x = this.x;
        this.sprite.position.y = this.y;
    }

    this.switchedToAnimation = false;

    this.startBurning = function(){
        if(!this.switchedToAnimation){
            this.switchedToAnimation = true;
            if(this.sprite.parent){
                this.sprite.parent.removeChild(this.sprite);
            }

            this.sprite = new PIXI.MovieClip(BurnGame.animations.guy.tiles);
            this.sprite.animationSpeed = 0.2;
            this.sprite.anchor.x = 0.5;
            this.sprite.anchor.y = 1.0;
            spriteContainer.addChild(this.sprite);
            this.sprite.play();
            BurnGame.burning_guys.push(this);
        }

        if(this.lifetime < GUY_LIVES[GUY_LIFE_LEVEL]){
            this.lifetime = GUY_LIVES[GUY_LIFE_LEVEL];
        }

        this.burning = true;
    }

    this.burnTreesWithinRadius = function(r){
        var trees = BurnGame.treesWithinRadius(this.x, this.y, r);
        trees.forEach(function(t){
            BurnGame.burnTree(t);
        });
    }

    this.remove = function(){
        BurnGame.removeCritter(this);
    }
}

BurnGame.spawnCritter = function(x, y){

    var c = new Critter(x, y);
    if(c.onAdd)
        c.onAdd();

    this.critters.push(c);
    return c;
}

BurnGame.removeAllCritters = function(){
    this.critters.forEach(function(e){
        spriteContainer.removeChild(e.sprite);
    });
    this.critters = [];
}

BurnGame.removeCritter = function(c){
    if(c.onRemove)
        c.onRemove();
    spriteContainer.removeChild(c.sprite);
    var i = this.critters.indexOf(c);
    if(i != -1){
        this.critters.splice(i, 1);
    }
}

BurnGame.makeExplosion = function(x, y, r){
    if(r == undefined){
        r = 100;
    }

    for(i = 0; i < 10 + Math.random() * 10; i ++){
        var e = new PIXI.MovieClip(this.animations.explosion.tiles);
        e.anchor.x = 0.5;
        e.anchor.y = 0.5;
        var rad = Math.random() * Math.PI*2;
        var len = Math.random() * r;
        e.position.x = x + Math.cos(rad)*len;//(Math.random()-0.5)*r*2;
        e.position.y = y + Math.sin(rad)*len;//(Math.random()-0.5)*r*2;

        e.animationSpeed = 0.6 - Math.random() * 0.2;
        explosionContainer.addChild(e);
        e.play();
        e.loop = false;
        e.markedForRemoval = false;

        e.onComplete = function(){
            this.markedForRemoval = true;
            //BurnGame.addParticles(this.x, this.y, 1, 1);
        }
    }

    //Play sound!
    Utils.playSound("explo");

    //Check trees and guys in the vicinity.
    var rr = r*r;
    var dx, dy;
    var l = 0;
    var burned = 0;
    this.critters.forEach(function(e){
        dx = e.x - x;
        dy = e.y - e.sprite.height*0.5 - y;
        if(dx * dx + dy * dy < rr){
            burned ++;
            e.vx = dx;
            e.vy = dy;
            l = Math.sqrt(dx * dx + dy *dy);
            if(l != 0){
                e.vx /= l;
                e.vy /= l;
                e.vx *= GUY_SPEED;
                e.vy *= GUY_SPEED;
            }else{
                e.vx = GUY_SPEED;
                e.vy = 0;
            }
            e.startBurning();
        }
    });

    if(burned > 1){
        var p = BurnGame.worldToScreen(x, y);
        BurnGame.showPopText(p.x, p.y -50, parseInt(burned)+"x!");
    }

    if(burned > 0){
        this.guyCombos.push(burned);
    }
}

BurnGame.togglePause = function(){
    if(this.paused){
        this.pause(false);
    }else{
        this.pause(true);
    }
}

BurnGame.pause = function(_paused){
    if(_paused){
        if(!this.paused){
            this.pauseTime = Date.now();
        }
    }else{
        if(this.paused){
            this.unusedTime += Date.now() - this.pauseTime;
        }
    }
    this.paused = _paused;
}

BurnGame.endRound = function(){
    if(this.roundEnded){
        return;
    }

    var res = {};
    res.treesBurned = this.burned;
    res.cellsCleared= this.cleared_cells.length;
    res.guyCombos   = this.guyCombos;

    this.roundStats = res;

    this.explosionsLeft = this.guysLeft = 0;
    this.updateToolBtns();

    this.finishTime = Date.now();
    this.roundEnded = true;

    this.setViewPort(new PIXI.Point(0, 0), new PIXI.Point(WORLD_WIDTH, WORLD_HEIGHT));
    setTimeout(showClearedCells, 3000);
}

var showClearedCells = function(){
    setTimeout(showNextCleared, 100);
}

var showNextCleared = function(){
    if(BurnGame.cleared_cells.length > 0){
        var clears = 1;
        if(BurnGame.mouseDown){
            clears = 20;
        }
        if(BurnGame.cleared_cells.length > 30){
            clears = 20;
        }
        var c;

        for(var i = 0 ;i < clears;i++){
            if(BurnGame.cleared_cells.length == 0){
                break;
            }
            c = BurnGame.cleared_cells[0];
            c.drawCleared();
            BurnGame.cleared_cells.splice(0, 1);
        }
        setTimeout(showNextCleared, 50);
        var p = BurnGame.worldToScreen(c.worldX, c.worldY);
        BurnGame.showPopText(p.x, p.y, "COOL!");
        Utils.playSound("plonk");
        //Utils.playSound("cool");
    }else{
        setTimeout(BurnGame.showUpgrades, 400);
    }
}

BurnGame.updateRoundStats = function(){
    var treescore = parseInt(this.roundStats.treesBurned * TREE_SCORE);
    var cellscore = parseInt(this.roundStats.cellsCleared* CELL_SCORE);
    var guyscore  = 0;

    var totalscore = 0;

    this.roundStats.guyCombos.forEach(function(t){
        guyscore += GUY_SCORE * Math.pow(GUY_MULTIPLIER, t - 1);
    });

    guyscore = parseInt(guyscore);

    totalscore = parseInt(treescore + cellscore + guyscore);
    $("#forestcleared").fadeOut(0);

    var anim = {prog:0};
    var treePercent = Math.floor(100 * (BurnGame.roundStats.treesBurned / TREE_AMOUNT));
    $(anim).animate({prog:1}, {duration:1000, progress:function(a, b, c){
        $("#treesburned").html(parseInt(treescore * this.prog)); 
        $("#areascleared").html(parseInt(cellscore * this.prog));
        $("#guycombos").html(parseInt(guyscore * this.prog)); 
        $("#roundscore").html(parseInt(totalscore * this.prog));
    },

    complete:function(){
        setTimeout(function(){
            Utils.playSound("plonk");
            $("#forestcleared span").html(treePercent);
            $("#forestcleared").fadeIn(0);
            BurnGame.checkIfWon();

            $("#nextround").click(function(e){
                $("#nextround").off("click");
                Utils.playSound("plonk");
                BurnGame.startLevel();
            });
        }, 400);
    }});

    return totalscore;
}

BurnGame.checkIfWon = function(){
    var treePercent = Math.floor(100 * (BurnGame.roundStats.treesBurned / TREE_AMOUNT));
    console.log(treePercent);
    if(treePercent >= 95){
        $("#winprompt").fadeIn(400);
    }
}

BurnGame.winGame = function(){
    if(BurnGame.upgradeMusic)
    BurnGame.upgradeMusic.fadeOut(500, function(){BurnGame.upgradeMusic.stop();});
    if(BurnGame.strollMusic)
    BurnGame.strollMusic.fadeOut(500,function(){BurnGame.strollMusic.stop();});
    $("#blackscreen").fadeIn(1000, function(){
        Utils.playSound("defeated");
        setTimeout(endmogadongs, 5000);
    });
}

var endmogadongs = function(){
    $("#winscreen").fadeIn(0);
    setTimeout(rollEndCredits(), 500);
}

var endRoll, curRoll, endsong;
var rollEndCredits = function(){
    endsong = Utils.playSound("theend", true, false);
    setTimeout(oneroll, 1000/60);
    endRoll = -$("#endthing").outerHeight();
    console.log(endRoll);
    var h = $("#endthing");
    curRoll = GAME_HEIGHT * 1.5;
}

var oneroll = function(){
    curRoll -= 2;
    if(curRoll > endRoll){
        $("#endthing").css("top", curRoll+"px");
        setTimeout(oneroll, 1000/60);
    }else{
        if(endsong){
            endsong.fadeOut(3000, function(){endsong.stop();});
        }
    }
}

$(window).ready(function(){
    //rollEndCredits();
});

BurnGame.updateMoneyText = function(){
    $("#money").html(BurnGame.totalMoney); 
}

BurnGame.updateUpgradeStuff = function(){
    var explosionPercent = (EXPLOSION_LEVEL / (EXPLOSION_LEVELS - 1)) * 100;
    var guyPercent = (GUY_LEVEL / (GUY_LEVELS - 1)) * 100;
    var explosionRadPercent = (EXPLOSION_RAD_LEVEL / (EXPLOSION_RAD_LEVELS - 1)) * 100;
    var guyRadPercent = (GUY_RAD_LEVEL / (GUY_RAD_LEVELS - 1)) * 100;
    var guyLifePercent = (GUY_LIFE_LEVEL / (GUY_LIFE_LEVELS - 1)) * 100;

    $("#exploProg").animate({width:explosionPercent+"%"}, 100);
    $("#guyProg").animate({width:guyPercent+"%"}, 100);
    $("#exploRadProg").animate({width:explosionRadPercent+"%"}, 100);
    $("#guyRadProg").animate({width:guyRadPercent+"%"}, 100);
    $("#guyLifeProg").animate({width:guyLifePercent+"%"}, 100);

    $("#explosionLevel").html(EXPLOSION_COSTS[EXPLOSION_LEVEL]);
    $("#guyLevel").html(GUY_COSTS[GUY_LEVEL]);
    $("#explosionRadiusLevel").html(EXPLOSION_RAD_COSTS[EXPLOSION_RAD_LEVEL]);
    $("#guyRadiusLevel").html(GUY_RAD_COSTS[GUY_RAD_LEVEL]);
    $("#guyLifeLevel").html(GUY_LIFE_COSTS[GUY_LIFE_LEVEL]);

    BurnGame.updateMoneyText();
}

$(window).ready(function(){
    /////////////////////////////////
    //Bind upgrade buttons to stuff
    //
    //Explosive amount
    $("#upgrade1").click(function(){
        //If already max level
        if(EXPLOSION_LEVEL+1 >= EXPLOSION_LEVELS){
            return;
        }

        if(BurnGame.totalMoney >= EXPLOSION_COSTS[EXPLOSION_LEVEL]){
            BurnGame.totalMoney -= EXPLOSION_COSTS[EXPLOSION_LEVEL];
            EXPLOSION_LEVEL ++;
            Utils.playSound("upgrade");
        }
        BurnGame.updateUpgradeStuff();
    });

    //Guy amount
    $("#upgrade2").click(function(){
        //If already max level
        if(GUY_LEVEL+1 >= GUY_LEVELS){
            return;
        }
        if(BurnGame.totalMoney >= GUY_COSTS[GUY_LEVEL]){
            BurnGame.totalMoney -= GUY_COSTS[GUY_LEVEL];
            GUY_LEVEL++;
            Utils.playSound("upgrade");
        }
        BurnGame.updateUpgradeStuff();
    });

    //explosive radius 
    $("#upgrade3").click(function(){
        //If already max level
        if(EXPLOSION_RAD_LEVEL+1 >= EXPLOSION_RAD_LEVELS){
            return;
        }
        if(BurnGame.totalMoney >= EXPLOSION_RAD_COSTS[EXPLOSION_RAD_LEVEL]){
            BurnGame.totalMoney -= EXPLOSION_RAD_COSTS[EXPLOSION_RAD_LEVEL];
            EXPLOSION_RAD_LEVEL++;
            Utils.playSound("upgrade");
        }
        BurnGame.updateUpgradeStuff();
    });

    //guy radius 
    $("#upgrade4").click(function(){
        //If already max level
        if(GUY_RAD_LEVEL+1 >= GUY_RAD_LEVELS){
            return;
        }
        if(BurnGame.totalMoney >= GUY_RAD_COSTS[GUY_RAD_LEVEL]){
            BurnGame.totalMoney -= GUY_RAD_COSTS[GUY_RAD_LEVEL];
            GUY_RAD_LEVEL++;
            Utils.playSound("upgrade");
        }
        BurnGame.updateUpgradeStuff();
    });

    //guy life
    $("#upgrade5").click(function(){
        //If already max level
        if(GUY_LIFE_LEVEL+1 >= GUY_LIFE_LEVELS){
            return;
        }
        if(BurnGame.totalMoney >= GUY_LIFE_COSTS[GUY_LIFE_LEVEL]){
            BurnGame.totalMoney -= GUY_LIFE_COSTS[GUY_LIFE_LEVEL];
            GUY_LIFE_LEVEL++;
            Utils.playSound("upgrade");
        }
        BurnGame.updateUpgradeStuff();
    });

    $(".mutebutton").click(function(){
       $(".mutebutton").toggleClass("muted", 
           Utils.toggleMute()
        );
    });

    $("#notyet").click(function(){
        $("#winprompt").fadeOut(300);
    });
    
    $("#yeswin").click(function(){
        BurnGame.winGame();
    });
});

BurnGame.showUpgrades = function(){
    
    BurnGame.upgradeMusic = Utils.playSound("upgrades", true, true);
    
    if(BurnGame.strollMusic)
        BurnGame.strollMusic.fadeOut(1000, function(){BurnGame.strollMusic.stop();});
    BurnGame.hideUI();
    BurnGame.gameStarted = false;

    var score = BurnGame.updateRoundStats();

    BurnGame.totalMoney = parseInt(BurnGame.totalMoney + score * MONEY_PER_SCORE);
    BurnGame.totalScore = parseInt(BurnGame.totalScore + score);
    BurnGame.updateUpgradeStuff();

    $(".totalscore").html(BurnGame.totalScore);

    $("#gameoverlay").fadeIn(400, function(){
    });
}

BurnGame.hideUpgrades = function(){
    if(BurnGame.upgradeMusic){
        BurnGame.upgradeMusic.fadeOut(1000, function(){BurnGame.upgradeMusic.stop();});
    }
    $("#gameoverlay").fadeOut("slow");
}


BurnGame.showMainMenu = function(){
    BurnGame.hideUpgrades();
    BurnGame.menuContainer = new PIXI.DisplayObjectContainer();
    var c = BurnGame.menuContainer;
    var logo = new PIXI.Sprite(BurnGame.textures.logo);
    BurnGame.menuContainer.addChild(logo);

    var btn = new PIXI.Sprite(PIXI.Texture.fromImage("img/start.png"));
    c.addChild(btn);
    btn.x = 20;
    btn.y = 380;

    btn.setInteractive(true);
    btn.click = function(e){
        BurnGame.startGame();
    }

    stage.addChild(BurnGame.menuContainer);
}

BurnGame.hideMainMenu = function(){
    if(BurnGame.menuContainer.parent){
        stage.removeChild(BurnGame.menuContainer);
    }
}

BurnGame.showPopText = function(x, y, text){
    var t = new PIXI.Text(text, {fill:"#FFFFFF", font:"16px "+FONT_NAME});
    t.position.x = x;
    t.position.y = y;
    t.anchor.x = t.anchor.y = 0.5;
    t.rotation = (Math.random() - 0.5)* Math.PI * 0.1;
    BurnGame.fadeouts.push(t);
    uiContainer.addChild(t);
}

var time = 0.0;

var filter = new PIXI.BlurFilter();

//spriteContainer.filters = [filter];

var startTime = Date.now();

function animate() {
    requestAnimFrame(animate);
    if(BurnGame.paused){
        return;
    }

    if(BurnGame.gameStarted){

        time = (Date.now() - startTime - BurnGame.unusedTime)*0.001;
        var a = 0.05;

        var s = (BurnGame.targetScale - worldContainer.scale.x)*a;
        worldContainer.scale.x += s;
        worldContainer.scale.y += s;

        s = (BurnGame.targetPosition.x - worldContainer.x) * a;
        worldContainer.x += s;

        s = (BurnGame.targetPosition.y - worldContainer.y) * a;
        worldContainer.y += s;

        //Sort objects so they appear to be behind each other and stuff.
        var objects = spriteContainer.children;
        objects.sort(function(a, b){
            if(a.y > b.y){
                return 1;
            }
            return -1;
        });

        trees.forEach(function(tree){
            tree.rotation = Math.cos(tree.startrot + time * 5) * 0.01;

            if(tree.burned){
                var dt = time - tree.burnTime;
                var dtn= dt/TREE_BURN_TIME;
                tree.position.x = tree.startX + dtn*5*(((time*6*(dtn + 1) + tree.burnTime) % 5 < 2.5)?1:-1);

                tree.burnColor.g = 0.5 * (1 - dtn);
                tree.burnColor.b = (1-dtn);

                tree.tint = tree.burnColor.getHex();

                if(dt > TREE_BURN_TIME || BurnGame.roundEnded){
                    BurnGame.finishTree(tree);
                }
            }
        });

        particleContainer.children.forEach(function(e){
            e.position.x += e.vx;
            e.position.y += e.vy;
            if(e.startTime + e.lifeTime < time){
                e.parent.removeChild(e);
            }
        });

        BurnGame.critters.forEach(function(e){
            e.update();
        });

        explosionContainer.children.forEach(function(t){
            if(t.markedForRemoval){
                explosionContainer.removeChild(t);
            }
        });

        BurnGame.fadeouts.forEach(function(e){
            e.alpha -= 0.03;
            if(e.alpha <0){
                e.parent.removeChild(e);
                BurnGame.fadeouts.splice(BurnGame.fadeouts.indexOf(e), 1);
            }
        });
    }
    renderer.render(stage);
}

//Disable right click
document.onmousedown = function(e) {
    if(e.button == 2){
        return false;
    }
};

$(window).ready(function(){
    $("#gameoverlay").fadeOut(0);
});
