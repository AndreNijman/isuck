;(function (IS) {
  'use strict'

  IS.defineEnemies([
    {
      "id": "locust-of-famine",
      "name": "Locust of Famine",
      "hp": 62,
      "r": 16,
      "speed": 75,
      "dmg": 2,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "locust-of-famine",
      "tint": "#7f3442",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Locust of Famine stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "locust-of-pestilence",
      "name": "Locust of Pestilence",
      "hp": 66,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "locust-of-pestilence",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Locust of Pestilence stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "locust-of-war",
      "name": "Locust of War",
      "hp": 70,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "locust-of-war",
      "tint": "#919982",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Locust of War stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "locust-of-death",
      "name": "Locust of Death",
      "hp": 74,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "locust-of-death",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Locust of Death stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fly-bomb",
      "name": "Fly Bomb",
      "hp": 78,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": true,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "fly-bomb",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Fly Bomb stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "willo",
      "name": "Willo",
      "hp": 82,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "willo",
      "tint": "#bd5969",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Willo stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "big-bony",
      "name": "Big Bony",
      "hp": 86,
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
      "sprite": "big-bony",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Big Bony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "kamikaze-leech",
      "name": "Kamikaze Leech",
      "hp": 90,
      "r": 22,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "kamikaze-leech",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Kamikaze Leech stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "null",
      "name": "Null",
      "hp": 62,
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
      "sprite": "null",
      "tint": "#919982",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Null stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "angelic-baby",
      "name": "Angelic Baby",
      "hp": 66,
      "r": 28,
      "speed": 105,
      "dmg": 2,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "angelic-baby",
      "tint": "#919982",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Angelic Baby stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "holy-bony",
      "name": "Holy Bony",
      "hp": 70,
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
      "sprite": "holy-bony",
      "tint": "#d47783",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Holy Bony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "vassal",
      "name": "Vassal",
      "hp": 74,
      "r": 19,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "sprayer",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "vassal",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Vassal stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ultra-coin",
      "name": "Ultra Coin",
      "hp": 78,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "ultra-coin",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Ultra Coin stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "pincushion",
      "name": "Pincushion",
      "hp": 82,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "pincushion",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Pincushion stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "grilled-clotty",
      "name": "Grilled Clotty",
      "hp": 86,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "grilled-clotty",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Grilled Clotty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "hanger",
      "name": "Hanger",
      "hp": 90,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "hanger",
      "tint": "#6c2d38",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Hanger stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "one-tooth",
      "name": "One Tooth",
      "hp": 62,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "one-tooth",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "One Tooth stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fat-bat",
      "name": "Fat Bat",
      "hp": 66,
      "r": 22,
      "speed": 120,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "fat-bat",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Fat Bat stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-gaper",
      "name": "Blue Gaper",
      "hp": 70,
      "r": 25,
      "speed": 135,
      "dmg": 2,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "blue-gaper",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Blue Gaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-maw",
      "name": "Blue Maw",
      "hp": 74,
      "r": 28,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "grid",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "blue-maw",
      "tint": "#48534b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Blue Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-boil",
      "name": "Blue Boil",
      "hp": 78,
      "r": 16,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "blue-boil",
      "tint": "#6c2d38",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Blue Boil stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-globin",
      "name": "Blue Globin",
      "hp": 82,
      "r": 19,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "blue-globin",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Blue Globin stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-conjoined-fatty",
      "name": "Blue Conjoined Fatty",
      "hp": 86,
      "r": 22,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "blue-conjoined-fatty",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Blue Conjoined Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-fatty",
      "name": "Blue Fatty",
      "hp": 90,
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
      "sprite": "blue-fatty",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Blue Fatty stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-horf",
      "name": "Blue Horf",
      "hp": 62,
      "r": 28,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "blue-horf",
      "tint": "#919982",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Blue Horf stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-sucker",
      "name": "Blue Sucker",
      "hp": 66,
      "r": 16,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "blue-sucker",
      "tint": "#9c4350",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Blue Sucker stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blue-tumor",
      "name": "Blue Tumor",
      "hp": 70,
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
      "sprite": "blue-tumor",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Blue Tumor stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "black-leech",
      "name": "Black Leech",
      "hp": 74,
      "r": 22,
      "speed": 165,
      "dmg": 2,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "black-leech",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Black Leech stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "red-leech",
      "name": "Red Leech",
      "hp": 78,
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
      "sprite": "red-leech",
      "tint": "#919982",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Red Leech stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "soul-sucker",
      "name": "Soul Sucker",
      "hp": 82,
      "r": 28,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "soul-sucker",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Soul Sucker stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "evil-twin",
      "name": "Evil Twin",
      "hp": 86,
      "r": 16,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "spitter",
      "params": {
        "fireDelay": 1.8,
        "shotSpeed": 230,
        "burstCount": 3
      },
      "sprite": "evil-twin",
      "tint": "#d47783",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Evil Twin stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "begotten",
      "name": "Begotten",
      "hp": 90,
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
      "sprite": "begotten",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Begotten stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "the-thing",
      "name": "The Thing",
      "hp": 62,
      "r": 22,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "the-thing",
      "tint": "#566257",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "The Thing stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "mr-mine",
      "name": "Mr. Mine",
      "hp": 66,
      "r": 25,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "mr-mine",
      "tint": "#697368",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Mr. Mine stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "reaper",
      "name": "Reaper",
      "hp": 70,
      "r": 28,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "reaper",
      "tint": "#48534b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Reaper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "eternal-heart-fly",
      "name": "Eternal Heart Fly",
      "hp": 74,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "eternal-heart-fly",
      "tint": "#9c4350",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Eternal Heart Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "holy-keeper",
      "name": "Holy Keeper",
      "hp": 78,
      "r": 19,
      "speed": 90,
      "dmg": 2,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "holy-keeper",
      "tint": "#7e8876",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Holy Keeper stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "sloth",
      "name": "Sloth",
      "hp": 82,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "sloth",
      "tint": "#48534b",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Sloth stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-sloth",
      "name": "Super Sloth",
      "hp": 86,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "super-sloth",
      "tint": "#919982",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Super Sloth stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ultra-pride",
      "name": "Ultra Pride",
      "hp": 90,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "grid",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "ultra-pride",
      "tint": "#697368",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Ultra Pride stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "pride",
      "name": "Pride",
      "hp": 62,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "pride",
      "tint": "#7f3442",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Pride stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-pride",
      "name": "Super Pride",
      "hp": 66,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "super-pride",
      "tint": "#7e8876",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Super Pride stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "envy",
      "name": "Envy",
      "hp": 70,
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
      "sprite": "envy",
      "tint": "#697368",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Envy stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-envy",
      "name": "Super Envy",
      "hp": 74,
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
      "sprite": "super-envy",
      "tint": "#566257",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Super Envy stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "wrath",
      "name": "Wrath",
      "hp": 78,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "wrath",
      "tint": "#697368",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Wrath stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-wrath",
      "name": "Super Wrath",
      "hp": 82,
      "r": 16,
      "speed": 120,
      "dmg": 2,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "super-wrath",
      "tint": "#6c2d38",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Super Wrath stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gluttony",
      "name": "Gluttony",
      "hp": 86,
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
      "sprite": "gluttony",
      "tint": "#697368",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Gluttony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-gluttony",
      "name": "Super Gluttony",
      "hp": 90,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "super-gluttony",
      "tint": "#48534b",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "scarred-womb-2",
        "corpse",
        "corpse-2"
      ],
      "bestiary": "Super Gluttony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "greed",
      "name": "Greed",
      "hp": 62,
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
      "sprite": "greed",
      "tint": "#48534b",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse",
        "corpse-2",
        "blue-womb"
      ],
      "bestiary": "Greed stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-greed",
      "name": "Super Greed",
      "hp": 66,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "super-greed",
      "tint": "#919982",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "corpse-2",
        "blue-womb",
        "sheol"
      ],
      "bestiary": "Super Greed stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "lust",
      "name": "Lust",
      "hp": 70,
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
      "sprite": "lust",
      "tint": "#bd5969",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "womb-2",
        "utero-2",
        "scarred-womb-2"
      ],
      "bestiary": "Lust stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "super-lust",
      "name": "Super Lust",
      "hp": 74,
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
      "sprite": "super-lust",
      "tint": "#919982",
      "champion": false,
      "splitInto": null,
      "mini": true,
      "floors": [
        "utero-2",
        "scarred-womb-2",
        "corpse"
      ],
      "bestiary": "Super Lust stalks the ruined floors with a distinct and dangerous rhythm."
    }
  ])
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
