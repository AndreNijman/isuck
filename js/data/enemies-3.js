;(function (IS) {
  'use strict'

  IS.defineEnemies([
    {
      "id": "knight",
      "name": "Knight",
      "hp": 42,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "knight",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Knight stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "selfless-knight",
      "name": "Selfless Knight",
      "hp": 46,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "selfless-knight",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Selfless Knight stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "loose-knight",
      "name": "Loose Knight",
      "hp": 50,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "loose-knight",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Loose Knight stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "brain",
      "name": "Brain",
      "hp": 54,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "shooterMobile",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "brain",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Brain stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "guts",
      "name": "Guts",
      "hp": 58,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "guts",
      "tint": "#c4b78e",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Guts stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "heart",
      "name": "Heart",
      "hp": 62,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "heart",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Heart stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "imp",
      "name": "Imp",
      "hp": 66,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "charger",
      "params": {
        "windup": 0.6,
        "dashSpeed": 430,
        "recover": 0.8
      },
      "sprite": "imp",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Imp stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "wall-hugger",
      "name": "Wall Hugger",
      "hp": 70,
      "r": 22,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "wall-hugger",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Wall Hugger stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "grimace",
      "name": "Grimace",
      "hp": 42,
      "r": 25,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "grimace",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Grimace stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "stone-grimace",
      "name": "Stone Grimace",
      "hp": 46,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "stone-grimace",
      "tint": "#746d75",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Stone Grimace stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "vomit-grimace",
      "name": "Vomit Grimace",
      "hp": 50,
      "r": 16,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "vomit-grimace",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Vomit Grimace stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "wizoob",
      "name": "Wizoob",
      "hp": 54,
      "r": 19,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "wizoob",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Wizoob stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "red-ghost",
      "name": "Red Ghost",
      "hp": 58,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": true,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "red-ghost",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Red Ghost stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "whipper",
      "name": "Whipper",
      "hp": 62,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "whipper",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Whipper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "snapper",
      "name": "Snapper",
      "hp": 66,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "snapper",
      "tint": "#817b83",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Snapper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "flaming-hopper",
      "name": "Flaming Hopper",
      "hp": 70,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "flaming-hopper",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Flaming Hopper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fred",
      "name": "Fred",
      "hp": 42,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "fred",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Fred stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "poison-mind",
      "name": "Poison Mind",
      "hp": 46,
      "r": 22,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "poison-mind",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Poison Mind stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ragling",
      "name": "Ragling",
      "hp": 50,
      "r": 25,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "ragling",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Ragling stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "deaths-head",
      "name": "Death's Head",
      "hp": 54,
      "r": 28,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "deaths-head",
      "tint": "#d1c6a7",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Death's Head stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "cursed-deaths-head",
      "name": "Cursed Death's Head",
      "hp": 58,
      "r": 16,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "cursed-deaths-head",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Cursed Death's Head stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "floating-knight",
      "name": "Floating Knight",
      "hp": 62,
      "r": 19,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "floating-knight",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Floating Knight stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "poof",
      "name": "Poof",
      "hp": 66,
      "r": 22,
      "speed": 90,
      "dmg": 1,
      "flying": true,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "poof-ghost",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Poof stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "sanguine-bond",
      "name": "Sanguine Bond",
      "hp": 70,
      "r": 25,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shooterMobile",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "sanguine-bond",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Sanguine Bond stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "hell-bird",
      "name": "Hell Bird",
      "hp": 42,
      "r": 28,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "hell-bird",
      "tint": "#c4b78e",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Hell Bird stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "grudge-bat",
      "name": "Grudge Bat",
      "hp": 46,
      "r": 16,
      "speed": 135,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "grudge-bat",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Grudge Bat stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blood-puppy",
      "name": "Blood Puppy",
      "hp": 50,
      "r": 19,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "charger",
      "params": {
        "windup": 0.6,
        "dashSpeed": 430,
        "recover": 0.8
      },
      "sprite": "blood-puppy",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Blood Puppy stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "lil-blub",
      "name": "Lil Blub",
      "hp": 54,
      "r": 22,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "lil-blub",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Lil Blub stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "membrane",
      "name": "Membrane",
      "hp": 58,
      "r": 25,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "membrane",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Membrane stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "walking-sack",
      "name": "Walking Sack",
      "hp": 62,
      "r": 28,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "walking-sack",
      "tint": "#746d75",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Walking Sack stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "bloodshot-eye",
      "name": "Bloodshot Eye",
      "hp": 66,
      "r": 16,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "bloodshot-eye",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Bloodshot Eye stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "conjoined-fatty",
      "name": "Conjoined Fatty",
      "hp": 70,
      "r": 19,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "sprayer",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "conjoined-fatty",
      "tint": "#443d4d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Conjoined Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gurgle",
      "name": "Gurgle",
      "hp": 42,
      "r": 22,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "gurgle",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Gurgle stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "handsome-gurgle",
      "name": "Handsome Gurgle",
      "hp": 46,
      "r": 25,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "handsome-gurgle",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Handsome Gurgle stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "swinger",
      "name": "Swinger",
      "hp": 50,
      "r": 28,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "swinger",
      "tint": "#d1c6a7",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Swinger stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "spitty",
      "name": "Spitty",
      "hp": 54,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "spitty",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Spitty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "lump",
      "name": "Lump",
      "hp": 58,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "lump",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Lump stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "corn-mine",
      "name": "Corn Mine",
      "hp": 62,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "corn-mine",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Corn Mine stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "bloated-fatty",
      "name": "Bloated Fatty",
      "hp": 66,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "bloated-fatty",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Bloated Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "lil-haunt",
      "name": "Lil Haunt",
      "hp": 70,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "lil-haunt",
      "tint": "#746d75",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Lil Haunt stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blood-feeder",
      "name": "Blood Feeder",
      "hp": 42,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "blood-feeder",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Blood Feeder stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "camillo",
      "name": "Camillo",
      "hp": 46,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "camillo",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Camillo stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blood-hulk",
      "name": "Blood Hulk",
      "hp": 50,
      "r": 22,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "blood-hulk",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Blood Hulk stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "flesh-maiden",
      "name": "Flesh Maiden",
      "hp": 54,
      "r": 25,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shooterMobile",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "flesh-maiden",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Flesh Maiden stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "moms-hand",
      "name": "Mom's Hand",
      "hp": 58,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "moms-hand",
      "tint": "#c4b78e",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Mom's Hand stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "moms-dead-hand",
      "name": "Mom's Dead Hand",
      "hp": 62,
      "r": 16,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "moms-dead-hand",
      "tint": "#594b63",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Mom's Dead Hand stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "keeper",
      "name": "Keeper",
      "hp": 66,
      "r": 19,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "charger",
      "params": {
        "windup": 0.6,
        "dashSpeed": 430,
        "recover": 0.8
      },
      "sprite": "keeper",
      "tint": "#6d536f",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Keeper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "stone-eye",
      "name": "Stone Eye",
      "hp": 70,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "stone-eye",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "dank-depths",
        "depths-2",
        "necropolis-2"
      ],
      "bestiary": "Stone Eye stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "brimstone-head",
      "name": "Brimstone Head",
      "hp": 42,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "brimstone-head",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths-2",
        "necropolis-2",
        "dank-depths-2"
      ],
      "bestiary": "Brimstone Head stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "red-floater",
      "name": "Red Floater",
      "hp": 46,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "red-floater",
      "tint": "#d1c6a7",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis-2",
        "dank-depths-2",
        "mausoleum"
      ],
      "bestiary": "Red Floater stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "leaper",
      "name": "Leaper",
      "hp": 50,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "leaper",
      "tint": "#80617d",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "depths",
        "necropolis",
        "dank-depths"
      ],
      "bestiary": "Leaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "tissue",
      "name": "Tissue",
      "hp": 54,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "sprayer",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "tissue",
      "tint": "#3a3540",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "necropolis",
        "dank-depths",
        "depths-2"
      ],
      "bestiary": "Tissue stalks the ruined floors with a distinct and dangerous rhythm."
    }
  ])
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
