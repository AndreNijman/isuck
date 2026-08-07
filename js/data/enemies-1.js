;(function (IS) {
  'use strict'

  IS.defineEnemies([
    {
      "id": "gaper",
      "name": "Gaper",
      "hp": 10,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "gaper",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Gaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "frowning-gaper",
      "name": "Frowning Gaper",
      "hp": 14,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "frowning-gaper",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Frowning Gaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "flaming-gaper",
      "name": "Flaming Gaper",
      "hp": 18,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "flaming-gaper",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Flaming Gaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "pooter",
      "name": "Pooter",
      "hp": 22,
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
      "sprite": "pooter",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Pooter stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-pooter",
      "name": "Super Pooter",
      "hp": 26,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "super-pooter",
      "tint": "#6f8795",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Super Pooter stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fatty",
      "name": "Fatty",
      "hp": 30,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "fatty",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "flaming-fatty",
      "name": "Flaming Fatty",
      "hp": 34,
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
      "sprite": "flaming-fatty",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Flaming Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "clotty",
      "name": "Clotty",
      "hp": 38,
      "r": 22,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "clotty",
      "tint": "#dfc9b0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Clotty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "i-blob",
      "name": "I.Blob",
      "hp": 10,
      "r": 25,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "i-blob",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "I.Blob stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "sucker",
      "name": "Sucker",
      "hp": 14,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "sucker",
      "tint": "#667d89",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Sucker stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "spit",
      "name": "Spit",
      "hp": 18,
      "r": 16,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "spitter",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "spit",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Spit stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "horf",
      "name": "Horf",
      "hp": 22,
      "r": 19,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "horf",
      "tint": "#dfc9b0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Horf stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "hopper",
      "name": "Hopper",
      "hp": 26,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "hopper",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Hopper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "trite",
      "name": "Trite",
      "hp": 30,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "trite",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Trite stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "attackfly",
      "name": "Attackfly",
      "hp": 34,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "attackfly",
      "tint": "#93aab3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Attack Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fly",
      "name": "Fly",
      "hp": 38,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "fly",
      "tint": "#dfc9b0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "pot",
      "name": "Pot",
      "hp": 10,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "pot",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Pot stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "squirt",
      "name": "Squirt",
      "hp": 14,
      "r": 22,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "squirt",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Squirt stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "dip",
      "name": "Dip",
      "hp": 18,
      "r": 25,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "dip",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Dip stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "dank-dip",
      "name": "Dank Dip",
      "hp": 22,
      "r": 28,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "grid",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "dank-dip",
      "tint": "#8297a3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Dank Dip stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "charger",
      "name": "Charger",
      "hp": 26,
      "r": 16,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "charger",
      "tint": "#dfc9b0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Charger stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "boom-fly",
      "name": "Boom Fly",
      "hp": 30,
      "r": 19,
      "speed": 75,
      "dmg": 1,
      "flying": true,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "boom-fly",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Boom Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "red-boom-fly",
      "name": "Red Boom Fly",
      "hp": 34,
      "r": 22,
      "speed": 90,
      "dmg": 1,
      "flying": true,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "red-boom-fly",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Red Boom Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "drop",
      "name": "Drop",
      "hp": 38,
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
      "sprite": "drop",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Drop stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mulligan",
      "name": "Mulligan",
      "hp": 10,
      "r": 28,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "mulligan",
      "tint": "#93aab3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Mulligan stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mulliboom",
      "name": "Mulliboom",
      "hp": 14,
      "r": 16,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "mulliboom",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Mulliboom stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gusher",
      "name": "Gusher",
      "hp": 18,
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
      "sprite": "gusher",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Gusher stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "baby",
      "name": "Baby",
      "hp": 22,
      "r": 22,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "baby",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Baby stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "cyclopia",
      "name": "Cyclopia",
      "hp": 26,
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
      "sprite": "cyclopia",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Cyclopia stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "splasher",
      "name": "Splasher",
      "hp": 30,
      "r": 28,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "splasher",
      "tint": "#6f8795",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Splasher stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mask",
      "name": "Mask",
      "hp": 34,
      "r": 16,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "mask",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Mask stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "host",
      "name": "Host",
      "hp": 38,
      "r": 19,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "host",
      "tint": "#dfc9b0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Host stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "red-host",
      "name": "Red Host",
      "hp": 10,
      "r": 22,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "red-host",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Red Host stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mr-maw",
      "name": "Mr. Maw",
      "hp": 14,
      "r": 25,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "mr-maw",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Mr. Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "maw",
      "name": "Maw",
      "hp": 18,
      "r": 28,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "maw",
      "tint": "#8297a3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "psychic-maw",
      "name": "Psychic Maw",
      "hp": 22,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "psychic-maw",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Psychic Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "nerve-ending",
      "name": "Nerve Ending",
      "hp": 26,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "nerve-ending",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Nerve Ending stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "round-worm",
      "name": "Round Worm",
      "hp": 30,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "round-worm",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Round Worm stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "night-crawler",
      "name": "Night Crawler",
      "hp": 34,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "night-crawler",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Night Crawler stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "para-bite",
      "name": "Para-Bite",
      "hp": 38,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "grid",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "para-bite",
      "tint": "#93aab3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Para-Bite stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "leech",
      "name": "Leech",
      "hp": 10,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "leech",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Leech stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "small-leech",
      "name": "Small Leech",
      "hp": 14,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "small-leech",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Small Leech stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "baby-long-legs",
      "name": "Baby Long Legs",
      "hp": 18,
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
      "sprite": "baby-long-legs",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Baby Long Legs stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "crazy-long-legs",
      "name": "Crazy Long Legs",
      "hp": 22,
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
      "sprite": "crazy-long-legs",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Crazy Long Legs stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "dinga",
      "name": "Dinga",
      "hp": 26,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "dinga",
      "tint": "#8297a3",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Dinga stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blurb",
      "name": "Blurb",
      "hp": 30,
      "r": 16,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "blurb",
      "tint": "#c9b7a0",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Blurb stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "drowned-charger",
      "name": "Drowned Charger",
      "hp": 34,
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
      "sprite": "drowned-charger",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Drowned Charger stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "drowned-boom-fly",
      "name": "Drowned Boom Fly",
      "hp": 38,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": true,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "drowned-boom-fly",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "burning-basement",
        "basement-2",
        "cellar-2"
      ],
      "bestiary": "Drowned Boom Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "poppy-gaper",
      "name": "Poppy Gaper",
      "hp": 10,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "poppy-gaper",
      "tint": "#ead9c4",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement-2",
        "cellar-2",
        "burning-basement-2"
      ],
      "bestiary": "Poppy Gaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gutted-fatty",
      "name": "Gutted Fatty",
      "hp": 14,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "gutted-fatty",
      "tint": "#a8b7bd",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar-2",
        "burning-basement-2",
        "downpour"
      ],
      "bestiary": "Gutted Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "grackle",
      "name": "Grackle",
      "hp": 18,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "spitter",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "grackle",
      "tint": "#b89d86",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "basement",
        "cellar",
        "burning-basement"
      ],
      "bestiary": "Grackle stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mole",
      "name": "Mole",
      "hp": 22,
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
      "sprite": "mole",
      "tint": "#a98272",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "cellar",
        "burning-basement",
        "basement-2"
      ],
      "bestiary": "Mole stalks the ruined floors with a distinct and dangerous rhythm."
    }
  ])
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
