---
title: "Heaps Cool Guide Pt 1"
date: 2020-04-24T13:28:30+02:00
draft: false
---

![logo](https://i.imgur.com/O6SdYdN.png)

If you like making games, then the [Heaps](https://heaps.io) framework
might be worth looking into. It is open source, works both in the browser and natively
using the Hashlink virtual machine. It also has its own 3D editor, [HIDE](https://github.com/heapsio/hide).

However the documentation for the whole ecosystem might be a bit lacking, especially for some more advanced features.

I have been using Heaps for a bit, and have gotten quite used to it, so I decided to write
this guide for getting started with the framework, and eventually build a small game.

*I will be using Windows for this guide, but the steps should be quite similar to other
platforms. Please let me know if you run into problems.*

## Installation

## Haxe
The first thing we need is [Haxe](https://haxe.org/), so go ahead and download and
install the [latest version](https://haxe.org/download/). If you have a previous version of Haxe installed, make sure it's
newer than 4.0.0. So it's best that you just get the newest one. 

Once it's installed, make sure `haxelib` and `haxe` exists in PATH. Do this by running `cmd`,
or git bash or whatever terminal you prefer, and type `haxe` and `haxelib`. The latter command might
mention something about `haxelib` not being setup. So go ahead and run the configuration command
and follow the steps shown.

## Heaps starter pack
Once that is done, we need to download Heaps. I have created
[a small boilerplate repository](https://github.com/jefvel/game-base)
for Heaps projects. It has some very basic stuff useful for games. It's this project that we're going
to use in this guide.

First, clone this project somewhere:
```bash
git clone https://github.com/jefvel/game-base.git hello-world-heaps
cd hello-world-heaps
```
You can change `hello-world-heaps` to whatever you want your project to be.

We have the project code now, but still lack the Heaps library, plus some additional required libs.
So we'll install them using `haxelib`.

Currently the default existing version is not frequently updated, so we have to use the git version:
```bash
haxelib git heaps https://github.com/HeapsIO/heaps.git
```
We also need the following libraries:
```bash
haxelib git castle https://github.com/ncannasse/castle.git
haxelib install hscript
haxelib install stb_ogg_sound
haxelib install hlsdl
haxelib install hldx
haxelib install closure
```

Now we have come far enough to run the starter project in the browser.

But what if we want to run it natively? For that we need [HashLink](https://hashlink.haxe.org/). If you're happy with
browser only you can skip the next section.

## Install HashLink

There are multiple ways to get HashLink. You can either download the built binaries, or build it yourself.
Building it requires a few more steps, so for now we're just going to download it. [Visit the releases page](https://github.com/HaxeFoundation/hashlink/releases) and download the file named `hl-1.11.0-win.zip`, or the latest version you see in the list.

Once downloaded, unzip the files to somewhere on your computer. I have the files in `C:/dev/hl`.

Now we need to add this directory to `PATH`, so we can run the `hl.exe` executable using the terminal.
Open up the start menu and type `system environment variables` and launch the dialog.
Then click `Environment Variables...`, look up the `path` value, double click it. Then click `Browse` or `New` and enter the path to the `C:/dev/hl` directory.

You might have to restart/log out in for this to take effect.

Slam bam, we're mostly done.
If we want to use audio we also need the executable `oggenc2`, which converts wav files into ogg.
Heaps does this automatically, but requires the encoder. Visit [the ogg enc web page](https://www.rarewares.org/ogg-oggenc.php)
and download the Generic or x64 only version, and put the executable into your PATH. I was lazy so I put it in `C:/dev/hl/oggenc2.exe`.

## Setting up Visual Studio Code
To code and debug Heaps and Haxe we're using Visual studio code. Open the `hello-world-heaps` directory and [install the Haxe Extension Pack](https://marketplace.visualstudio.com/items?itemName=vshaxe.haxe-extension-pack).

I also recommend the [Command Bar Extension](https://marketplace.visualstudio.com/items?itemName=gsppvo.vscode-commandbar). It's very cool.

## Running the starter pack

The debug panel in VS Code has options to run HashLink using SDL+OpenGL and DirectX, and JS in the browser.
If everything has been setup correctly, they should all be runnable.

![Result](https://i.imgur.com/ylkinIX.gif)

Here are some files you can check out:

### `common.hxml`

In this file you can find a couple configuration variables, for example setting the size and title of the window,
and make the window unresizable if you want that. Also if you have Aseprite installed, you can set it here.
This will enable semi automatic generation of `.aseprite` files in the `res` folder. To try that out, open the image
`res/img/test.aseprite` and modify it. Then, if you have Command Bar installed, you can press the `Generate Assets` button in VS Code:
![vs code generate assets](https://i.imgur.com/2l13I9r.png), or press CTRL+SHIFT+P, type in `run task` and select `Generate Assets`.

If you now debug the application you can see the images have been updated.


### `src/Const.hx`

Contains constants. If you want to make a pixel art 2D game, you can set the `PIXEL_SIZE` for bigger pixel sizes. This starter pack
also includes 3D sprites, that works like the characters in Doom 2 for example. The `PIXEL_SIZE_WORLD` is how many pixels one 3D world unit is. So if you have a character image that is 32 pixels wide and tall, it will be a single unit sized billboard sprite.

### `src/example`

Here you can see a hello world gamestate and entity. Very simple for now.

### `src/Game.hx`

The main file of the game. The main game loop runs in here.



## Next Steps

Here I have listed the setup steps for Heaps and HashLink. I am planning on adding more features to this starter pack, and
document it in future guides/tutorials. [Let me know](https://twitter.com/jefvel) if it's of interest.

