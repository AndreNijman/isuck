;(function (IS) {
  'use strict'

  IS.defineEnemies([
    {
      "id": "hive",
      "name": "Hive",
      "hp": 24,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "hive",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Hive stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "drowned-hive",
      "name": "Drowned Hive",
      "hp": 28,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "drowned-hive",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Drowned Hive stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "maggot",
      "name": "Maggot",
      "hp": 32,
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
      "sprite": "maggot",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Maggot stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "globin",
      "name": "Globin",
      "hp": 36,
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
      "sprite": "globin",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Globin stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "black-globin",
      "name": "Black Globin",
      "hp": 40,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "black-globin",
      "tint": "#b08055",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Black Globin stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gaping-maw",
      "name": "Gaping Maw",
      "hp": 44,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "gaping-maw",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Gaping Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "vis",
      "name": "Vis",
      "hp": 48,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "vis",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Vis stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "double-vis",
      "name": "Double Vis",
      "hp": 52,
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
      "sprite": "double-vis",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Double Vis stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "chubber",
      "name": "Chubber",
      "hp": 24,
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
      "sprite": "chubber",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Chubber stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "sack-of-sacks",
      "name": "Sack of Sacks",
      "hp": 28,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "sack-of-sacks",
      "tint": "#9b7048",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Sack of Sacks stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fat-sack",
      "name": "Fat Sack",
      "hp": 32,
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
      "sprite": "fat-sack",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Fat Sack stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "bony",
      "name": "Bony",
      "hp": 36,
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
      "sprite": "bony",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Bony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "black-bony",
      "name": "Black Bony",
      "hp": 40,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "black-bony",
      "tint": "#706966",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Black Bony stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "revenant",
      "name": "Revenant",
      "hp": 44,
      "r": 25,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "revenant",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Revenant stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "spiked-revenant",
      "name": "Spiked Revenant",
      "hp": 48,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "spiked-revenant",
      "tint": "#665f5a",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Spiked Revenant stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "homunculus",
      "name": "Homunculus",
      "hp": 52,
      "r": 16,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "homunculus",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Homunculus stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "tumor",
      "name": "Tumor",
      "hp": 24,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "tumor",
      "tint": "#706966",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Tumor stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "camillo-jr",
      "name": "Camillo Jr.",
      "hp": 28,
      "r": 22,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "camillo-jr",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Camillo Jr. stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "eternal-fly",
      "name": "Eternal Fly",
      "hp": 32,
      "r": 25,
      "speed": 135,
      "dmg": 1,
      "flying": true,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "eternal-fly",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Eternal Fly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "swarmer",
      "name": "Swarmer",
      "hp": 36,
      "r": 28,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "grid",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "swarmer",
      "tint": "#776d64",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Swarmer stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "boil",
      "name": "Boil",
      "hp": 40,
      "r": 16,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "boil",
      "tint": "#706966",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Boil stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gut",
      "name": "Gut",
      "hp": 44,
      "r": 19,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "gut",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Gut stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "sack",
      "name": "Sack",
      "hp": 48,
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
      "sprite": "sack",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Sack stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "rock-spider",
      "name": "Rock Spider",
      "hp": 52,
      "r": 25,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "rock-spider",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Rock Spider stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "tinted-rock-spider",
      "name": "Tinted Rock Spider",
      "hp": 24,
      "r": 28,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "tinted-rock-spider",
      "tint": "#776d64",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Tinted Rock Spider stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "roundy",
      "name": "Roundy",
      "hp": 28,
      "r": 16,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "leaper",
      "params": {
        "hopHeight": 70,
        "hopDelay": 1.4
      },
      "sprite": "roundy",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Roundy stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "blind-creep",
      "name": "Blind Creep",
      "hp": 32,
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
      "sprite": "blind-creep",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Blind Creep stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "wall-creep",
      "name": "Wall Creep",
      "hp": 36,
      "r": 22,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "splitter",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "wall-creep",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Wall Creep stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "rage-creep",
      "name": "Rage Creep",
      "hp": 40,
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
      "sprite": "rage-creep",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Rage Creep stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "nest",
      "name": "Nest",
      "hp": 44,
      "r": 28,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "summoner",
      "params": {
        "fireDelay": 3.2,
        "spawnCap": 3,
        "spawns": "attackfly"
      },
      "sprite": "nest",
      "tint": "#665f5a",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Nest stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ministro",
      "name": "Ministro",
      "hp": 48,
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
      "sprite": "ministro",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Ministro stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "fissure",
      "name": "Fissure",
      "hp": 52,
      "r": 19,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "fissure",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Fissure stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "poly",
      "name": "Poly",
      "hp": 24,
      "r": 22,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "poly",
      "tint": "#706966",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Poly stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "grudge",
      "name": "Grudge",
      "hp": 28,
      "r": 25,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "wallHugger",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "grudge",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Grudge stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ash-pile",
      "name": "Ash Pile",
      "hp": 32,
      "r": 28,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "ghost",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "ash-pile",
      "tint": "#665f5a",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Ash Pile stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "cinder",
      "name": "Cinder",
      "hp": 36,
      "r": 16,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "exploder",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "cinder",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Cinder stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "molten-baby",
      "name": "Molten Baby",
      "hp": 40,
      "r": 19,
      "speed": 90,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerChase",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "molten-baby",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Molten Baby stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "coal-boy",
      "name": "Coal Boy",
      "hp": 44,
      "r": 22,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "spinner",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "coal-boy",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Coal Boy stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "faceless",
      "name": "Faceless",
      "hp": 48,
      "r": 25,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "trailLayer",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "faceless",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Faceless stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "stonehead",
      "name": "Stonehead",
      "hp": 52,
      "r": 28,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "stonehead",
      "tint": "#665f5a",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Stonehead stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "ball-and-chain",
      "name": "Ball and Chain",
      "hp": 24,
      "r": 16,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "chaser",
      "params": {
        "accel": 650,
        "jitter": 0.16
      },
      "sprite": "ball-and-chain",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Ball and Chain stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "walking-boil",
      "name": "Walking Boil",
      "hp": 28,
      "r": 19,
      "speed": 165,
      "dmg": 1,
      "flying": false,
      "archetype": "wanderer",
      "params": {
        "turnDelay": 1.2,
        "speed": 100
      },
      "sprite": "walking-boil",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Walking Boil stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "gurgling",
      "name": "Gurgling",
      "hp": 32,
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
      "sprite": "gurgling",
      "tint": "#5f5957",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Gurgling stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "oob",
      "name": "Oob",
      "hp": 36,
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
      "sprite": "oob",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Oob stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "black-maw",
      "name": "Black Maw",
      "hp": 40,
      "r": 28,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "flyerDrift",
      "params": {
        "accel": 520,
        "drift": 0.3
      },
      "sprite": "black-maw",
      "tint": "#9b7048",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Black Maw stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "cod-worm",
      "name": "Cod Worm",
      "hp": 44,
      "r": 16,
      "speed": 120,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "cod-worm",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Cod Worm stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "needle",
      "name": "Needle",
      "hp": 48,
      "r": 19,
      "speed": 135,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "needle",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Needle stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "tainted-round-worm",
      "name": "Tainted Round Worm",
      "hp": 52,
      "r": 22,
      "speed": 150,
      "dmg": 1,
      "flying": false,
      "archetype": "burrower",
      "params": {
        "submergeTime": 1.3,
        "speed": 180
      },
      "sprite": "tainted-round-worm",
      "tint": "#706966",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "flooded-caves",
        "caves-2",
        "catacombs-2"
      ],
      "bestiary": "Tainted Round Worm stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "prey",
      "name": "Prey",
      "hp": 24,
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
      "sprite": "prey",
      "tint": "#b27768",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves-2",
        "catacombs-2",
        "flooded-caves-2"
      ],
      "bestiary": "Prey stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "dust",
      "name": "Dust",
      "hp": 28,
      "r": 28,
      "speed": 75,
      "dmg": 1,
      "flying": false,
      "archetype": "shielded",
      "params": {
        "speed": 120,
        "fireDelay": 2
      },
      "sprite": "dust",
      "tint": "#b08055",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs-2",
        "flooded-caves-2",
        "mines"
      ],
      "bestiary": "Dust stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "bishop",
      "name": "Bishop",
      "hp": 32,
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
      "sprite": "bishop",
      "tint": "#8c817b",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "caves",
        "catacombs",
        "flooded-caves"
      ],
      "bestiary": "Bishop stalks the ruined floors with a distinct and dangerous rhythm."
    },
    {
      "id": "quake-grimace",
      "name": "Quake Grimace",
      "hp": 36,
      "r": 19,
      "speed": 105,
      "dmg": 1,
      "flying": false,
      "archetype": "shooter",
      "params": {
        "fireDelay": 1.7,
        "shotSpeed": 260,
        "burstCount": 1
      },
      "sprite": "quake-grimace",
      "tint": "#a75e55",
      "champion": true,
      "splitInto": null,
      "mini": false,
      "floors": [
        "catacombs",
        "flooded-caves",
        "caves-2"
      ],
      "bestiary": "Quake Grimace stalks the ruined floors with a distinct and dangerous rhythm."
    }
  ])
})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
