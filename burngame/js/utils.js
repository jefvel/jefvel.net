var TileSheet = function(h, v, tiles){
    this.tiles = tiles;
    this.h = h;
    this.v = v;
    this.tilecount = h * v;
    this.getTile = function(x, y){
        if(x + y * this.h < this.tilecount){
            return this.tiles[x + y * this.h];
        }
        return undefined;
    }
}

var Color = function(r, g, b){
    this.r = r;
    this.g = g;
    this.b = b;
    this.getHex = function(){
        return parseInt(this.r*255)<<16 | parseInt(this.g*255) << 8 | parseInt(this.b*255);
    }
}

Math.clamp = function(n, min, max){
    if(n < min){
        return min;
    }
    if(n > max){
        return max;
    }
    return n;
}

///Generates tilesheet of texture tex, with htiles horisontal tiles and vtiles vertical tiles.
var Utils = {};
Utils.generateTileSheet = function(tex, htiles, vtiles){
    var tiles = [];
    
    var w = tex.width / htiles;
    var h = tex.height/ vtiles;

    for(var y = 0; y < vtiles; y ++){
        for(var x = 0; x < htiles; x++){
            var t = new PIXI.Texture(tex, new PIXI.Rectangle(x*w, y*h, w, h));
            tiles.push(t);
        }
    }

    return new TileSheet(htiles, vtiles, tiles);
}

Utils.soundMuted = false;
Utils.volume = 50;

buzz.defaults.duration = 1000; 

Utils.muteAll = function(mute){
    Utils.soundMuted = mute;
    for(var tt in buzz.sounds){
        var t = buzz.sounds[tt];
        if(mute){
            t.mute();
        }else{
            t.unmute();
        }
    }
}

Utils.stopAllSounds = function(){
    Utils.sounds.forEach(function(t){
        t.stop();
    });
    Utils.sounds = [];
}

Utils.toggleMute = function(){
    if(Utils.soundMuted){
        Utils.muteAll(false);
    }else{
        Utils.muteAll(true);
    }
    return Utils.soundMuted;
}

Utils.sounds = {};

Utils.stopSound = function(sound, fadeout){
    if(this.sounds[sound] != undefined){
        if(fadeout){
            this.sounds[sound].fadeOut();
        }
        this.sounds[sound].stop();
    }
}

Utils.playSound = function(sound, looping, fadein){
    if(this.soundMuted){
        return;
    }

    var s = new buzz.sound("sound/"+sound, {formats: ["mp3","ogg"]});
    s.setVolume(Utils.volume);

    if(s){
        s.play();
        if(looping){
            if(this.sounds[sound]){
                this.sounds[sound].stop();
            }
            s.loop();
        }
        if(fadein){
            s.fadeIn();
        }
    }

    this.sounds[sound] = s;
    return s;
    /*if(Sounds[sound]){
        if(looping){
            Sounds[sound].stop();
        }
        Sounds[sound].play();
        if(looping)
            Sounds[sound].loop();
        if(fadein)
            Sounds[sound].fadeIn();
    }*/
}
