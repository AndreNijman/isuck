;(function (IS) {
  'use strict'
  IS.defineAchievements(  [
    {
      "id": "ach-magdalene",
      "num": 1,
      "name": "Magdalene",
      "kind": "character",
      "unlocks": {
        "character": "magdalene"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "metric": "red-heart-containers",
        "value": 7
      },
      "desc": "Have 7 or more Red Heart Containers at one time"
    },
    {
      "id": "ach-cain",
      "num": 2,
      "name": "Cain",
      "kind": "character",
      "unlocks": {
        "character": "cain"
      },
      "condition": {
        "type": "coins-in-run",
        "value": 55
      },
      "desc": "Hold 55 Coins at one time"
    },
    {
      "id": "ach-judas",
      "num": 3,
      "name": "Judas",
      "kind": "character",
      "unlocks": {
        "character": "judas"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "satan"
      },
      "desc": "Defeat Satan"
    },
    {
      "id": "ach-the-womb",
      "num": 4,
      "name": "The Womb",
      "kind": "floor",
      "unlocks": {
        "floor": "womb"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-the-harbingers",
      "num": 5,
      "name": "The Harbingers",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-harbingers"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-a-cube-of-meat",
      "num": 6,
      "name": "A Cube of Meat",
      "kind": "item",
      "unlocks": {
        "item": "cube-of-meat"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-the-book-of-revelations",
      "num": 7,
      "name": "The Book of Revelations",
      "kind": "item",
      "unlocks": {
        "item": "book-of-revelations"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "a-harbinger"
      },
      "desc": "Defeat a Harbinger"
    },
    {
      "id": "ach-a-noose",
      "num": 8,
      "name": "A Noose",
      "kind": "item",
      "unlocks": {
        "item": "transcendence"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 3 times"
    },
    {
      "id": "ach-the-nail",
      "num": 9,
      "name": "The Nail",
      "kind": "item",
      "unlocks": {
        "item": "the-nail"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Azazel"
    },
    {
      "id": "ach-a-quarter",
      "num": 10,
      "name": "A Quarter",
      "kind": "item",
      "unlocks": {
        "item": "a-quarter"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 8 times"
    },
    {
      "id": "ach-a-fetus-in-a-jar",
      "num": 11,
      "name": "A Fetus in a Jar",
      "kind": "item",
      "unlocks": {
        "item": "dr-fetus"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 9 times"
    },
    {
      "id": "ach-a-small-rock",
      "num": 12,
      "name": "A Small Rock",
      "kind": "item",
      "unlocks": {
        "item": "the-small-rock"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-100-tinted-rocks"
      },
      "desc": "Destroy 100 Tinted Rocks"
    },
    {
      "id": "ach-monstros-tooth",
      "num": 13,
      "name": "Monstro's Tooth",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "monstro-27s-tooth"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-1"
      },
      "desc": "Beat Chapter 1"
    },
    {
      "id": "ach-lil-chubby",
      "num": 14,
      "name": "Lil' Chubby",
      "kind": "item",
      "unlocks": {
        "item": "little-chubby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-2"
      },
      "desc": "Beat Chapter 2"
    },
    {
      "id": "ach-lokis-horns",
      "num": 15,
      "name": "Loki's Horns",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "loki-27s-horns"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "lokii"
      },
      "desc": "Defeat Lokii"
    },
    {
      "id": "ach-something-from-the-future",
      "num": 16,
      "name": "Something From The Future",
      "kind": "item",
      "unlocks": {
        "item": "steven"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-basement-40-times"
      },
      "desc": "Beat Basement 40 times"
    },
    {
      "id": "ach-something-cute",
      "num": 17,
      "name": "Something Cute",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "c-h-a-d"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-2-30-times"
      },
      "desc": "Beat Chapter 2 30 times"
    },
    {
      "id": "ach-something-sticky",
      "num": 18,
      "name": "Something Sticky",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "gish"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-3-20-times"
      },
      "desc": "Beat Chapter 3 20 times"
    },
    {
      "id": "ach-a-bandage",
      "num": 19,
      "name": "A Bandage",
      "kind": "item",
      "unlocks": {
        "item": "super-bandage"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "make-a-super-bandage-girl-by-picking-up-4-copies-of-ball-of-bandages-in-one-run-see-unlocking-super-meat-boy-and-amp-super-bandage-girl"
      },
      "desc": "Make a Super Bandage Girl by picking up 4 copies of Ball of Bandages in one run; see Unlocking Super Meat Boy &amp; Super Bandage Girl"
    },
    {
      "id": "ach-a-cross",
      "num": 20,
      "name": "A Cross",
      "kind": "item",
      "unlocks": {
        "item": "the-relic"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "magdalene"
      },
      "desc": "Defeat Isaac as Magdalene"
    },
    {
      "id": "ach-a-bag-of-pennies",
      "num": 21,
      "name": "A Bag of Pennies",
      "kind": "item",
      "unlocks": {
        "item": "sack-of-pennies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "cain"
      },
      "desc": "Defeat Isaac as Cain"
    },
    {
      "id": "ach-the-book-of-sin",
      "num": 22,
      "name": "The Book of Sin",
      "kind": "item",
      "unlocks": {
        "item": "the-book-of-sin"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "all-7-deadly-sins"
      },
      "desc": "Defeat all 7 Deadly Sins"
    },
    {
      "id": "ach-little-gish",
      "num": 23,
      "name": "Little Gish",
      "kind": "item",
      "unlocks": {
        "item": "little-gish"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "gish"
      },
      "desc": "Defeat Gish"
    },
    {
      "id": "ach-little-steven",
      "num": 24,
      "name": "Little Steven",
      "kind": "item",
      "unlocks": {
        "item": "little-steven"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "steven"
      },
      "desc": "Defeat Steven"
    },
    {
      "id": "ach-little-c-h-a-d",
      "num": 25,
      "name": "Little C.H.A.D.",
      "kind": "item",
      "unlocks": {
        "item": "little-c-h-a-d"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "c-h-a-d"
      },
      "desc": "Defeat C.H.A.D."
    },
    {
      "id": "ach-a-gamekid",
      "num": 26,
      "name": "A Gamekid",
      "kind": "item",
      "unlocks": {
        "item": "the-gamekid"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "visit-10-arcades"
      },
      "desc": "Visit 10 Arcades"
    },
    {
      "id": "ach-a-halo",
      "num": 27,
      "name": "A Halo",
      "kind": "item",
      "unlocks": {
        "item": "the-halo"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom-moms-heart-or-it-lives-using-the-bible"
      },
      "desc": "Defeat Mom, Mom's Heart, or It Lives! using The Bible"
    },
    {
      "id": "ach-mr-mega",
      "num": 28,
      "name": "Mr. Mega",
      "kind": "item",
      "unlocks": {
        "item": "mr-mega"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-10-tinted-rocks"
      },
      "desc": "Destroy 10 Tinted Rocks"
    },
    {
      "id": "ach-the-d6",
      "num": 29,
      "name": "The D6",
      "kind": "item",
      "unlocks": {
        "item": "the-d6"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": ""
      },
      "desc": "Defeat Isaac as ???"
    },
    {
      "id": "ach-the-scissors",
      "num": 30,
      "name": "The Scissors",
      "kind": "item",
      "unlocks": {
        "item": "scissors"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "die-100-times"
      },
      "desc": "Die 100 times"
    },
    {
      "id": "ach-the-parasite",
      "num": 31,
      "name": "The Parasite",
      "kind": "item",
      "unlocks": {
        "item": "the-parasite"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-any-2-of-the-following-items-in-a-single-run-bobs-rotten-head-dead-cat-crickets-head-and-tammys-head-any-2-items-that-have-the-dead-item-tag"
      },
      "desc": "Pick up any 2 of the following items in a single run: Bob's Rotten Head, Dead Cat, Cricket's Head, and Tammy's Head (any 2 items that have the \"dead\" item tag)"
    },
    {
      "id": "ach-",
      "num": 32,
      "name": "???",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "3f-3f-3f-character"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 10 times"
    },
    {
      "id": "ach-everything-is-terrible",
      "num": 33,
      "name": "Everything Is Terrible!!!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "everything-is-terrible"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 5 times"
    },
    {
      "id": "ach-it-lives",
      "num": 34,
      "name": "It Lives!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "it-lives"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 11 times"
    },
    {
      "id": "ach-moms-contact",
      "num": 35,
      "name": "Mom's Contact",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mom-27s-contacts"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Obtain three Yes Mother? items in one run"
    },
    {
      "id": "ach-the-necronomicon",
      "num": 36,
      "name": "The Necronomicon",
      "kind": "item",
      "unlocks": {
        "item": "the-necronomicon"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-xiii-death-4-times"
      },
      "desc": "Use XIII - Death 4 times"
    },
    {
      "id": "ach-basement-boy",
      "num": 37,
      "name": "Basement Boy",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "basement-boy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-1-without-taking-damage"
      },
      "desc": "Beat Chapter 1 without taking damage"
    },
    {
      "id": "ach-spelunker-boy",
      "num": 38,
      "name": "Spelunker Boy",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "spelunker-boy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-2-without-taking-damage"
      },
      "desc": "Beat Chapter 2 without taking damage"
    },
    {
      "id": "ach-dark-boy",
      "num": 39,
      "name": "Dark Boy",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dark-boy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-3-without-taking-damage"
      },
      "desc": "Beat Chapter 3 without taking damage"
    },
    {
      "id": "ach-mamas-boy",
      "num": 40,
      "name": "Mama's Boy",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mamas-boy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-4-without-taking-damage"
      },
      "desc": "Beat Chapter 4 without taking damage"
    },
    {
      "id": "ach-golden-god",
      "num": 41,
      "name": "Golden God!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "golden-god"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "and-the-lamb"
      },
      "desc": "Defeat ??? and The Lamb"
    },
    {
      "id": "ach-eve",
      "num": 42,
      "name": "Eve",
      "kind": "character",
      "unlocks": {
        "character": "eve"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "dont-pick-up-any-hearts-for-2-floors-in-a-row"
      },
      "desc": "Don't pick up any Hearts for 2 floors in a row"
    },
    {
      "id": "ach-moms-knife",
      "num": 43,
      "name": "Mom's Knife",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mom-27s-knife"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "isaac"
      },
      "desc": "Defeat Satan as Isaac"
    },
    {
      "id": "ach-the-razor",
      "num": 44,
      "name": "The Razor",
      "kind": "item",
      "unlocks": {
        "item": "razor-blade"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "eve"
      },
      "desc": "Defeat Satan as Eve"
    },
    {
      "id": "ach-guardian-angel",
      "num": 45,
      "name": "Guardian Angel",
      "kind": "item",
      "unlocks": {
        "item": "guardian-angel"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "magdalene"
      },
      "desc": "Defeat Satan as Magdalene"
    },
    {
      "id": "ach-a-bag-of-bombs",
      "num": 46,
      "name": "A Bag of Bombs",
      "kind": "item",
      "unlocks": {
        "item": "bomb-bag"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "cain"
      },
      "desc": "Defeat Satan as Cain"
    },
    {
      "id": "ach-demon-baby",
      "num": 47,
      "name": "Demon Baby",
      "kind": "item",
      "unlocks": {
        "item": "demon-baby"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "azazel"
      },
      "desc": "Defeat The Lamb as Azazel"
    },
    {
      "id": "ach-forget-me-now",
      "num": 48,
      "name": "Forget Me Now",
      "kind": "item",
      "unlocks": {
        "item": "forget-me-now"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": ""
      },
      "desc": "Defeat Satan as ???"
    },
    {
      "id": "ach-the-d20",
      "num": 49,
      "name": "The D20",
      "kind": "item",
      "unlocks": {
        "item": "d20"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "isaac"
      },
      "desc": "Defeat ??? as Isaac"
    },
    {
      "id": "ach-celtic-cross",
      "num": 50,
      "name": "Celtic Cross",
      "kind": "item",
      "unlocks": {
        "item": "celtic-cross"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "magdalene"
      },
      "desc": "Defeat ??? as Magdalene"
    },
    {
      "id": "ach-abel",
      "num": 51,
      "name": "Abel",
      "kind": "item",
      "unlocks": {
        "item": "abel"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "cain"
      },
      "desc": "Defeat The Lamb as Cain"
    },
    {
      "id": "ach-curved-horn",
      "num": 52,
      "name": "Curved Horn",
      "kind": "trinket",
      "unlocks": {
        "trinket": "curved-horn"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "judas"
      },
      "desc": "Defeat The Lamb as Judas"
    },
    {
      "id": "ach-sacrificial-dagger",
      "num": 53,
      "name": "Sacrificial Dagger",
      "kind": "item",
      "unlocks": {
        "item": "sacrificial-dagger"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "eve"
      },
      "desc": "Defeat ??? as Eve"
    },
    {
      "id": "ach-bloody-lust",
      "num": 54,
      "name": "Bloody Lust",
      "kind": "item",
      "unlocks": {
        "item": "bloody-lust"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "samson"
      },
      "desc": "Defeat Isaac as Samson"
    },
    {
      "id": "ach-blood-penny",
      "num": 55,
      "name": "Blood Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "bloody-penny"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "samson"
      },
      "desc": "Defeat ??? as Samson"
    },
    {
      "id": "ach-blood-rights",
      "num": 56,
      "name": "Blood Rights",
      "kind": "item",
      "unlocks": {
        "item": "blood-rights"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "samson"
      },
      "desc": "Defeat Satan as Samson"
    },
    {
      "id": "ach-the-polaroid",
      "num": 57,
      "name": "The Polaroid",
      "kind": "item",
      "unlocks": {
        "item": "the-polaroid"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "isaac"
      },
      "desc": "Defeat Isaac 5 times"
    },
    {
      "id": "ach-dads-key",
      "num": 58,
      "name": "Dad's Key",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dad-27s-key"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-both-key-pieces-from-the-angels-in-one-run"
      },
      "desc": "Pick up both Key Pieces from the Angels in one run"
    },
    {
      "id": "ach-blue-candle",
      "num": 59,
      "name": "Blue Candle",
      "kind": "item",
      "unlocks": {
        "item": "the-candle"
      },
      "condition": {
        "type": "donate",
        "value": 900
      },
      "desc": "Donate 900 coins to the Donation Machine"
    },
    {
      "id": "ach-burnt-penny",
      "num": 60,
      "name": "Burnt Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "burnt-penny"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-beans-challenge-13"
      },
      "desc": "Complete Beans! (challenge #13)"
    },
    {
      "id": "ach-lucky-toe",
      "num": 61,
      "name": "Lucky Toe",
      "kind": "trinket",
      "unlocks": {
        "trinket": "lucky-toe"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "blow-up-20-shopkeepers"
      },
      "desc": "Blow up 20 Shopkeepers"
    },
    {
      "id": "ach-epic-fetus",
      "num": 62,
      "name": "Epic Fetus",
      "kind": "item",
      "unlocks": {
        "item": "epic-fetus"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-the-family-man-challenge-19"
      },
      "desc": "Complete The Family Man (challenge #19)"
    },
    {
      "id": "ach-smb-super-fan",
      "num": 63,
      "name": "SMB Super Fan",
      "kind": "item",
      "unlocks": {
        "item": "smb-super-fan"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-its-in-the-cards-challenge-14"
      },
      "desc": "Complete It's in the Cards (challenge #14)"
    },
    {
      "id": "ach-counterfeit-coin",
      "num": 64,
      "name": "Counterfeit Coin",
      "kind": "trinket",
      "unlocks": {
        "trinket": "counterfeit-penny"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "play-either-shell-game-or-hell-game-100-times"
      },
      "desc": "Play either Shell Game or Hell Game 100 times"
    },
    {
      "id": "ach-guppys-hairball",
      "num": 65,
      "name": "Guppy's Hairball",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "guppy-27s-hair-ball"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "become-guppy"
      },
      "desc": "Become Guppy"
    },
    {
      "id": "ach-a-forgotten-horseman",
      "num": 66,
      "name": "A Forgotten Horseman",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "conquest"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "take-10-angel-room-items"
      },
      "desc": "Take 10 Angel Room items"
    },
    {
      "id": "ach-samson",
      "num": 67,
      "name": "Samson",
      "kind": "character",
      "unlocks": {
        "character": "samson"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-2-floors-in-a-row-without-taking-damage"
      },
      "desc": "Complete 2 floors in a row without taking damage"
    },
    {
      "id": "ach-something-icky",
      "num": 68,
      "name": "Something Icky",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "triachnid"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "isaac"
      },
      "desc": "Defeat Isaac 10 times"
    },
    {
      "id": "ach-platinum-god",
      "num": 69,
      "name": "Platinum God!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "platinum-god"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-all-non-dlc-items-in-the-game-and-unlock-all-of-the-secrets-and-endings-minus-the-lost-and-his-6-unlockable-items"
      },
      "desc": "Collect all non-DLC items in the game, and unlock all of the secrets and endings (minus The Lost and his 6 unlockable items)"
    },
    {
      "id": "ach-isaacs-head",
      "num": 70,
      "name": "Isaac's Head",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "isaac-27s-head"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Isaac"
    },
    {
      "id": "ach-maggys-faith",
      "num": 71,
      "name": "Maggy's Faith",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "maggy-27s-faith"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "magdalene"
      },
      "desc": "Defeat The Lamb as Magdalene"
    },
    {
      "id": "ach-judas-tongue",
      "num": 72,
      "name": "Judas' Tongue",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "judas-27-tongue"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "judas"
      },
      "desc": "Defeat Satan as Judas"
    },
    {
      "id": "ach-s-soul",
      "num": 73,
      "name": "???'s Soul",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "3f-3f-3f-27s-soul"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": ""
      },
      "desc": "Defeat The Lamb as ???"
    },
    {
      "id": "ach-samsons-lock",
      "num": 74,
      "name": "Samson's Lock",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "samson-27s-lock"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "samson"
      },
      "desc": "Defeat The Lamb as Samson"
    },
    {
      "id": "ach-cains-eye",
      "num": 75,
      "name": "Cain's Eye",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "cain-27s-eye"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "cain"
      },
      "desc": "Defeat ??? as Cain"
    },
    {
      "id": "ach-eves-bird-foot",
      "num": 76,
      "name": "Eve's Bird Foot",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "eve-27s-bird-foot"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "eve"
      },
      "desc": "Defeat Isaac as Eve"
    },
    {
      "id": "ach-the-left-hand",
      "num": 77,
      "name": "The Left Hand",
      "kind": "trinket",
      "unlocks": {
        "trinket": "the-left-hand"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-pride",
        "charId": "any-character-or-as-judas"
      },
      "desc": "Defeat Ultra Pride as any character, or ??? as Judas"
    },
    {
      "id": "ach-the-negative",
      "num": 78,
      "name": "The Negative",
      "kind": "item",
      "unlocks": {
        "item": "the-negative"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "satan"
      },
      "desc": "Defeat Satan 5 times"
    },
    {
      "id": "ach-azazel",
      "num": 79,
      "name": "Azazel",
      "kind": "character",
      "unlocks": {
        "character": "azazel"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "make-3-deals-with-the-devil-in-one-run"
      },
      "desc": "Make 3 Deals with the Devil in one run"
    },
    {
      "id": "ach-lazarus",
      "num": 80,
      "name": "Lazarus",
      "kind": "character",
      "unlocks": {
        "character": "lazarus"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "have-4-or-more-soul-hearts-at-one-time"
      },
      "desc": "Have 4 or more Soul Hearts at one time"
    },
    {
      "id": "ach-eden",
      "num": 81,
      "name": "Eden",
      "kind": "character",
      "unlocks": {
        "character": "eden"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-chapter-4"
      },
      "desc": "Complete Chapter 4"
    },
    {
      "id": "ach-the-lost",
      "num": 82,
      "name": "The Lost",
      "kind": "character",
      "unlocks": {
        "character": "the-lost"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "its-complicated-die-in-a-sacrifice-room-while-holding-missing-poster"
      },
      "desc": "It's complicated Die in a Sacrifice Room while holding Missing Poster"
    },
    {
      "id": "ach-dead-boy",
      "num": 83,
      "name": "Dead Boy",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dead-boy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-chapter-6-without-taking-damage"
      },
      "desc": "Complete Chapter 6 without taking damage"
    },
    {
      "id": "ach-the-real-platinum-god",
      "num": 84,
      "name": "The Real Platinum God",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-real-platinum-god"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-every-non-dlc-item-and-unlock-every-secret-and-ending"
      },
      "desc": "Collect every non-DLC item, and unlock every secret and ending."
    },
    {
      "id": "ach-lucky-rock",
      "num": 85,
      "name": "Lucky Rock",
      "kind": "trinket",
      "unlocks": {
        "trinket": "lucky-rock"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-100-rocks"
      },
      "desc": "Destroy 100 rocks"
    },
    {
      "id": "ach-the-cellar",
      "num": 86,
      "name": "The Cellar",
      "kind": "floor",
      "unlocks": {
        "floor": "cellar"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-all-basement-bosses-except-baby-plum-not-restricted-to-beating-bosses-in-the-basement"
      },
      "desc": "Beat all Basement bosses ( except Baby Plum) (not restricted to beating bosses in The Basement)"
    },
    {
      "id": "ach-the-catacombs",
      "num": 87,
      "name": "The Catacombs",
      "kind": "floor",
      "unlocks": {
        "floor": "catacombs"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-all-caves-bosses-except-bumbino-not-restricted-to-beating-bosses-in-the-caves"
      },
      "desc": "Beat all Caves bosses ( except Bumbino) (not restricted to beating bosses in The Caves)"
    },
    {
      "id": "ach-the-necropolis",
      "num": 88,
      "name": "The Necropolis",
      "kind": "floor",
      "unlocks": {
        "floor": "necropolis"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-all-depths-bosses-except-reap-creep-not-restricted-to-beating-bosses-in-the-depths"
      },
      "desc": "Beat all Depths bosses ( except Reap Creep) (not restricted to beating bosses in The Depths)"
    },
    {
      "id": "ach-rune-of-hagalaz",
      "num": 89,
      "name": "Rune of Hagalaz",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pitch-black-challenge-1"
      },
      "desc": "Complete Pitch Black (challenge #1)"
    },
    {
      "id": "ach-rune-of-jera",
      "num": 90,
      "name": "Rune of Jera",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-high-brow-challenge-2"
      },
      "desc": "Complete High Brow (challenge #2)"
    },
    {
      "id": "ach-rune-of-ehwaz",
      "num": 91,
      "name": "Rune of Ehwaz",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-head-trauma-challenge-3"
      },
      "desc": "Complete Head Trauma (challenge #3)"
    },
    {
      "id": "ach-rune-of-dagaz",
      "num": 92,
      "name": "Rune of Dagaz",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-darkness-falls-challenge-4"
      },
      "desc": "Complete Darkness Falls (challenge #4)"
    },
    {
      "id": "ach-rune-of-ansuz",
      "num": 93,
      "name": "Rune of Ansuz",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-the-tank-challenge-5"
      },
      "desc": "Complete The Tank (challenge #5)"
    },
    {
      "id": "ach-rune-of-perthro",
      "num": 94,
      "name": "Rune of Perthro",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-solar-system-challenge-6"
      },
      "desc": "Complete Solar System (challenge #6)"
    },
    {
      "id": "ach-rune-of-berkano",
      "num": 95,
      "name": "Rune of Berkano",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-purist-challenge-20"
      },
      "desc": "Complete Purist (challenge #20)"
    },
    {
      "id": "ach-rune-of-algiz",
      "num": 96,
      "name": "Rune of Algiz",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "runes"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-cat-got-your-tongue-challenge-8"
      },
      "desc": "Complete Cat Got Your Tongue (challenge #8)"
    },
    {
      "id": "ach-chaos-card",
      "num": 97,
      "name": "Chaos Card",
      "kind": "card",
      "unlocks": {
        "card": "chaos-card"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-demo-man-challenge-9"
      },
      "desc": "Complete Demo Man (challenge #9)"
    },
    {
      "id": "ach-credit-card",
      "num": 98,
      "name": "Credit Card",
      "kind": "card",
      "unlocks": {
        "card": "credit-card"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-cursed-challenge-10"
      },
      "desc": "Complete Cursed! (challenge #10)"
    },
    {
      "id": "ach-rules-card",
      "num": 99,
      "name": "Rules Card",
      "kind": "card",
      "unlocks": {
        "card": "rules-card"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-glass-cannon-challenge-11"
      },
      "desc": "Complete Glass Cannon (challenge #11)"
    },
    {
      "id": "ach-card-against-humanity",
      "num": 100,
      "name": "Card Against Humanity",
      "kind": "card",
      "unlocks": {
        "card": "a-card-against-humanity"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-when-life-gives-you-lemons-challenge-12"
      },
      "desc": "Complete When Life Gives You Lemons (challenge #12)"
    },
    {
      "id": "ach-swallowed-penny",
      "num": 101,
      "name": "Swallowed Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "swallowed-penny"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-slow-roll-challenge-15"
      },
      "desc": "Complete Slow Roll (challenge #15)"
    },
    {
      "id": "ach-robo-baby-2-0",
      "num": 102,
      "name": "Robo-Baby 2.0",
      "kind": "item",
      "unlocks": {
        "item": "robo-baby-2-0"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-computer-savvy-challenge-16"
      },
      "desc": "Complete Computer Savvy (challenge #16)"
    },
    {
      "id": "ach-deaths-touch",
      "num": 103,
      "name": "Death's Touch",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "death-27s-touch"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-waka-waka-challenge-17"
      },
      "desc": "Complete Waka Waka (challenge #17)"
    },
    {
      "id": "ach-technology-5",
      "num": 104,
      "name": "Technology .5",
      "kind": "item",
      "unlocks": {
        "item": "tech-5"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-the-host-challenge-18"
      },
      "desc": "Complete The Host (challenge #18)"
    },
    {
      "id": "ach-missing-no",
      "num": 105,
      "name": "Missing No.",
      "kind": "item",
      "unlocks": {
        "item": "missing-no"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Lazarus"
    },
    {
      "id": "ach-isaacs-tears",
      "num": 106,
      "name": "Isaac's Tears",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "isaac-27s-tears"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "isaac"
      },
      "desc": "Defeat Isaac as Isaac"
    },
    {
      "id": "ach-guillotine",
      "num": 107,
      "name": "Guillotine",
      "kind": "item",
      "unlocks": {
        "item": "guillotine"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "judas"
      },
      "desc": "Defeat Isaac as Judas"
    },
    {
      "id": "ach-judas-shadow",
      "num": 108,
      "name": "Judas' Shadow",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "judas-27-shadow"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Judas"
    },
    {
      "id": "ach-maggys-bow",
      "num": 109,
      "name": "Maggy's Bow",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "maggy-27s-bow"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Magdalene"
    },
    {
      "id": "ach-cains-other-eye",
      "num": 110,
      "name": "Cain's Other Eye",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "cain-27s-other-eye"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Cain"
    },
    {
      "id": "ach-black-lipstick",
      "num": 111,
      "name": "Black Lipstick",
      "kind": "trinket",
      "unlocks": {
        "trinket": "black-lipstick"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "eve"
      },
      "desc": "Defeat The Lamb as Eve"
    },
    {
      "id": "ach-eves-mascara",
      "num": 112,
      "name": "Eve's Mascara",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "eve-27s-mascara"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Eve"
    },
    {
      "id": "ach-fate",
      "num": 113,
      "name": "Fate",
      "kind": "item",
      "unlocks": {
        "item": "fate"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": ""
      },
      "desc": "Defeat ??? as ???"
    },
    {
      "id": "ach-s-only-friend",
      "num": 114,
      "name": "???'s Only Friend",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "3f-3f-3f-27s-only-friend"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as ???"
    },
    {
      "id": "ach-samsons-chains",
      "num": 115,
      "name": "Samson's Chains",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "samson-27s-chains"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Samson"
    },
    {
      "id": "ach-lazarus-rags",
      "num": 116,
      "name": "Lazarus' Rags",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "lazarus-27-rags"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "lazarus"
      },
      "desc": "Defeat Isaac as Lazarus"
    },
    {
      "id": "ach-broken-ankh",
      "num": 117,
      "name": "Broken Ankh",
      "kind": "trinket",
      "unlocks": {
        "trinket": "broken-ankh"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "lazarus"
      },
      "desc": "Defeat Satan as Lazarus"
    },
    {
      "id": "ach-store-credit",
      "num": 118,
      "name": "Store Credit",
      "kind": "trinket",
      "unlocks": {
        "trinket": "store-credit"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "lazarus"
      },
      "desc": "Defeat ??? as Lazarus"
    },
    {
      "id": "ach-pandoras-box",
      "num": 119,
      "name": "Pandora's Box",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "pandora-27s-box"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "lazarus"
      },
      "desc": "Defeat The Lamb as Lazarus"
    },
    {
      "id": "ach-suicide-king",
      "num": 120,
      "name": "Suicide King",
      "kind": "card",
      "unlocks": {
        "card": "suicide-king"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-suicide-king-challenge-7"
      },
      "desc": "Complete Suicide King (challenge #7)"
    },
    {
      "id": "ach-blank-card",
      "num": 121,
      "name": "Blank Card",
      "kind": "item",
      "unlocks": {
        "item": "blank-card"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "eden"
      },
      "desc": "Defeat Isaac as Eden"
    },
    {
      "id": "ach-book-of-secrets",
      "num": 122,
      "name": "Book of Secrets",
      "kind": "item",
      "unlocks": {
        "item": "book-of-secrets"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "eden"
      },
      "desc": "Defeat Satan as Eden"
    },
    {
      "id": "ach-mysterious-paper",
      "num": 123,
      "name": "Mysterious Paper",
      "kind": "trinket",
      "unlocks": {
        "trinket": "mysterious-paper"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-as-eden"
      },
      "desc": "Beat ??? as Eden"
    },
    {
      "id": "ach-mystery-sack",
      "num": 124,
      "name": "Mystery Sack",
      "kind": "item",
      "unlocks": {
        "item": "mystery-sack"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "eden"
      },
      "desc": "Defeat The Lamb as Eden"
    },
    {
      "id": "ach-undefined",
      "num": 125,
      "name": "Undefined",
      "kind": "item",
      "unlocks": {
        "item": "undefined"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Eden"
    },
    {
      "id": "ach-satanic-bible",
      "num": 126,
      "name": "Satanic Bible",
      "kind": "item",
      "unlocks": {
        "item": "satanic-bible"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "azazel"
      },
      "desc": "Defeat Isaac as Azazel"
    },
    {
      "id": "ach-daemons-tail",
      "num": 127,
      "name": "Daemon's Tail",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "daemon-27s-tail"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "azazel"
      },
      "desc": "Defeat Satan as Azazel"
    },
    {
      "id": "ach-abaddon",
      "num": 128,
      "name": "Abaddon",
      "kind": "item",
      "unlocks": {
        "item": "abaddon"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "azazel"
      },
      "desc": "Defeat ??? as Azazel"
    },
    {
      "id": "ach-isaacs-heart",
      "num": 129,
      "name": "Isaac's Heart",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "isaac-27s-heart"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "the-lost"
      },
      "desc": "Defeat Isaac as The Lost"
    },
    {
      "id": "ach-the-mind",
      "num": 130,
      "name": "The Mind",
      "kind": "item",
      "unlocks": {
        "item": "the-mind"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "the-lost"
      },
      "desc": "Defeat Satan as The Lost"
    },
    {
      "id": "ach-the-body",
      "num": 131,
      "name": "The Body",
      "kind": "item",
      "unlocks": {
        "item": "the-body"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "the-lost"
      },
      "desc": "Defeat ??? as The Lost"
    },
    {
      "id": "ach-the-soul",
      "num": 132,
      "name": "The Soul",
      "kind": "item",
      "unlocks": {
        "item": "the-soul"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "the-lost"
      },
      "desc": "Defeat The Lamb as The Lost"
    },
    {
      "id": "ach-the-d100",
      "num": 133,
      "name": "The D100",
      "kind": "item",
      "unlocks": {
        "item": "d100"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as The Lost"
    },
    {
      "id": "ach-blue-map",
      "num": 134,
      "name": "Blue Map",
      "kind": "item",
      "unlocks": {
        "item": "blue-map"
      },
      "condition": {
        "type": "donate",
        "value": 10
      },
      "desc": "Donate 10 Coins to the Donation Machine"
    },
    {
      "id": "ach-theres-options",
      "num": 135,
      "name": "There's Options",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "there-27s-options"
      },
      "condition": {
        "type": "donate",
        "value": 50
      },
      "desc": "Donate 50 Coins to the Donation Machine"
    },
    {
      "id": "ach-black-candle",
      "num": 136,
      "name": "Black Candle",
      "kind": "item",
      "unlocks": {
        "item": "black-candle"
      },
      "condition": {
        "type": "donate",
        "value": 150
      },
      "desc": "Donate 150 Coins to the Donation Machine"
    },
    {
      "id": "ach-red-candle",
      "num": 137,
      "name": "Red Candle",
      "kind": "item",
      "unlocks": {
        "item": "red-candle"
      },
      "condition": {
        "type": "donate",
        "value": 400
      },
      "desc": "Donate 400 Coins to the Donation Machine"
    },
    {
      "id": "ach-stop-watch",
      "num": 138,
      "name": "Stop Watch",
      "kind": "item",
      "unlocks": {
        "item": "stop-watch"
      },
      "condition": {
        "type": "donate",
        "value": 999
      },
      "desc": "Donate 999 Coins to the Donation Machine"
    },
    {
      "id": "ach-wire-coat-hanger",
      "num": 139,
      "name": "Wire Coat Hanger",
      "kind": "item",
      "unlocks": {
        "item": "wire-coat-hanger"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 4 times"
    },
    {
      "id": "ach-ipecac",
      "num": 140,
      "name": "Ipecac",
      "kind": "item",
      "unlocks": {
        "item": "ipecac"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 6 times"
    },
    {
      "id": "ach-experimental-treatment",
      "num": 141,
      "name": "Experimental Treatment",
      "kind": "item",
      "unlocks": {
        "item": "experimental-treatment"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 7 times"
    },
    {
      "id": "ach-krampus",
      "num": 142,
      "name": "Krampus",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "krampus"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "take-20-items-from-devil-rooms"
      },
      "desc": "Take 20 items from Devil Rooms"
    },
    {
      "id": "ach-head-of-krampus",
      "num": 143,
      "name": "Head of Krampus",
      "kind": "item",
      "unlocks": {
        "item": "head-of-krampus"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "krampus"
      },
      "desc": "Defeat Krampus"
    },
    {
      "id": "ach-super-meat-boy",
      "num": 144,
      "name": "Super Meat Boy",
      "kind": "item",
      "unlocks": {
        "item": "cube-of-meat"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "make-a-super-meat-boy-by-picking-up-4-copies-of-cube-of-meat-in-one-run-see-unlocking-super-meat-boy-and-amp-super-bandage-girl"
      },
      "desc": "Make a Super Meat Boy by picking up 4 copies of Cube of Meat in one run; see Unlocking Super Meat Boy &amp; Super Bandage Girl"
    },
    {
      "id": "ach-butter-bean",
      "num": 145,
      "name": "Butter Bean",
      "kind": "item",
      "unlocks": {
        "item": "butter-bean"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-100-poops"
      },
      "desc": "Destroy 100 Poops"
    },
    {
      "id": "ach-little-baggy",
      "num": 146,
      "name": "Little Baggy",
      "kind": "item",
      "unlocks": {
        "item": "little-baggy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-any-2-of-the-following-items-in-a-single-run-roid-rage-the-virus-growth-hormones-experimental-treatment-and-speed-ball-any-2-items-that-have-the-syringe-item-tag"
      },
      "desc": "Pick up any 2 of the following items in a single run: Roid Rage, The Virus, Growth Hormones, Experimental Treatment, and Speed Ball (any 2 items that have the \"syringe\" item tag)"
    },
    {
      "id": "ach-blood-bag",
      "num": 147,
      "name": "Blood Bag",
      "kind": "item",
      "unlocks": {
        "item": "blood-bag"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-the-blood-donation-machine-30-times"
      },
      "desc": "Use the Blood Donation Machine 30 times"
    },
    {
      "id": "ach-the-d4",
      "num": 148,
      "name": "The D4",
      "kind": "item",
      "unlocks": {
        "item": "d4"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "blow-up-30-slot-machine"
      },
      "desc": "Blow up 30 Slot Machine"
    },
    {
      "id": "ach-missing-poster",
      "num": 149,
      "name": "Missing Poster",
      "kind": "trinket",
      "unlocks": {
        "trinket": "missing-poster"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "isaac"
      },
      "desc": "Defeat The Lamb as Isaac"
    },
    {
      "id": "ach-rubber-cement",
      "num": 150,
      "name": "Rubber Cement",
      "kind": "item",
      "unlocks": {
        "item": "rubber-cement"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 2 times"
    },
    {
      "id": "ach-store-upgrade-lv-1",
      "num": 151,
      "name": "Store Upgrade lv.1",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "shop-levels"
      },
      "condition": {
        "type": "donate",
        "value": 20
      },
      "desc": "Donate 20 Coins to the Donation Machine"
    },
    {
      "id": "ach-store-upgrade-lv-2",
      "num": 152,
      "name": "Store Upgrade lv.2",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "shop-levels"
      },
      "condition": {
        "type": "donate",
        "value": 100
      },
      "desc": "Donate 100 Coins to the Donation Machine"
    },
    {
      "id": "ach-store-upgrade-lv-3",
      "num": 153,
      "name": "Store Upgrade lv.3",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "shop-levels"
      },
      "condition": {
        "type": "donate",
        "value": 200
      },
      "desc": "Donate 200 Coins to the Donation Machine"
    },
    {
      "id": "ach-store-upgrade-lv-4",
      "num": 154,
      "name": "Store Upgrade lv.4",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "shop-levels"
      },
      "condition": {
        "type": "donate",
        "value": 600
      },
      "desc": "Donate 600 Coins to the Donation Machine"
    },
    {
      "id": "ach-angels",
      "num": 155,
      "name": "Angels",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "angel"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-chapter-6"
      },
      "desc": "Complete Chapter 6"
    },
    {
      "id": "ach-godhead",
      "num": 156,
      "name": "Godhead",
      "kind": "item",
      "unlocks": {
        "item": "godhead"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-12-completion-marks-on-hard-mode-as-the-lost"
      },
      "desc": "Earn all 12 Completion Marks on Hard mode as The Lost"
    },
    {
      "id": "ach-darkness-falls",
      "num": 157,
      "name": "Darkness Falls",
      "kind": "challenge",
      "unlocks": {
        "challenge": "darkness-falls"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-11-times-defeat-satan-and",
        "charId": "eve"
      },
      "desc": "Defeat Mom's Heart 11 times Defeat Satan and ??? as Eve"
    },
    {
      "id": "ach-the-tank",
      "num": 158,
      "name": "The Tank",
      "kind": "challenge",
      "unlocks": {
        "challenge": "the-tank"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "metric": "red-heart-containers",
        "value": 7
      },
      "desc": "Have 7 or more Red Heart Containers at one time"
    },
    {
      "id": "ach-solar-system",
      "num": 159,
      "name": "Solar System",
      "kind": "challenge",
      "unlocks": {
        "challenge": "solar-system"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 3 times"
    },
    {
      "id": "ach-suicide-king-160",
      "num": 160,
      "name": "Suicide King",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "suicide-king-challenge"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 11 times"
    },
    {
      "id": "ach-cat-got-your-tongue",
      "num": 161,
      "name": "Cat Got Your Tongue",
      "kind": "challenge",
      "unlocks": {
        "challenge": "cat-got-your-tongue"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "become-guppy"
      },
      "desc": "Become Guppy"
    },
    {
      "id": "ach-demo-man",
      "num": 162,
      "name": "Demo Man",
      "kind": "challenge",
      "unlocks": {
        "challenge": "demo-man"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 9 times"
    },
    {
      "id": "ach-cursed",
      "num": 163,
      "name": "Cursed!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "cursed"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "metric": "red-heart-containers",
        "value": 7
      },
      "desc": "Have 7 or more Red Heart Containers at one time"
    },
    {
      "id": "ach-glass-cannon",
      "num": 164,
      "name": "Glass Cannon",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "glass-cannon-challenge"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "lokii"
      },
      "desc": "Beat The Family Man (challenge #19) and defeat Lokii"
    },
    {
      "id": "ach-the-family-man",
      "num": 165,
      "name": "The Family Man",
      "kind": "challenge",
      "unlocks": {
        "challenge": "the-family-man"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-both-key-pieces-from-the-angels-in-one-run"
      },
      "desc": "Pick up both Key Pieces from the Angels in one run"
    },
    {
      "id": "ach-purist",
      "num": 166,
      "name": "Purist",
      "kind": "challenge",
      "unlocks": {
        "challenge": "purist"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-lost-baby",
      "num": 167,
      "name": "Lost Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "isaac"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Isaac"
    },
    {
      "id": "ach-cute-baby",
      "num": 168,
      "name": "Cute Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "magdalene"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Magdalene"
    },
    {
      "id": "ach-crow-baby",
      "num": 169,
      "name": "Crow Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "eve"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Eve"
    },
    {
      "id": "ach-shadow-baby",
      "num": 170,
      "name": "Shadow Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "judas"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Judas"
    },
    {
      "id": "ach-glass-baby",
      "num": 171,
      "name": "Glass Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "cain"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Cain"
    },
    {
      "id": "ach-wrapped-baby",
      "num": 172,
      "name": "Wrapped Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "azazel-defeat-moms-heart-on-hard-mode-as-lazarus"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Azazel Defeat Mom's Heart on Hard mode as Lazarus"
    },
    {
      "id": "ach-begotten-baby",
      "num": 173,
      "name": "Begotten Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "lazarus-defeat-moms-heart-on-hard-mode-as-azazel"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Lazarus Defeat Mom's Heart on Hard mode as Azazel"
    },
    {
      "id": "ach-dead-baby",
      "num": 174,
      "name": "Dead Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": ""
      },
      "desc": "Defeat Mom's Heart on Hard mode as ???"
    },
    {
      "id": "ach-0-baby",
      "num": 175,
      "name": "-0- Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "the-lost"
      },
      "desc": "Defeat Mom's Heart on Hard mode as The Lost"
    },
    {
      "id": "ach-glitch-baby",
      "num": 176,
      "name": "Glitch Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "eden"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Eden"
    },
    {
      "id": "ach-fighting-baby",
      "num": 177,
      "name": "Fighting Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "babies"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "samson"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Samson"
    },
    {
      "id": "ach-lord-of-the-flies",
      "num": 178,
      "name": "Lord of the Flies",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "beelzebub"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "become-beelzebub"
      },
      "desc": "Become Beelzebub"
    },
    {
      "id": "ach-fart-baby",
      "num": 179,
      "name": "Fart Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "fart-baby"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Isaac"
    },
    {
      "id": "ach-purity",
      "num": 180,
      "name": "Purity",
      "kind": "item",
      "unlocks": {
        "item": "purity"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Magdalene"
    },
    {
      "id": "ach-d12",
      "num": 181,
      "name": "D12",
      "kind": "item",
      "unlocks": {
        "item": "d12"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Cain"
    },
    {
      "id": "ach-betrayal",
      "num": 182,
      "name": "Betrayal",
      "kind": "item",
      "unlocks": {
        "item": "betrayal"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Judas"
    },
    {
      "id": "ach-fates-reward",
      "num": 183,
      "name": "Fate's Reward",
      "kind": "item",
      "unlocks": {
        "item": "fates-reward"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as ???"
    },
    {
      "id": "ach-athame",
      "num": 184,
      "name": "Athame",
      "kind": "item",
      "unlocks": {
        "item": "athame"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Eve"
    },
    {
      "id": "ach-blind-rage",
      "num": 185,
      "name": "Blind Rage",
      "kind": "trinket",
      "unlocks": {
        "trinket": "blind-rage"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Samson"
    },
    {
      "id": "ach-maw-of-the-void",
      "num": 186,
      "name": "Maw of the Void",
      "kind": "item",
      "unlocks": {
        "item": "maw-of-the-void"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Azazel"
    },
    {
      "id": "ach-empty-vessel",
      "num": 187,
      "name": "Empty Vessel",
      "kind": "item",
      "unlocks": {
        "item": "empty-vessel"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Lazarus"
    },
    {
      "id": "ach-edens-blessing",
      "num": 188,
      "name": "Eden's Blessing",
      "kind": "item",
      "unlocks": {
        "item": "edens-blessing"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Eden"
    },
    {
      "id": "ach-sworn-protector",
      "num": 189,
      "name": "Sworn Protector",
      "kind": "item",
      "unlocks": {
        "item": "sworn-protector"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as The Lost"
    },
    {
      "id": "ach-incubus",
      "num": 190,
      "name": "Incubus",
      "kind": "item",
      "unlocks": {
        "item": "incubus"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Lilith"
    },
    {
      "id": "ach-keeper-now-holds-a-penny",
      "num": 191,
      "name": "Keeper now holds... A Penny!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "keeper-now-holds-a-penny"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Keeper"
    },
    {
      "id": "ach-lil-chest",
      "num": 192,
      "name": "Lil' Chest",
      "kind": "item",
      "unlocks": {
        "item": "lil-chest"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "isaac"
      },
      "desc": "Defeat Ultra Greed as Isaac"
    },
    {
      "id": "ach-censer",
      "num": 193,
      "name": "Censer",
      "kind": "item",
      "unlocks": {
        "item": "censer"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "magdalene"
      },
      "desc": "Defeat Ultra Greed as Magdalene"
    },
    {
      "id": "ach-evil-eye",
      "num": 194,
      "name": "Evil Eye",
      "kind": "item",
      "unlocks": {
        "item": "evil-eye"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "cain"
      },
      "desc": "Defeat Ultra Greed as Cain"
    },
    {
      "id": "ach-my-shadow",
      "num": 195,
      "name": "My Shadow",
      "kind": "item",
      "unlocks": {
        "item": "my-shadow"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "judas"
      },
      "desc": "Defeat Ultra Greed as Judas"
    },
    {
      "id": "ach-cracked-dice",
      "num": 196,
      "name": "Cracked Dice",
      "kind": "trinket",
      "unlocks": {
        "trinket": "cracked-dice"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": ""
      },
      "desc": "Defeat Ultra Greed as ???"
    },
    {
      "id": "ach-black-feather",
      "num": 197,
      "name": "Black Feather",
      "kind": "trinket",
      "unlocks": {
        "trinket": "black-feather"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "eve"
      },
      "desc": "Defeat Ultra Greed as Eve"
    },
    {
      "id": "ach-lusty-blood",
      "num": 198,
      "name": "Lusty Blood",
      "kind": "item",
      "unlocks": {
        "item": "lusty-blood"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "samson"
      },
      "desc": "Defeat Ultra Greed as Samson"
    },
    {
      "id": "ach-lilith",
      "num": 199,
      "name": "Lilith",
      "kind": "character",
      "unlocks": {
        "character": "lilith"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "azazel"
      },
      "desc": "Defeat Ultra Greed as Azazel"
    },
    {
      "id": "ach-key-bum",
      "num": 200,
      "name": "Key Bum",
      "kind": "item",
      "unlocks": {
        "item": "key-bum"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "lazarus"
      },
      "desc": "Defeat Ultra Greed as Lazarus"
    },
    {
      "id": "ach-gb-bug",
      "num": 201,
      "name": "GB Bug",
      "kind": "item",
      "unlocks": {
        "item": "gb-bug"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "eden"
      },
      "desc": "Defeat Ultra Greed as Eden"
    },
    {
      "id": "ach-zodiac",
      "num": 202,
      "name": "Zodiac",
      "kind": "item",
      "unlocks": {
        "item": "zodiac"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "the-lost"
      },
      "desc": "Defeat Ultra Greed as The Lost"
    },
    {
      "id": "ach-box-of-friends",
      "num": 203,
      "name": "Box of Friends",
      "kind": "item",
      "unlocks": {
        "item": "box-of-friends"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "lilith"
      },
      "desc": "Defeat Ultra Greed as Lilith"
    },
    {
      "id": "ach-rib-of-greed",
      "num": 204,
      "name": "Rib of Greed",
      "kind": "trinket",
      "unlocks": {
        "trinket": "rib-of-greed"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "keeper"
      },
      "desc": "Defeat Ultra Greed as Keeper"
    },
    {
      "id": "ach-cry-baby",
      "num": 205,
      "name": "Cry Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "cry-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Isaac"
    },
    {
      "id": "ach-red-baby",
      "num": 206,
      "name": "Red Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "red-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Magdalene"
    },
    {
      "id": "ach-green-baby",
      "num": 207,
      "name": "Green Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "green-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Cain"
    },
    {
      "id": "ach-brown-baby",
      "num": 208,
      "name": "Brown Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "brown-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Judas"
    },
    {
      "id": "ach-blue-baby",
      "num": 209,
      "name": "Blue Baby",
      "kind": "character",
      "unlocks": {
        "character": "blue-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as ???"
    },
    {
      "id": "ach-lil-baby",
      "num": 210,
      "name": "Lil' Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "lil-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Eve"
    },
    {
      "id": "ach-rage-baby",
      "num": 211,
      "name": "Rage Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "rage-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Samson"
    },
    {
      "id": "ach-black-baby",
      "num": 212,
      "name": "Black Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "black-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Azazel"
    },
    {
      "id": "ach-long-baby",
      "num": 213,
      "name": "Long Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "long-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Lazarus"
    },
    {
      "id": "ach-yellow-baby",
      "num": 214,
      "name": "Yellow Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "yellow-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Eden"
    },
    {
      "id": "ach-white-baby",
      "num": 215,
      "name": "White Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "white-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as The Lost"
    },
    {
      "id": "ach-big-baby",
      "num": 216,
      "name": "Big Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "big-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Lilith"
    },
    {
      "id": "ach-noose-baby",
      "num": 217,
      "name": "Noose Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "noose-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Keeper"
    },
    {
      "id": "ach-rune-bag",
      "num": 218,
      "name": "Rune Bag",
      "kind": "item",
      "unlocks": {
        "item": "rune-bag"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "lilith"
      },
      "desc": "Defeat Isaac as Lilith"
    },
    {
      "id": "ach-cambion-conception",
      "num": 219,
      "name": "Cambion Conception",
      "kind": "item",
      "unlocks": {
        "item": "cambion-conception"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "lilith"
      },
      "desc": "Defeat ??? as Lilith"
    },
    {
      "id": "ach-serpents-kiss",
      "num": 220,
      "name": "Serpent's Kiss",
      "kind": "item",
      "unlocks": {
        "item": "serpents-kiss"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "lilith"
      },
      "desc": "Defeat Satan as Lilith"
    },
    {
      "id": "ach-succubus",
      "num": 221,
      "name": "Succubus",
      "kind": "item",
      "unlocks": {
        "item": "succubus"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "lilith"
      },
      "desc": "Defeat The Lamb as Lilith"
    },
    {
      "id": "ach-immaculate-conception",
      "num": 222,
      "name": "Immaculate Conception",
      "kind": "item",
      "unlocks": {
        "item": "immaculate-conception"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Lilith"
    },
    {
      "id": "ach-goat-head-baby",
      "num": 223,
      "name": "Goat Head Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "goat-head-baby"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "lilith"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Lilith"
    },
    {
      "id": "ach-gold-heart",
      "num": 224,
      "name": "Gold Heart",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "gold-heart"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-xxxxxxxxl-challenge-21"
      },
      "desc": "Complete XXXXXXXXL (challenge #21)"
    },
    {
      "id": "ach-get-out-of-jail-free-card",
      "num": 225,
      "name": "Get out of Jail Free Card",
      "kind": "card",
      "unlocks": {
        "card": "get-out-of-jail-free-card"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-speed-challenge-22"
      },
      "desc": "Complete SPEED! (challenge #22)"
    },
    {
      "id": "ach-gold-bomb",
      "num": 226,
      "name": "Gold Bomb",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "gold-bomb"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-blue-bomber-challenge-23"
      },
      "desc": "Complete Blue Bomber (challenge #23)"
    },
    {
      "id": "ach-2-new-pills",
      "num": 227,
      "name": "2 new pills",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "2-new-pills"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pay-to-play-challenge-24"
      },
      "desc": "Complete PAY TO PLAY (challenge #24)"
    },
    {
      "id": "ach-2-new-pills-228",
      "num": 228,
      "name": "2 new pills",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "2-new-pills"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-have-a-heart-challenge-25"
      },
      "desc": "Complete Have a Heart (challenge #25)"
    },
    {
      "id": "ach-poker-chip",
      "num": 229,
      "name": "Poker Chip",
      "kind": "trinket",
      "unlocks": {
        "trinket": "poker-chip"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-i-rule-challenge-26"
      },
      "desc": "Complete I RULE! (challenge #26)"
    },
    {
      "id": "ach-stud-finder",
      "num": 230,
      "name": "Stud Finder",
      "kind": "trinket",
      "unlocks": {
        "trinket": "stud-finder"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-brains-challenge-27"
      },
      "desc": "Complete BRAINS! (challenge #27)"
    },
    {
      "id": "ach-d8",
      "num": 231,
      "name": "D8",
      "kind": "item",
      "unlocks": {
        "item": "d8"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pride-day-challenge-28"
      },
      "desc": "Complete PRIDE DAY! (challenge #28)"
    },
    {
      "id": "ach-kidney-stone",
      "num": 232,
      "name": "Kidney Stone",
      "kind": "item",
      "unlocks": {
        "item": "kidney-stone"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-the-guardian-challenge-30-complete-onans-streak-challenge-29"
      },
      "desc": "Complete The Guardian (challenge #30) Complete Onan's Streak (challenge #29)"
    },
    {
      "id": "ach-blank-rune",
      "num": 233,
      "name": "Blank Rune",
      "kind": "card",
      "unlocks": {
        "card": "blank-rune"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-onans-streak-challenge-29-complete-the-guardian-challenge-30"
      },
      "desc": "Complete Onan's Streak (challenge #29) Complete The Guardian (challenge #30)"
    },
    {
      "id": "ach-blue-womb",
      "num": 234,
      "name": "Blue Womb",
      "kind": "floor",
      "unlocks": {
        "floor": "blue-womb"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 10 times"
    },
    {
      "id": "ach-1001",
      "num": 235,
      "name": "1001%",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "1001"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-all-secrets-and-endings-and-collect-every-item-in-the-game"
      },
      "desc": "Unlock all secrets and endings, and collect every item in the game"
    },
    {
      "id": "ach-keeper-holds-wooden-nickel",
      "num": 236,
      "name": "Keeper holds Wooden Nickel",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "keeper-holds-wooden-nickel"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "keeper"
      },
      "desc": "Defeat Isaac as Keeper"
    },
    {
      "id": "ach-keeper-holds-store-key",
      "num": 237,
      "name": "Keeper holds Store Key",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "keeper-holds-store-key"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "keeper"
      },
      "desc": "Defeat Satan as Keeper"
    },
    {
      "id": "ach-deep-pockets",
      "num": 238,
      "name": "Deep Pockets",
      "kind": "item",
      "unlocks": {
        "item": "deep-pockets"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "keeper"
      },
      "desc": "Defeat ??? as Keeper"
    },
    {
      "id": "ach-karma",
      "num": 239,
      "name": "Karma",
      "kind": "trinket",
      "unlocks": {
        "trinket": "karma"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "keeper"
      },
      "desc": "Defeat The Lamb as Keeper"
    },
    {
      "id": "ach-sticky-nickels",
      "num": 240,
      "name": "Sticky Nickels",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "sticky-nickels"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Keeper"
    },
    {
      "id": "ach-super-greed-baby",
      "num": 241,
      "name": "Super Greed Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "super-greed-baby"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-on-hard-mode",
        "charId": "keeper"
      },
      "desc": "Defeat Mom's Heart on Hard mode as Keeper"
    },
    {
      "id": "ach-lucky-pennies",
      "num": 242,
      "name": "Lucky Pennies",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "lucky-pennies"
      },
      "condition": {
        "type": "donate-greed",
        "value": 1
      },
      "desc": "Donate 1 Coin to the Greed Donation Machine"
    },
    {
      "id": "ach-special-hanging-shopkeepers",
      "num": 243,
      "name": "Special Hanging Shopkeepers",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "special-hanging-shopkeepers"
      },
      "condition": {
        "type": "donate-greed",
        "value": 10
      },
      "desc": "Donate 10 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-wooden-nickel",
      "num": 244,
      "name": "Wooden Nickel",
      "kind": "item",
      "unlocks": {
        "item": "wooden-nickel"
      },
      "condition": {
        "type": "donate-greed",
        "value": 30
      },
      "desc": "Donate 30 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-cain-holds-paperclip",
      "num": 245,
      "name": "Cain holds Paperclip",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "cain-holds-paperclip"
      },
      "condition": {
        "type": "donate-greed",
        "value": 68
      },
      "desc": "Donate 68 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-everything-is-terrible-2",
      "num": 246,
      "name": "Everything is Terrible 2!!!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "everything-is-terrible-2"
      },
      "condition": {
        "type": "donate-greed",
        "value": 111
      },
      "desc": "Donate 111 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-special-shopkeepers",
      "num": 247,
      "name": "Special Shopkeepers",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "special-shopkeepers"
      },
      "condition": {
        "type": "donate-greed",
        "value": 234
      },
      "desc": "Donate 234 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-eve-now-holds-razor-blade",
      "num": 248,
      "name": "Eve now holds Razor Blade",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "eve-now-holds-razor-blade"
      },
      "condition": {
        "type": "donate-greed",
        "value": 439
      },
      "desc": "Donate 439 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-store-key",
      "num": 249,
      "name": "Store Key",
      "kind": "trinket",
      "unlocks": {
        "trinket": "store-key"
      },
      "condition": {
        "type": "donate-greed",
        "value": 666
      },
      "desc": "Donate 666 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-lost-holds-holy-mantle",
      "num": 250,
      "name": "Lost holds Holy Mantle",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "lost-holds-holy-mantle"
      },
      "condition": {
        "type": "donate-greed",
        "value": 879
      },
      "desc": "Donate 879 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-keeper",
      "num": 251,
      "name": "Keeper",
      "kind": "character",
      "unlocks": {
        "character": "keeper"
      },
      "condition": {
        "type": "donate-greed",
        "value": 1000
      },
      "desc": "Donate 1000 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-hive-baby",
      "num": 252,
      "name": "Hive Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "hive-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as"
      },
      "desc": "Earn all Hard mode Completion Marks as ???"
    },
    {
      "id": "ach-buddy-baby",
      "num": 253,
      "name": "Buddy Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "buddy-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-isaac"
      },
      "desc": "Earn all Hard mode Completion Marks as Isaac"
    },
    {
      "id": "ach-colorful-baby",
      "num": 254,
      "name": "Colorful Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "colorful-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-magdalene"
      },
      "desc": "Earn all Hard mode Completion Marks as Magdalene"
    },
    {
      "id": "ach-whore-baby",
      "num": 255,
      "name": "Whore Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "whore-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-eve"
      },
      "desc": "Earn all Hard mode Completion Marks as Eve"
    },
    {
      "id": "ach-cracked-baby",
      "num": 256,
      "name": "Cracked Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "cracked-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-eden"
      },
      "desc": "Earn all Hard mode Completion Marks as Eden"
    },
    {
      "id": "ach-dripping-baby",
      "num": 257,
      "name": "Dripping Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dripping-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-lazarus"
      },
      "desc": "Earn all Hard mode Completion Marks as Lazarus"
    },
    {
      "id": "ach-blinding-baby",
      "num": 258,
      "name": "Blinding Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "blinding-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-blank-card-while-holding-xix-the-sun"
      },
      "desc": "Use Blank Card while holding XIX - The Sun"
    },
    {
      "id": "ach-sucky-baby",
      "num": 259,
      "name": "Sucky Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "sucky-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-azazel"
      },
      "desc": "Earn all Hard mode Completion Marks as Azazel"
    },
    {
      "id": "ach-dark-baby",
      "num": 260,
      "name": "Dark Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dark-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-lilith"
      },
      "desc": "Earn all Hard mode Completion Marks as Lilith"
    },
    {
      "id": "ach-picky-baby",
      "num": 261,
      "name": "Picky Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "picky-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-cain"
      },
      "desc": "Earn all Hard mode Completion Marks as Cain"
    },
    {
      "id": "ach-revenge-baby",
      "num": 262,
      "name": "Revenge Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "revenge-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-samson"
      },
      "desc": "Earn all Hard mode Completion Marks as Samson"
    },
    {
      "id": "ach-belial-baby",
      "num": 263,
      "name": "Belial Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "belial-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-judas"
      },
      "desc": "Earn all Hard mode Completion Marks as Judas"
    },
    {
      "id": "ach-sale-baby",
      "num": 264,
      "name": "Sale Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "sale-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-keeper"
      },
      "desc": "Earn all Hard mode Completion Marks as Keeper"
    },
    {
      "id": "ach-xxxxxxxxl",
      "num": 265,
      "name": "XXXXXXXXL",
      "kind": "challenge",
      "unlocks": {
        "challenge": "xxxxxxxxl"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-speed",
      "num": 266,
      "name": "SPEED!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "speed"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-blue-bomber",
      "num": 267,
      "name": "Blue Bomber",
      "kind": "challenge",
      "unlocks": {
        "challenge": "blue-bomber"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Destroy 10 Tinted Rocks and defeat Mom's Heart 11 times"
    },
    {
      "id": "ach-pay-to-play",
      "num": 268,
      "name": "PAY TO PLAY",
      "kind": "item",
      "unlocks": {
        "item": "pay-to-play"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "cain"
      },
      "desc": "Defeat Isaac as Cain"
    },
    {
      "id": "ach-have-a-heart",
      "num": 269,
      "name": "Have a Heart",
      "kind": "challenge",
      "unlocks": {
        "challenge": "have-a-heart"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-i-rule",
      "num": 270,
      "name": "I RULE!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "i-rule"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat ??? or The Lamb, and defeat Satan as Isaac Defeat Mega Satan"
    },
    {
      "id": "ach-brains",
      "num": 271,
      "name": "BRAINS!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "brains"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "isaac"
      },
      "desc": "Defeat Isaac 5 times"
    },
    {
      "id": "ach-pride-day",
      "num": 272,
      "name": "PRIDE DAY!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "pride-day"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-onans-streak",
      "num": 273,
      "name": "Onan's Streak",
      "kind": "challenge",
      "unlocks": {
        "challenge": "onans-streak"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-the-guardian",
      "num": 274,
      "name": "The Guardian",
      "kind": "challenge",
      "unlocks": {
        "challenge": "the-guardian"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-generosity",
      "num": 275,
      "name": "Generosity",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "generosity"
      },
      "condition": {
        "type": "donate-greed",
        "value": 999
      },
      "desc": "Donate 999 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-mega",
      "num": 276,
      "name": "Mega",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mega"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as every character ( except Tainted characters)"
    },
    {
      "id": "ach-backasswards",
      "num": 277,
      "name": "Backasswards",
      "kind": "challenge",
      "unlocks": {
        "challenge": "backasswards"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat ??? or The Lamb Defeat Mega Satan"
    },
    {
      "id": "ach-aprils-fool",
      "num": 278,
      "name": "Aprils fool",
      "kind": "challenge",
      "unlocks": {
        "challenge": "aprils-fool"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "mom"
      },
      "desc": "Defeat Mom"
    },
    {
      "id": "ach-pokey-mans",
      "num": 279,
      "name": "Pokey Mans",
      "kind": "challenge",
      "unlocks": {
        "challenge": "pokey-mans"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 11 times"
    },
    {
      "id": "ach-ultra-hard",
      "num": 280,
      "name": "Ultra Hard",
      "kind": "challenge",
      "unlocks": {
        "challenge": "ultra-hard"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat ??? or The Lamb. Possession of The Polaroid / The Negative is required, barring getting to Dark Room through a Sacrifice Room. Defeat Mega Satan"
    },
    {
      "id": "ach-pong",
      "num": 281,
      "name": "PONG",
      "kind": "challenge",
      "unlocks": {
        "challenge": "pong"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "isaac"
      },
      "desc": "Defeat Isaac 5 times"
    },
    {
      "id": "ach-d-infinity",
      "num": 282,
      "name": "D Infinity",
      "kind": "item",
      "unlocks": {
        "item": "d-infinity"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Isaac"
    },
    {
      "id": "ach-eucharist",
      "num": 283,
      "name": "Eucharist",
      "kind": "item",
      "unlocks": {
        "item": "eucharist"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Magdalene"
    },
    {
      "id": "ach-silver-dollar",
      "num": 284,
      "name": "Silver Dollar",
      "kind": "trinket",
      "unlocks": {
        "trinket": "silver-dollar"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Cain"
    },
    {
      "id": "ach-shade",
      "num": 285,
      "name": "Shade",
      "kind": "item",
      "unlocks": {
        "item": "shade"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Judas"
    },
    {
      "id": "ach-king-baby",
      "num": 286,
      "name": "King Baby",
      "kind": "item",
      "unlocks": {
        "item": "king-baby"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as ???"
    },
    {
      "id": "ach-bloody-crown",
      "num": 287,
      "name": "Bloody Crown",
      "kind": "trinket",
      "unlocks": {
        "trinket": "bloody-crown"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Samson"
    },
    {
      "id": "ach-dull-razor",
      "num": 288,
      "name": "Dull Razor",
      "kind": "item",
      "unlocks": {
        "item": "dull-razor"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Eve"
    },
    {
      "id": "ach-edens-soul",
      "num": 289,
      "name": "Eden's Soul",
      "kind": "item",
      "unlocks": {
        "item": "edens-soul"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Eden"
    },
    {
      "id": "ach-dark-princes-crown",
      "num": 290,
      "name": "Dark Prince's Crown",
      "kind": "item",
      "unlocks": {
        "item": "dark-princes-crown"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Azazel"
    },
    {
      "id": "ach-compound-fracture",
      "num": 291,
      "name": "Compound Fracture",
      "kind": "item",
      "unlocks": {
        "item": "compound-fracture"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Lazarus"
    },
    {
      "id": "ach-euthanasia",
      "num": 292,
      "name": "Euthanasia",
      "kind": "item",
      "unlocks": {
        "item": "euthanasia"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Lilith"
    },
    {
      "id": "ach-holy-card",
      "num": 293,
      "name": "Holy Card",
      "kind": "card",
      "unlocks": {
        "card": "holy-card"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as The Lost"
    },
    {
      "id": "ach-crooked-penny",
      "num": 294,
      "name": "Crooked Penny",
      "kind": "item",
      "unlocks": {
        "item": "crooked-penny"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Keeper"
    },
    {
      "id": "ach-void",
      "num": 295,
      "name": "Void",
      "kind": "item",
      "unlocks": {
        "item": "void"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Apollyon"
    },
    {
      "id": "ach-d1",
      "num": 296,
      "name": "D1",
      "kind": "item",
      "unlocks": {
        "item": "d1"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "isaac"
      },
      "desc": "Defeat Ultra Greedier as Isaac"
    },
    {
      "id": "ach-glyph-of-balance",
      "num": 297,
      "name": "Glyph of Balance",
      "kind": "item",
      "unlocks": {
        "item": "glyph-of-balance"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "magdalene"
      },
      "desc": "Defeat Ultra Greedier as Magdalene"
    },
    {
      "id": "ach-sack-of-sacks",
      "num": 298,
      "name": "Sack of Sacks",
      "kind": "item",
      "unlocks": {
        "item": "sack-of-sacks"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "cain"
      },
      "desc": "Defeat Ultra Greedier as Cain"
    },
    {
      "id": "ach-eye-of-belial",
      "num": 299,
      "name": "Eye of Belial",
      "kind": "item",
      "unlocks": {
        "item": "eye-of-belial"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "judas"
      },
      "desc": "Defeat Ultra Greedier as Judas"
    },
    {
      "id": "ach-meconium",
      "num": 300,
      "name": "Meconium",
      "kind": "trinket",
      "unlocks": {
        "trinket": "meconium"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": ""
      },
      "desc": "Defeat Ultra Greedier as ???"
    },
    {
      "id": "ach-stem-cell",
      "num": 301,
      "name": "Stem Cell",
      "kind": "trinket",
      "unlocks": {
        "trinket": "stem-cell"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "samson"
      },
      "desc": "Defeat Ultra Greedier as Samson"
    },
    {
      "id": "ach-crow-heart",
      "num": 302,
      "name": "Crow Heart",
      "kind": "trinket",
      "unlocks": {
        "trinket": "crow-heart"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "eve"
      },
      "desc": "Defeat Ultra Greedier as Eve"
    },
    {
      "id": "ach-metronome",
      "num": 303,
      "name": "Metronome",
      "kind": "item",
      "unlocks": {
        "item": "metronome"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "eden"
      },
      "desc": "Defeat Ultra Greedier as Eden"
    },
    {
      "id": "ach-bat-wing",
      "num": 304,
      "name": "Bat Wing",
      "kind": "trinket",
      "unlocks": {
        "trinket": "bat-wing"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "azazel"
      },
      "desc": "Defeat Ultra Greedier as Azazel"
    },
    {
      "id": "ach-plan-c",
      "num": 305,
      "name": "Plan C",
      "kind": "item",
      "unlocks": {
        "item": "plan-c"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "lazarus"
      },
      "desc": "Defeat Ultra Greedier as Lazarus"
    },
    {
      "id": "ach-duality",
      "num": 306,
      "name": "Duality",
      "kind": "item",
      "unlocks": {
        "item": "duality"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "lilith"
      },
      "desc": "Defeat Ultra Greedier as Lilith"
    },
    {
      "id": "ach-dads-lost-coin",
      "num": 307,
      "name": "Dad's Lost Coin",
      "kind": "item",
      "unlocks": {
        "item": "dads-lost-coin"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "the-lost"
      },
      "desc": "Defeat Ultra Greedier as The Lost"
    },
    {
      "id": "ach-eye-of-greed",
      "num": 308,
      "name": "Eye of Greed",
      "kind": "item",
      "unlocks": {
        "item": "eye-of-greed"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "keeper"
      },
      "desc": "Defeat Ultra Greedier as Keeper"
    },
    {
      "id": "ach-black-rune",
      "num": 309,
      "name": "Black Rune",
      "kind": "card",
      "unlocks": {
        "card": "black-rune"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "apollyon"
      },
      "desc": "Defeat Ultra Greedier as Apollyon"
    },
    {
      "id": "ach-locust-of-wrath",
      "num": 310,
      "name": "Locust of Wrath",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "locust-of-wrath"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "apollyon"
      },
      "desc": "Defeat Isaac as Apollyon"
    },
    {
      "id": "ach-locust-of-pestilence",
      "num": 311,
      "name": "Locust of Pestilence",
      "kind": "trinket",
      "unlocks": {
        "trinket": "locust-of-pestilence"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "apollyon"
      },
      "desc": "Defeat Satan as Apollyon"
    },
    {
      "id": "ach-locust-of-famine",
      "num": 312,
      "name": "Locust of Famine",
      "kind": "trinket",
      "unlocks": {
        "trinket": "locust-of-famine"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "apollyon"
      },
      "desc": "Defeat ??? as Apollyon"
    },
    {
      "id": "ach-locust-of-death",
      "num": 313,
      "name": "Locust of Death",
      "kind": "trinket",
      "unlocks": {
        "trinket": "locust-of-death"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "apollyon"
      },
      "desc": "Defeat The Lamb as Apollyon"
    },
    {
      "id": "ach-locust-of-conquest",
      "num": 314,
      "name": "Locust of Conquest",
      "kind": "trinket",
      "unlocks": {
        "trinket": "locust-of-conquest"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Apollyon"
    },
    {
      "id": "ach-hushy",
      "num": 315,
      "name": "Hushy",
      "kind": "item",
      "unlocks": {
        "item": "hushy"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Apollyon"
    },
    {
      "id": "ach-brown-nugget",
      "num": 316,
      "name": "Brown Nugget",
      "kind": "item",
      "unlocks": {
        "item": "brown-nugget"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "apollyon"
      },
      "desc": "Defeat Ultra Greed as Apollyon"
    },
    {
      "id": "ach-mort-baby",
      "num": 317,
      "name": "Mort Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mort-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Apollyon"
    },
    {
      "id": "ach-smelter",
      "num": 318,
      "name": "Smelter",
      "kind": "item",
      "unlocks": {
        "item": "smelter"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-or-it-lives-on-hard-mode",
        "charId": "apollyon"
      },
      "desc": "Defeat Mom's Heart or It Lives! on Hard mode as Apollyon"
    },
    {
      "id": "ach-apollyon-baby",
      "num": 319,
      "name": "Apollyon Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "apollyon-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-apollyon"
      },
      "desc": "Earn all Hard mode Completion Marks as Apollyon"
    },
    {
      "id": "ach-new-area",
      "num": 320,
      "name": "New Area",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "new-area"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush"
    },
    {
      "id": "ach-once-more-with-feeling",
      "num": 321,
      "name": "Once More with Feeling!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "once-more-with-feeling"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-a-victory-lap-defeating-the-lamb"
      },
      "desc": "Complete a Victory Lap, defeating The Lamb"
    },
    {
      "id": "ach-hat-trick",
      "num": 322,
      "name": "Hat trick!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "hat-trick"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "get-a-3-win-streak"
      },
      "desc": "Get a 3-win streak"
    },
    {
      "id": "ach-5-nights-at-moms",
      "num": 323,
      "name": "5 Nights at Mom's",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "5-nights-at-moms"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "get-a-5-win-streak-3-win-streak-using-a-different-character-each-time"
      },
      "desc": "Get a 5-win streak ( 3-win streak), using a different character each time"
    },
    {
      "id": "ach-sin-collector",
      "num": 324,
      "name": "Sin collector",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "sin-collector"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-every-entry-in-the-bestiary-bugged-v190-mobs-that-dont-exist-in-the-bestiary-are-being-counted-this-allows-sin-collector-to-be-unlocked-without-a-complete-bestiary"
      },
      "desc": "Collect every entry in the Bestiary (bugged v190 - Mobs that don't exist in the bestiary are being counted. This allows Sin Collector to be unlocked without a complete bestiary)"
    },
    {
      "id": "ach-dedication",
      "num": 325,
      "name": "Dedication",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dedication"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "participate-in-31-daily-challenges-they-dont-have-to-be-consecutive-it-will-still-count-if-isaac-dies-in-the-first-room"
      },
      "desc": "Participate in 31 Daily Challenges (they don't have to be consecutive; it will still count if Isaac dies in the first room)"
    },
    {
      "id": "ach-zip",
      "num": 326,
      "name": "ZIP!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "zip"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "the-lamb-in-under-20-minutes"
      },
      "desc": "Defeat The Lamb in under 20 minutes"
    },
    {
      "id": "ach-its-the-key",
      "num": 327,
      "name": "It's the Key",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "its-the-key"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "the-lamb-without-taking-hearts-coins-or-bombs-through-the-entire-run"
      },
      "desc": "Defeat The Lamb without taking Hearts, Coins, or Bombs through the entire run"
    },
    {
      "id": "ach-mr-resetter",
      "num": 328,
      "name": "Mr. Resetter!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mr-resetter"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "reset-7-times-in-a-row"
      },
      "desc": "Reset 7 times in a row"
    },
    {
      "id": "ach-living-on-the-edge",
      "num": 329,
      "name": "Living on the edge",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "living-on-the-edge"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-a-chapter-floors-i-and-ii-after-basement-start-to-finish-with-only-half-a-heart-total-can-use-the-lost"
      },
      "desc": "Complete a Chapter (floors I and II) after Basement, start-to-finish, with only half a Heart total (can use The Lost)"
    },
    {
      "id": "ach-u-broke-it",
      "num": 330,
      "name": "U Broke It!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "u-broke-it"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "obtain-50-items-in-a-run-duplicate-passive-items-familiars-count-towards-the-total-e-g-multiple-breakfast"
      },
      "desc": "Obtain 50 items in a run (duplicate passive items/familiars count towards the total, e.g., multiple Breakfast)"
    },
    {
      "id": "ach-laz-bleeds-more",
      "num": 331,
      "name": "Laz Bleeds More!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "laz-bleeds-more"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-backasswards-challenge-31"
      },
      "desc": "Complete Backasswards (challenge #31)"
    },
    {
      "id": "ach-maggy-now-holds-a-pill",
      "num": 332,
      "name": "Maggy Now Holds a Pill!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "maggy-now-holds-a-pill"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-aprils-fool-challenge-32"
      },
      "desc": "Complete Aprils Fool (challenge #32)"
    },
    {
      "id": "ach-charged-key",
      "num": 333,
      "name": "Charged Key",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "charged-key"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pokey-mans-challenge-33"
      },
      "desc": "Complete Pokey Mans (challenge #33)"
    },
    {
      "id": "ach-samson-feels-healthy",
      "num": 334,
      "name": "Samson Feels Healthy!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "samson-feels-healthy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-ultra-hard-challenge-34"
      },
      "desc": "Complete Ultra Hard (challenge #34)"
    },
    {
      "id": "ach-greeds-gullet",
      "num": 335,
      "name": "Greed's Gullet",
      "kind": "item",
      "unlocks": {
        "item": "greeds-gullet"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pong-challenge-35"
      },
      "desc": "Complete Pong (challenge #35)"
    },
    {
      "id": "ach-the-marathon",
      "num": 336,
      "name": "The Marathon",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-marathon"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "get-a-5-win-streak-in-the-daily-challenges-isaac-must-have-a-score-above-0-on-the-score-screen"
      },
      "desc": "Get a 5-win streak in the Daily Challenges ( Isaac must have a score above 0 on the score screen)"
    },
    {
      "id": "ach-rerun",
      "num": 337,
      "name": "RERUN",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "rerun"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-3-victory-laps-and-start-a-4th"
      },
      "desc": "Complete 3 Victory Laps and start a 4th"
    },
    {
      "id": "ach-delirious",
      "num": 338,
      "name": "Delirious",
      "kind": "item",
      "unlocks": {
        "item": "delirious"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium"
    },
    {
      "id": "ach-1000000",
      "num": 339,
      "name": "1000000%",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "1000000"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-every-item-in-the-game-unlock-all-secrets-and-endings-and-complete-the-bestiary"
      },
      "desc": "Collect every item in the game, unlock all secrets and endings, and complete the Bestiary"
    },
    {
      "id": "ach-apollyon",
      "num": 340,
      "name": "Apollyon",
      "kind": "character",
      "unlocks": {
        "character": "apollyon"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan"
    },
    {
      "id": "ach-greedier",
      "num": 341,
      "name": "Greedier!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "greedier"
      },
      "condition": {
        "type": "donate-greed",
        "value": 500
      },
      "desc": "Donate 500 Coins to the Greed Donation Machine"
    },
    {
      "id": "ach-burning-basement",
      "num": 342,
      "name": "Burning Basement",
      "kind": "floor",
      "unlocks": {
        "floor": "burning-basement"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart"
      },
      "desc": "Defeat Mom's Heart 11 times"
    },
    {
      "id": "ach-flooded-caves",
      "num": 343,
      "name": "Flooded Caves",
      "kind": "floor",
      "unlocks": {
        "floor": "flooded-caves"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "it-lives"
      },
      "desc": "Defeat It Lives! 16 times"
    },
    {
      "id": "ach-dank-depths",
      "num": 344,
      "name": "Dank Depths",
      "kind": "floor",
      "unlocks": {
        "floor": "dank-depths"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "it-lives"
      },
      "desc": "Defeat It Lives! 21 times"
    },
    {
      "id": "ach-scarred-womb",
      "num": 345,
      "name": "Scarred Womb",
      "kind": "floor",
      "unlocks": {
        "floor": "scarred-womb"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "it-lives"
      },
      "desc": "Defeat It Lives! 30 times"
    },
    {
      "id": "ach-something-wicked-this-way-comes",
      "num": 346,
      "name": "Something wicked this way comes!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "something-wicked-this-way-comes"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "3-different-characters"
      },
      "desc": "Defeat ??? as 3 different Characters"
    },
    {
      "id": "ach-something-wicked-this-way-comes-347",
      "num": 347,
      "name": "Something wicked this way comes+!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "something-wicked-this-way-comes"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "6-different-characters"
      },
      "desc": "Defeat ??? as 6 different Characters"
    },
    {
      "id": "ach-the-gate-is-open",
      "num": 348,
      "name": "The gate is open!",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-gate-is-open"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "the-lamb"
      },
      "desc": "Defeat The Lamb"
    },
    {
      "id": "ach-black-hole",
      "num": 349,
      "name": "Black Hole",
      "kind": "item",
      "unlocks": {
        "item": "black-hole"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "20-portals"
      },
      "desc": "Defeat 20 Portals"
    },
    {
      "id": "ach-mystery-gift",
      "num": 350,
      "name": "Mystery Gift",
      "kind": "item",
      "unlocks": {
        "item": "mystery-gift"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-500-rocks"
      },
      "desc": "Destroy 500 rocks"
    },
    {
      "id": "ach-sprinkler",
      "num": 351,
      "name": "Sprinkler",
      "kind": "item",
      "unlocks": {
        "item": "sprinkler"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-1-without-taking-damage"
      },
      "desc": "Beat Chapter 1 without taking damage"
    },
    {
      "id": "ach-angry-fly",
      "num": 352,
      "name": "Angry Fly",
      "kind": "item",
      "unlocks": {
        "item": "angry-fly"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "become-beelzebub"
      },
      "desc": "Become Beelzebub"
    },
    {
      "id": "ach-bozo",
      "num": 353,
      "name": "Bozo",
      "kind": "item",
      "unlocks": {
        "item": "bozo"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "destroy-5-rainbow-poops"
      },
      "desc": "Destroy 5 rainbow poops"
    },
    {
      "id": "ach-broken-modem",
      "num": 354,
      "name": "Broken Modem",
      "kind": "item",
      "unlocks": {
        "item": "broken-modem"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-7-daily-challenges-by-touching-the-trophy-at-the-end"
      },
      "desc": "Complete 7 Daily Challenges (by touching the trophy at the end)"
    },
    {
      "id": "ach-buddy-in-a-box",
      "num": 355,
      "name": "Buddy in a Box",
      "kind": "item",
      "unlocks": {
        "item": "buddy-in-a-box"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-5-familiars-in-a-single-run"
      },
      "desc": "Pick up 5 familiars in a single run"
    },
    {
      "id": "ach-fast-bombs",
      "num": 356,
      "name": "Fast Bombs",
      "kind": "item",
      "unlocks": {
        "item": "fast-bombs"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "little-horn"
      },
      "desc": "Defeat Little Horn 20 times"
    },
    {
      "id": "ach-lil-delirium",
      "num": 357,
      "name": "Lil Delirium",
      "kind": "item",
      "unlocks": {
        "item": "lil-delirium"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium for the 1st time"
    },
    {
      "id": "ach-hairpin",
      "num": 358,
      "name": "Hairpin",
      "kind": "trinket",
      "unlocks": {
        "trinket": "hairpin"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "recharge-using-lil-batteries-20-times"
      },
      "desc": "Recharge using Lil' Batteries 20 times"
    },
    {
      "id": "ach-wooden-cross",
      "num": 359,
      "name": "Wooden Cross",
      "kind": "trinket",
      "unlocks": {
        "trinket": "wooden-cross"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "sleep-in-a-bed"
      },
      "desc": "Sleep in a bed"
    },
    {
      "id": "ach-butter",
      "num": 360,
      "name": "Butter!",
      "kind": "trinket",
      "unlocks": {
        "trinket": "butter"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-2-victory-laps-and-start-a-3rd"
      },
      "desc": "Complete 2 Victory Laps and start a 3rd"
    },
    {
      "id": "ach-huge-growth",
      "num": 361,
      "name": "Huge Growth",
      "kind": "card",
      "unlocks": {
        "card": "huge-growth"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "increase-in-size-5-times-in-a-single-run-via-magic-mushroom-one-makes-you-larger-pills-xi-strength-etc"
      },
      "desc": "Increase in size 5 times in a single run via Magic Mushroom, \"One Makes you Larger\" pills, XI - Strength, etc."
    },
    {
      "id": "ach-ancient-recall",
      "num": 362,
      "name": "Ancient Recall",
      "kind": "card",
      "unlocks": {
        "card": "ancient-recall"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-cards-and-runes-20-times"
      },
      "desc": "Use Cards and Runes 20 times"
    },
    {
      "id": "ach-era-walk",
      "num": 363,
      "name": "Era Walk",
      "kind": "card",
      "unlocks": {
        "card": "era-walk"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "have-both-the-broken-watch-and-the-stop-watch-unlocked"
      },
      "desc": "Have both the Broken Watch and the Stop Watch unlocked"
    },
    {
      "id": "ach-coupon",
      "num": 364,
      "name": "Coupon",
      "kind": "item",
      "unlocks": {
        "item": "coupon"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "purchase-anything-from-shops-devil-rooms-and-or-black-markets-50-times"
      },
      "desc": "Purchase anything from Shops, Devil Rooms, and/or Black Markets 50 times"
    },
    {
      "id": "ach-telekinesis",
      "num": 365,
      "name": "Telekinesis",
      "kind": "item",
      "unlocks": {
        "item": "telekinesis"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-2-without-taking-damage"
      },
      "desc": "Beat Chapter 2 without taking damage"
    },
    {
      "id": "ach-moving-box",
      "num": 366,
      "name": "Moving Box",
      "kind": "item",
      "unlocks": {
        "item": "moving-box"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-pandoras-box-in-dark-room"
      },
      "desc": "Use Pandora's Box in Dark Room"
    },
    {
      "id": "ach-jumper-cables",
      "num": 367,
      "name": "Jumper Cables",
      "kind": "item",
      "unlocks": {
        "item": "jumper-cables"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-any-2-of-the-following-items-trinkets-in-a-single-run-9-volt-the-battery-car-battery-aaa-battery-and-watch-battery-any-2-items-that-have-the-battery-item-tag"
      },
      "desc": "Pick up any 2 of the following items/trinkets in a single run: 9 Volt, The Battery, Car Battery, AAA Battery, and Watch Battery (any 2 items that have the \"battery\" item tag)"
    },
    {
      "id": "ach-leprosy",
      "num": 368,
      "name": "Leprosy",
      "kind": "item",
      "unlocks": {
        "item": "leprosy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-3-without-taking-damage"
      },
      "desc": "Beat Chapter 3 without taking damage"
    },
    {
      "id": "ach-technology-zero",
      "num": 369,
      "name": "Technology Zero",
      "kind": "item",
      "unlocks": {
        "item": "technology-zero"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "pick-up-any-2-technology-items-in-a-single-run-any-2-items-that-have-the-tech-item-tag"
      },
      "desc": "Pick up any 2 technology items in a single run (any 2 items that have the \"tech\" item tag)"
    },
    {
      "id": "ach-filigree-feather",
      "num": 370,
      "name": "Filigree Feather",
      "kind": "trinket",
      "unlocks": {
        "trinket": "filigree-feather"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "acquire-both-key-piece-1-and-key-piece-2"
      },
      "desc": "Acquire both Key Piece 1 and Key Piece 2"
    },
    {
      "id": "ach-mr-me",
      "num": 371,
      "name": "Mr. ME!",
      "kind": "item",
      "unlocks": {
        "item": "mr-me"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "open-20-locked-chests"
      },
      "desc": "Open 20 Locked Chests"
    },
    {
      "id": "ach-7-seals",
      "num": 372,
      "name": "7 Seals",
      "kind": "item",
      "unlocks": {
        "item": "7-seals"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "all-5-harbingers"
      },
      "desc": "Defeat all 5 Harbingers"
    },
    {
      "id": "ach-angelic-prism",
      "num": 373,
      "name": "Angelic Prism",
      "kind": "item",
      "unlocks": {
        "item": "angelic-prism"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "an-angel"
      },
      "desc": "Defeat an Angel 10 times"
    },
    {
      "id": "ach-pop",
      "num": 374,
      "name": "Pop!",
      "kind": "item",
      "unlocks": {
        "item": "pop"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "beat-chapter-4-without-taking-damage"
      },
      "desc": "Beat Chapter 4 without taking damage"
    },
    {
      "id": "ach-door-stop",
      "num": 375,
      "name": "Door Stop",
      "kind": "trinket",
      "unlocks": {
        "trinket": "door-stop"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "blow-up-doors-and-secret-room-walls-50-times"
      },
      "desc": "Blow up doors and Secret Room walls 50 times"
    },
    {
      "id": "ach-deaths-list",
      "num": 376,
      "name": "Death's List",
      "kind": "item",
      "unlocks": {
        "item": "deaths-list"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "take-25-deals-with-the-devil"
      },
      "desc": "Take 25 Deals with the Devil"
    },
    {
      "id": "ach-haemolacria",
      "num": 377,
      "name": "Haemolacria",
      "kind": "item",
      "unlocks": {
        "item": "haemolacria"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "acquire-blood-clot-10-times"
      },
      "desc": "Acquire Blood Clot 10 times"
    },
    {
      "id": "ach-lachryphagy",
      "num": 378,
      "name": "Lachryphagy",
      "kind": "item",
      "unlocks": {
        "item": "lachryphagy"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-10-tears-up-items-or-pills-in-one-run"
      },
      "desc": "Collect 10 \"Tears Up\" items or pills in one run"
    },
    {
      "id": "ach-schoolbag",
      "num": 379,
      "name": "Schoolbag",
      "kind": "item",
      "unlocks": {
        "item": "schoolbag"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "enter-every-shop-from-chapter-1-through-chapter-3-in-one-run"
      },
      "desc": "Enter every Shop from Chapter 1 through Chapter 3 in one run"
    },
    {
      "id": "ach-trisagion",
      "num": 380,
      "name": "Trisagion",
      "kind": "item",
      "unlocks": {
        "item": "trisagion"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "take-25-angel-rooms-items"
      },
      "desc": "Take 25 Angel Rooms items"
    },
    {
      "id": "ach-extension-cord",
      "num": 381,
      "name": "Extension Cord",
      "kind": "trinket",
      "unlocks": {
        "trinket": "extension-cord"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "have-the-battery-9-volt-and-car-battery-in-isaacs-collection"
      },
      "desc": "Have The Battery, 9 Volt, and Car Battery in Isaac's collection"
    },
    {
      "id": "ach-flat-stone",
      "num": 382,
      "name": "Flat Stone",
      "kind": "item",
      "unlocks": {
        "item": "flat-stone"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "acquire-rubber-cement-5-times"
      },
      "desc": "Acquire Rubber Cement 5 times"
    },
    {
      "id": "ach-sacrificial-altar",
      "num": 383,
      "name": "Sacrificial Altar",
      "kind": "item",
      "unlocks": {
        "item": "sacrificial-altar"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "take-50-deals-with-the-devil"
      },
      "desc": "Take 50 Deals with the Devil"
    },
    {
      "id": "ach-lil-spewer",
      "num": 384,
      "name": "Lil Spewer",
      "kind": "item",
      "unlocks": {
        "item": "lil-spewer"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "have-isaac-die-to-his-own-explosion-from-ipecac-bobs-rotten-head-or-a-horf-pill"
      },
      "desc": "Have Isaac die to his own explosion from Ipecac, Bob's Rotten Head, or a Horf! pill"
    },
    {
      "id": "ach-blanket",
      "num": 385,
      "name": "Blanket",
      "kind": "item",
      "unlocks": {
        "item": "blanket"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "sleep-in-10-beds"
      },
      "desc": "Sleep in 10 beds"
    },
    {
      "id": "ach-marbles",
      "num": 386,
      "name": "Marbles",
      "kind": "item",
      "unlocks": {
        "item": "marbles"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-5-gulp-pills-in-one-run-placebo-uses-count"
      },
      "desc": "Use 5 Gulp! pills in one run ( Placebo uses count)"
    },
    {
      "id": "ach-mystery-egg",
      "num": 387,
      "name": "Mystery Egg",
      "kind": "item",
      "unlocks": {
        "item": "mystery-egg"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "spawn-three-charmed-enemies-in-the-same-room"
      },
      "desc": "Spawn three charmed enemies in the same room"
    },
    {
      "id": "ach-rotten-penny",
      "num": 388,
      "name": "Rotten Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "rotten-penny"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "have-20-blue-flies-at-the-same-time"
      },
      "desc": "Have 20 Blue Flies at the same time"
    },
    {
      "id": "ach-baby-bender",
      "num": 389,
      "name": "Baby-Bender",
      "kind": "trinket",
      "unlocks": {
        "trinket": "baby-bender"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-i-the-magician-or-telepathy-for-dummies-while-already-having-homing-tears"
      },
      "desc": "Use I - The Magician or Telepathy for Dummies while already having homing tears"
    },
    {
      "id": "ach-the-forgotten",
      "num": 390,
      "name": "The Forgotten",
      "kind": "character",
      "unlocks": {
        "character": "the-forgotten"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "its-complicated"
      },
      "desc": "It's complicated"
    },
    {
      "id": "ach-bone-heart",
      "num": 391,
      "name": "Bone Heart",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "bone-heart"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "its-complicated"
      },
      "desc": "It's complicated"
    },
    {
      "id": "ach-marrow",
      "num": 392,
      "name": "Marrow",
      "kind": "item",
      "unlocks": {
        "item": "marrow"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-or-it-lives-on-hard-mode",
        "charId": "the-forgotten"
      },
      "desc": "Defeat Mom's Heart or It Lives! on Hard mode as The Forgotten"
    },
    {
      "id": "ach-slipped-rib",
      "num": 393,
      "name": "Slipped Rib",
      "kind": "item",
      "unlocks": {
        "item": "slipped-rib"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "the-forgotten"
      },
      "desc": "Defeat Isaac as The Forgotten"
    },
    {
      "id": "ach-pointy-rib",
      "num": 394,
      "name": "Pointy Rib",
      "kind": "item",
      "unlocks": {
        "item": "pointy-rib"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "the-forgotten"
      },
      "desc": "Defeat Satan as The Forgotten"
    },
    {
      "id": "ach-jaw-bone",
      "num": 395,
      "name": "Jaw Bone",
      "kind": "item",
      "unlocks": {
        "item": "jaw-bone"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "the-forgotten"
      },
      "desc": "Defeat ??? as The Forgotten"
    },
    {
      "id": "ach-brittle-bones",
      "num": 396,
      "name": "Brittle Bones",
      "kind": "item",
      "unlocks": {
        "item": "brittle-bones"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "the-forgotten"
      },
      "desc": "Defeat The Lamb as The Forgotten"
    },
    {
      "id": "ach-divorce-papers",
      "num": 397,
      "name": "Divorce Papers",
      "kind": "item",
      "unlocks": {
        "item": "divorce-papers"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as The Forgotten"
    },
    {
      "id": "ach-hallowed-ground",
      "num": 398,
      "name": "Hallowed Ground",
      "kind": "item",
      "unlocks": {
        "item": "hallowed-ground"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as The Forgotten"
    },
    {
      "id": "ach-finger-bone",
      "num": 399,
      "name": "Finger Bone",
      "kind": "trinket",
      "unlocks": {
        "trinket": "finger-bone"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "the-forgotten"
      },
      "desc": "Defeat Ultra Greed as The Forgotten"
    },
    {
      "id": "ach-dads-ring",
      "num": 400,
      "name": "Dad's Ring",
      "kind": "item",
      "unlocks": {
        "item": "dads-ring"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "the-forgotten"
      },
      "desc": "Defeat Ultra Greedier as The Forgotten"
    },
    {
      "id": "ach-book-of-the-dead",
      "num": 401,
      "name": "Book of the Dead",
      "kind": "item",
      "unlocks": {
        "item": "book-of-the-dead"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as The Forgotten"
    },
    {
      "id": "ach-bone-baby",
      "num": 402,
      "name": "Bone Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "bone-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-the-forgotten"
      },
      "desc": "Earn all Hard mode Completion Marks as The Forgotten"
    },
    {
      "id": "ach-bound-baby",
      "num": 403,
      "name": "Bound Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "bound-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as The Forgotten"
    },
    {
      "id": "ach-bethany",
      "num": 404,
      "name": "Bethany",
      "kind": "character",
      "unlocks": {
        "character": "bethany"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-it-lives-on-hard-mode",
        "charId": "lazarus-without-dying-at-all"
      },
      "desc": "Defeat Mom's Heart/It Lives! on hard mode as Lazarus, without dying at all"
    },
    {
      "id": "ach-jacob-and-esau",
      "num": 405,
      "name": "Jacob and Esau",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "jacob-and-esau"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother"
    },
    {
      "id": "ach-the-planetarium",
      "num": 406,
      "name": "The Planetarium",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-planetarium"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "collect-any-3-items-with-the-stars-item-tag-in-a-single-run"
      },
      "desc": "Collect any 3 items with the \"stars\" item tag in a single run"
    },
    {
      "id": "ach-a-secret-exit",
      "num": 407,
      "name": "A Secret Exit",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "a-secret-exit"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush 3 times"
    },
    {
      "id": "ach-forgotten-lullaby",
      "num": 408,
      "name": "Forgotten Lullaby",
      "kind": "trinket",
      "unlocks": {
        "trinket": "forgotten-lullaby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "blow-up-the-sirens-skull-after-defeating-her"
      },
      "desc": "Blow up The Siren's skull after defeating her"
    },
    {
      "id": "ach-fruity-plum",
      "num": 409,
      "name": "Fruity Plum",
      "kind": "item",
      "unlocks": {
        "item": "fruity-plum"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "baby-plum"
      },
      "desc": "Defeat Baby Plum 10 times"
    },
    {
      "id": "ach-plum-flute",
      "num": 410,
      "name": "Plum Flute",
      "kind": "item",
      "unlocks": {
        "item": "plum-flute"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "allow-baby-plum-to-escape-instead-of-defeating-her"
      },
      "desc": "Allow Baby Plum to escape instead of defeating her"
    },
    {
      "id": "ach-rotten-heart",
      "num": 411,
      "name": "Rotten Heart",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "rotten-heart"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "enter-corpse-for-the-first-time"
      },
      "desc": "Enter Corpse for the first time"
    },
    {
      "id": "ach-dross",
      "num": 412,
      "name": "Dross",
      "kind": "floor",
      "unlocks": {
        "floor": "dross"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "all-bosses-in-downpour"
      },
      "desc": "Defeat all bosses in Downpour"
    },
    {
      "id": "ach-ashpit",
      "num": 413,
      "name": "Ashpit",
      "kind": "floor",
      "unlocks": {
        "floor": "ashpit"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "all-bosses-in-mines"
      },
      "desc": "Defeat all bosses in Mines"
    },
    {
      "id": "ach-gehenna",
      "num": 414,
      "name": "Gehenna",
      "kind": "floor",
      "unlocks": {
        "floor": "gehenna"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "all-bosses-in-mausoleum"
      },
      "desc": "Defeat all bosses in Mausoleum"
    },
    {
      "id": "ach-red-key",
      "num": 415,
      "name": "Red Key",
      "kind": "item",
      "unlocks": {
        "item": "red-key"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "open-moms-chest-in-home"
      },
      "desc": "Open Mom's Chest in Home"
    },
    {
      "id": "ach-wisp-baby",
      "num": 416,
      "name": "Wisp Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "wisp-baby"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-or-it-lives-on-hard-mode",
        "charId": "bethany"
      },
      "desc": "Defeat Mom's Heart or It Lives! on Hard mode as Bethany"
    },
    {
      "id": "ach-book-of-virtues",
      "num": 417,
      "name": "Book of Virtues",
      "kind": "item",
      "unlocks": {
        "item": "book-of-virtues"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "bethany"
      },
      "desc": "Defeat Isaac as Bethany"
    },
    {
      "id": "ach-urn-of-souls",
      "num": 418,
      "name": "Urn of Souls",
      "kind": "item",
      "unlocks": {
        "item": "urn-of-souls"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "bethany"
      },
      "desc": "Defeat Satan as Bethany"
    },
    {
      "id": "ach-blessed-penny",
      "num": 419,
      "name": "Blessed Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "blessed-penny"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "bethany"
      },
      "desc": "Defeat ??? as Bethany"
    },
    {
      "id": "ach-alabaster-box",
      "num": 420,
      "name": "Alabaster Box",
      "kind": "item",
      "unlocks": {
        "item": "alabaster-box"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "bethany"
      },
      "desc": "Defeat The Lamb as Bethany"
    },
    {
      "id": "ach-beths-faith",
      "num": 421,
      "name": "Beth's Faith",
      "kind": "trinket",
      "unlocks": {
        "trinket": "beths-faith"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete the Boss Rush as Bethany"
    },
    {
      "id": "ach-soul-locket",
      "num": 422,
      "name": "Soul Locket",
      "kind": "item",
      "unlocks": {
        "item": "soul-locket"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "bethany"
      },
      "desc": "Defeat Ultra Greed as Bethany"
    },
    {
      "id": "ach-divine-intervention",
      "num": 423,
      "name": "Divine Intervention",
      "kind": "item",
      "unlocks": {
        "item": "divine-intervention"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Bethany"
    },
    {
      "id": "ach-vade-retro",
      "num": 424,
      "name": "Vade Retro",
      "kind": "item",
      "unlocks": {
        "item": "vade-retro"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "bethany"
      },
      "desc": "Defeat Ultra Greedier as Bethany"
    },
    {
      "id": "ach-star-of-bethlehem",
      "num": 425,
      "name": "Star of Bethlehem",
      "kind": "item",
      "unlocks": {
        "item": "star-of-bethlehem"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Bethany"
    },
    {
      "id": "ach-hope-baby",
      "num": 426,
      "name": "Hope Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "hope-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-bethany"
      },
      "desc": "Earn all Hard mode Completion Marks as Bethany"
    },
    {
      "id": "ach-glowing-baby",
      "num": 427,
      "name": "Glowing Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "glowing-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Bethany"
    },
    {
      "id": "ach-double-baby",
      "num": 428,
      "name": "Double Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "double-baby"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "moms-heart-or-it-lives-on-hard-mode",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat Mom's Heart or It Lives! on Hard mode as Jacob and Esau"
    },
    {
      "id": "ach-the-stairway",
      "num": 429,
      "name": "The Stairway",
      "kind": "item",
      "unlocks": {
        "item": "the-stairway"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat Isaac as Jacob and Esau"
    },
    {
      "id": "ach-red-stew",
      "num": 430,
      "name": "Red Stew",
      "kind": "item",
      "unlocks": {
        "item": "red-stew"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat Satan as Jacob and Esau"
    },
    {
      "id": "ach-birthright",
      "num": 431,
      "name": "Birthright",
      "kind": "item",
      "unlocks": {
        "item": "birthright"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat ??? as Jacob and Esau"
    },
    {
      "id": "ach-damocles",
      "num": 432,
      "name": "Damocles",
      "kind": "item",
      "unlocks": {
        "item": "damocles-656"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "the-lamb",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat The Lamb as Jacob and Esau"
    },
    {
      "id": "ach-rock-bottom",
      "num": 433,
      "name": "Rock Bottom",
      "kind": "item",
      "unlocks": {
        "item": "rock-bottom"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Complete Boss Rush as Jacob and Esau"
    },
    {
      "id": "ach-inner-child",
      "num": 434,
      "name": "Inner Child",
      "kind": "item",
      "unlocks": {
        "item": "inner-child"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greed",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat Ultra Greed as Jacob and Esau"
    },
    {
      "id": "ach-vanishing-twin",
      "num": 435,
      "name": "Vanishing Twin",
      "kind": "item",
      "unlocks": {
        "item": "vanishing-twin"
      },
      "condition": {
        "type": "beat-hush"
      },
      "desc": "Defeat Hush as Jacob and Esau"
    },
    {
      "id": "ach-genesis",
      "num": 436,
      "name": "Genesis",
      "kind": "item",
      "unlocks": {
        "item": "genesis"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "jacob-and-esau"
      },
      "desc": "Defeat Ultra Greedier as Jacob and Esau"
    },
    {
      "id": "ach-suplex",
      "num": 437,
      "name": "Suplex!",
      "kind": "item",
      "unlocks": {
        "item": "suplex"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Jacob and Esau"
    },
    {
      "id": "ach-solomons-baby",
      "num": 438,
      "name": "Solomon's Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "solomons-baby"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-as-jacob-and-esau"
      },
      "desc": "Earn all Hard mode Completion Marks as Jacob and Esau"
    },
    {
      "id": "ach-illusion-baby",
      "num": 439,
      "name": "Illusion Baby",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "illusion-baby"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Jacob and Esau"
    },
    {
      "id": "ach-meat-cleaver",
      "num": 440,
      "name": "Meat Cleaver",
      "kind": "item",
      "unlocks": {
        "item": "meat-cleaver"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Isaac"
    },
    {
      "id": "ach-options",
      "num": 441,
      "name": "Options?",
      "kind": "item",
      "unlocks": {
        "item": "options"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Isaac"
    },
    {
      "id": "ach-yuck-heart",
      "num": 442,
      "name": "Yuck Heart",
      "kind": "item",
      "unlocks": {
        "item": "yuck-heart"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Magdalene"
    },
    {
      "id": "ach-candy-heart",
      "num": 443,
      "name": "Candy Heart",
      "kind": "item",
      "unlocks": {
        "item": "candy-heart"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Magdalene"
    },
    {
      "id": "ach-guppys-eye",
      "num": 444,
      "name": "Guppy's Eye",
      "kind": "item",
      "unlocks": {
        "item": "guppys-eye"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Cain"
    },
    {
      "id": "ach-a-pound-of-flesh",
      "num": 445,
      "name": "A Pound of Flesh",
      "kind": "item",
      "unlocks": {
        "item": "a-pound-of-flesh"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Cain"
    },
    {
      "id": "ach-akeldama",
      "num": 446,
      "name": "Akeldama",
      "kind": "item",
      "unlocks": {
        "item": "akeldama"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Judas"
    },
    {
      "id": "ach-redemption",
      "num": 447,
      "name": "Redemption",
      "kind": "item",
      "unlocks": {
        "item": "redemption"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Judas"
    },
    {
      "id": "ach-eternal-d6",
      "num": 448,
      "name": "Eternal D6",
      "kind": "item",
      "unlocks": {
        "item": "eternal-d6"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as ???"
    },
    {
      "id": "ach-montezumas-revenge",
      "num": 449,
      "name": "Montezuma's Revenge",
      "kind": "item",
      "unlocks": {
        "item": "montezumas-revenge"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as ???"
    },
    {
      "id": "ach-bird-cage",
      "num": 450,
      "name": "Bird Cage",
      "kind": "item",
      "unlocks": {
        "item": "bird-cage"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Eve"
    },
    {
      "id": "ach-cracked-orb",
      "num": 451,
      "name": "Cracked Orb",
      "kind": "item",
      "unlocks": {
        "item": "cracked-orb"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Eve"
    },
    {
      "id": "ach-bloody-gust",
      "num": 452,
      "name": "Bloody Gust",
      "kind": "item",
      "unlocks": {
        "item": "bloody-gust"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Samson"
    },
    {
      "id": "ach-empty-heart",
      "num": 453,
      "name": "Empty Heart",
      "kind": "item",
      "unlocks": {
        "item": "empty-heart"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Samson"
    },
    {
      "id": "ach-devils-crown",
      "num": 454,
      "name": "Devil's Crown",
      "kind": "trinket",
      "unlocks": {
        "trinket": "devils-crown"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Azazel"
    },
    {
      "id": "ach-lil-abaddon",
      "num": 455,
      "name": "Lil Abaddon",
      "kind": "item",
      "unlocks": {
        "item": "lil-abaddon"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Azazel"
    },
    {
      "id": "ach-tinytoma",
      "num": 456,
      "name": "Tinytoma",
      "kind": "item",
      "unlocks": {
        "item": "tinytoma"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Lazarus"
    },
    {
      "id": "ach-astral-projection",
      "num": 457,
      "name": "Astral Projection",
      "kind": "item",
      "unlocks": {
        "item": "astral-projection"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Lazarus"
    },
    {
      "id": "ach-m",
      "num": 458,
      "name": "'M",
      "kind": "trinket",
      "unlocks": {
        "trinket": "m"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Eden"
    },
    {
      "id": "ach-everything-jar",
      "num": 459,
      "name": "Everything Jar",
      "kind": "item",
      "unlocks": {
        "item": "everything-jar"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Eden"
    },
    {
      "id": "ach-lost-soul",
      "num": 460,
      "name": "Lost Soul",
      "kind": "item",
      "unlocks": {
        "item": "lost-soul"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as The Lost"
    },
    {
      "id": "ach-hungry-soul",
      "num": 461,
      "name": "Hungry Soul",
      "kind": "item",
      "unlocks": {
        "item": "hungry-soul"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as The Lost"
    },
    {
      "id": "ach-blood-puppy",
      "num": 462,
      "name": "Blood Puppy",
      "kind": "item",
      "unlocks": {
        "item": "blood-puppy"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Lilith"
    },
    {
      "id": "ach-c-section",
      "num": 463,
      "name": "C Section",
      "kind": "item",
      "unlocks": {
        "item": "c-section"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Lilith"
    },
    {
      "id": "ach-keepers-sack",
      "num": 464,
      "name": "Keeper's Sack",
      "kind": "item",
      "unlocks": {
        "item": "keepers-sack"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Keeper"
    },
    {
      "id": "ach-keepers-box",
      "num": 465,
      "name": "Keeper's Box",
      "kind": "item",
      "unlocks": {
        "item": "keepers-box"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Keeper"
    },
    {
      "id": "ach-lil-portal",
      "num": 466,
      "name": "Lil Portal",
      "kind": "item",
      "unlocks": {
        "item": "lil-portal"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Apollyon"
    },
    {
      "id": "ach-worm-friend",
      "num": 467,
      "name": "Worm Friend",
      "kind": "item",
      "unlocks": {
        "item": "worm-friend"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Apollyon"
    },
    {
      "id": "ach-bone-spurs",
      "num": 468,
      "name": "Bone Spurs",
      "kind": "item",
      "unlocks": {
        "item": "bone-spurs"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as The Forgotten"
    },
    {
      "id": "ach-spirit-shackles",
      "num": 469,
      "name": "Spirit Shackles",
      "kind": "item",
      "unlocks": {
        "item": "spirit-shackles"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as The Forgotten"
    },
    {
      "id": "ach-revelation",
      "num": 470,
      "name": "Revelation",
      "kind": "item",
      "unlocks": {
        "item": "revelation"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Bethany"
    },
    {
      "id": "ach-jar-of-wisps",
      "num": 471,
      "name": "Jar of Wisps",
      "kind": "item",
      "unlocks": {
        "item": "jar-of-wisps"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Bethany"
    },
    {
      "id": "ach-magic-skin",
      "num": 472,
      "name": "Magic Skin",
      "kind": "item",
      "unlocks": {
        "item": "magic-skin"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Jacob and Esau"
    },
    {
      "id": "ach-friend-finder",
      "num": 473,
      "name": "Friend Finder",
      "kind": "item",
      "unlocks": {
        "item": "friend-finder"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Jacob and Esau"
    },
    {
      "id": "ach-the-broken",
      "num": 474,
      "name": "The Broken",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-broken"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-isaac"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Isaac"
    },
    {
      "id": "ach-the-dauntless",
      "num": 475,
      "name": "The Dauntless",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-dauntless"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-magdalene"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Magdalene"
    },
    {
      "id": "ach-the-hoarder",
      "num": 476,
      "name": "The Hoarder",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-hoarder"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-cain"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Cain"
    },
    {
      "id": "ach-the-deceiver",
      "num": 477,
      "name": "The Deceiver",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-deceiver"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-judas"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Judas"
    },
    {
      "id": "ach-the-soiled",
      "num": 478,
      "name": "The Soiled",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-soiled"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as ???"
    },
    {
      "id": "ach-the-curdled",
      "num": 479,
      "name": "The Curdled",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-curdled"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-eve"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Eve"
    },
    {
      "id": "ach-the-savage",
      "num": 480,
      "name": "The Savage",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-savage"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-samson"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Samson"
    },
    {
      "id": "ach-the-benighted",
      "num": 481,
      "name": "The Benighted",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-benighted"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-azazel"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Azazel"
    },
    {
      "id": "ach-the-enigma",
      "num": 482,
      "name": "The Enigma",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-enigma"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-lazarus"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Lazarus"
    },
    {
      "id": "ach-the-capricious",
      "num": 483,
      "name": "The Capricious",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-capricious"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-eden"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Eden"
    },
    {
      "id": "ach-the-baleful",
      "num": 484,
      "name": "The Baleful",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-baleful"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-the-lost"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as The Lost"
    },
    {
      "id": "ach-the-harlot",
      "num": 485,
      "name": "The Harlot",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-harlot"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-lilith"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Lilith"
    },
    {
      "id": "ach-the-miser",
      "num": 486,
      "name": "The Miser",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-miser"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-keeper"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Keeper"
    },
    {
      "id": "ach-the-empty",
      "num": 487,
      "name": "The Empty",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-empty"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-apollyon"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Apollyon"
    },
    {
      "id": "ach-the-fettered",
      "num": 488,
      "name": "The Fettered",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-fettered"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-the-forgotten"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as The Forgotten"
    },
    {
      "id": "ach-the-zealot",
      "num": 489,
      "name": "The Zealot",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-zealot"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-bethany"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Bethany"
    },
    {
      "id": "ach-the-deserter",
      "num": 490,
      "name": "The Deserter",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-deserter"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "use-red-key-etc-to-open-the-hidden-closet-in-home-as-jacob-and-esau"
      },
      "desc": "Use Red Key (etc.) to open the hidden closet in Home as Jacob and Esau"
    },
    {
      "id": "ach-glitched-crown",
      "num": 491,
      "name": "Glitched Crown",
      "kind": "item",
      "unlocks": {
        "item": "glitched-crown"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Isaac"
    },
    {
      "id": "ach-belly-jelly",
      "num": 492,
      "name": "Belly Jelly",
      "kind": "item",
      "unlocks": {
        "item": "belly-jelly"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Magdalene"
    },
    {
      "id": "ach-blue-key",
      "num": 493,
      "name": "Blue Key",
      "kind": "trinket",
      "unlocks": {
        "trinket": "blue-key"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Cain"
    },
    {
      "id": "ach-sanguine-bond",
      "num": 494,
      "name": "Sanguine Bond",
      "kind": "item",
      "unlocks": {
        "item": "sanguine-bond"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Judas"
    },
    {
      "id": "ach-the-swarm",
      "num": 495,
      "name": "The Swarm",
      "kind": "item",
      "unlocks": {
        "item": "the-swarm"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted&#160;???"
    },
    {
      "id": "ach-heartbreak",
      "num": 496,
      "name": "Heartbreak",
      "kind": "item",
      "unlocks": {
        "item": "heartbreak"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Eve"
    },
    {
      "id": "ach-larynx",
      "num": 497,
      "name": "Larynx",
      "kind": "item",
      "unlocks": {
        "item": "larynx"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Samson"
    },
    {
      "id": "ach-azazels-rage",
      "num": 498,
      "name": "Azazel's Rage",
      "kind": "item",
      "unlocks": {
        "item": "azazels-rage"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Azazel"
    },
    {
      "id": "ach-salvation",
      "num": 499,
      "name": "Salvation",
      "kind": "item",
      "unlocks": {
        "item": "salvation"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Lazarus"
    },
    {
      "id": "ach-tmtrainer",
      "num": 500,
      "name": "TMTRAINER",
      "kind": "item",
      "unlocks": {
        "item": "tmtrainer"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Eden"
    },
    {
      "id": "ach-sacred-orb",
      "num": 501,
      "name": "Sacred Orb",
      "kind": "item",
      "unlocks": {
        "item": "sacred-orb"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Lost"
    },
    {
      "id": "ach-twisted-pair",
      "num": 502,
      "name": "Twisted Pair",
      "kind": "item",
      "unlocks": {
        "item": "twisted-pair"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Lilith"
    },
    {
      "id": "ach-strawman",
      "num": 503,
      "name": "Strawman",
      "kind": "item",
      "unlocks": {
        "item": "strawman"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Keeper"
    },
    {
      "id": "ach-echo-chamber",
      "num": 504,
      "name": "Echo Chamber",
      "kind": "item",
      "unlocks": {
        "item": "echo-chamber"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Apollyon"
    },
    {
      "id": "ach-isaacs-tomb",
      "num": 505,
      "name": "Isaac's Tomb",
      "kind": "item",
      "unlocks": {
        "item": "isaacs-tomb"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Forgotten"
    },
    {
      "id": "ach-vengeful-spirit",
      "num": 506,
      "name": "Vengeful Spirit",
      "kind": "item",
      "unlocks": {
        "item": "vengeful-spirit"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Bethany"
    },
    {
      "id": "ach-esau-jr",
      "num": 507,
      "name": "Esau Jr.",
      "kind": "item",
      "unlocks": {
        "item": "esau-jr"
      },
      "condition": {
        "type": "beat-beast"
      },
      "desc": "Defeat The Beast as Tainted Jacob"
    },
    {
      "id": "ach-bloody-mary",
      "num": 508,
      "name": "Bloody Mary",
      "kind": "challenge",
      "unlocks": {
        "challenge": "bloody-mary"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-bethany-blood-bag-and-it-lives"
      },
      "desc": "Unlock Bethany, Blood Bag, and It Lives!"
    },
    {
      "id": "ach-baptism-by-fire",
      "num": 509,
      "name": "Baptism by Fire",
      "kind": "challenge",
      "unlocks": {
        "challenge": "baptism-by-fire"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "satan",
        "charId": "bethany-defeat-moms-heart-11-times-and-unlock-maggys-faith"
      },
      "desc": "Defeat Satan as Bethany, defeat Mom's Heart 11 times, and unlock Maggy's Faith"
    },
    {
      "id": "ach-isaacs-awakening",
      "num": 510,
      "name": "Isaac's Awakening",
      "kind": "challenge",
      "unlocks": {
        "challenge": "isaacs-awakening"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother"
    },
    {
      "id": "ach-seeing-double",
      "num": 511,
      "name": "Seeing Double",
      "kind": "challenge",
      "unlocks": {
        "challenge": "seeing-double"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother"
    },
    {
      "id": "ach-pica-run",
      "num": 512,
      "name": "Pica Run",
      "kind": "challenge",
      "unlocks": {
        "challenge": "pica-run"
      },
      "condition": {
        "type": "defeat-boss",
        "boss": "moms-heart-11-times-and-unlock-marbles"
      },
      "desc": "Defeat Mom's Heart 11 times and unlock Marbles"
    },
    {
      "id": "ach-hot-potato",
      "num": 513,
      "name": "Hot Potato",
      "kind": "challenge",
      "unlocks": {
        "challenge": "hot-potato"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-tainted-forgotten"
      },
      "desc": "Unlock Tainted Forgotten"
    },
    {
      "id": "ach-cantripped",
      "num": 514,
      "name": "Cantripped!",
      "kind": "challenge",
      "unlocks": {
        "challenge": "cantripped"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-tainted-cain"
      },
      "desc": "Unlock Tainted Cain"
    },
    {
      "id": "ach-red-redemption",
      "num": 515,
      "name": "Red Redemption",
      "kind": "challenge",
      "unlocks": {
        "challenge": "red-redemption"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-tainted-jacob"
      },
      "desc": "Unlock Tainted Jacob"
    },
    {
      "id": "ach-delete-this",
      "num": 516,
      "name": "DELETE THIS",
      "kind": "challenge",
      "unlocks": {
        "challenge": "delete-this"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-tainted-eden"
      },
      "desc": "Unlock Tainted Eden"
    },
    {
      "id": "ach-dirty-mind",
      "num": 517,
      "name": "Dirty Mind",
      "kind": "item",
      "unlocks": {
        "item": "dirty-mind"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-scat-man-challenge-36"
      },
      "desc": "Complete Scat Man (challenge #36)"
    },
    {
      "id": "ach-sigil-of-baphomet",
      "num": 518,
      "name": "Sigil of Baphomet",
      "kind": "trinket",
      "unlocks": {
        "trinket": "sigil-of-baphomet"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-bloody-mary-challenge-37"
      },
      "desc": "Complete Bloody Mary (challenge #37)"
    },
    {
      "id": "ach-purgatory",
      "num": 519,
      "name": "Purgatory",
      "kind": "item",
      "unlocks": {
        "item": "purgatory"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-baptism-by-fire-challenge-38"
      },
      "desc": "Complete Baptism by Fire (challenge #38)"
    },
    {
      "id": "ach-spirit-sword",
      "num": 520,
      "name": "Spirit Sword",
      "kind": "item",
      "unlocks": {
        "item": "spirit-sword"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-isaacs-awakening-challenge-39"
      },
      "desc": "Complete Isaac's Awakening (challenge #39)"
    },
    {
      "id": "ach-broken-glasses",
      "num": 521,
      "name": "Broken Glasses",
      "kind": "trinket",
      "unlocks": {
        "trinket": "broken-glasses"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-seeing-double-challenge-40"
      },
      "desc": "Complete Seeing Double (challenge #40)"
    },
    {
      "id": "ach-ice-cube",
      "num": 522,
      "name": "Ice Cube",
      "kind": "trinket",
      "unlocks": {
        "trinket": "ice-cube"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-pica-run-challenge-41"
      },
      "desc": "Complete Pica Run (challenge #41)"
    },
    {
      "id": "ach-charged-penny",
      "num": 523,
      "name": "Charged Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "charged-penny"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "donate-to-battery-bums-until-they-pay-out-with-an-item-5-times"
      },
      "desc": "Donate to Battery Bums until they pay out with an item 5 times"
    },
    {
      "id": "ach-the-fool",
      "num": 524,
      "name": "The Fool",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-fool"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-lost"
      },
      "desc": "Defeat Ultra Greedier as Tainted Lost"
    },
    {
      "id": "ach-the-magician",
      "num": 525,
      "name": "The Magician",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-magician"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-judas"
      },
      "desc": "Defeat Ultra Greedier as Tainted Judas"
    },
    {
      "id": "ach-the-high-priestess",
      "num": 526,
      "name": "The High Priestess",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-high-priestess"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-lilith"
      },
      "desc": "Defeat Ultra Greedier as Tainted Lilith"
    },
    {
      "id": "ach-the-empress",
      "num": 527,
      "name": "The Empress",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-empress"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-eve"
      },
      "desc": "Defeat Ultra Greedier as Tainted Eve"
    },
    {
      "id": "ach-the-emperor",
      "num": 528,
      "name": "The Emperor",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-emperor"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-and-160"
      },
      "desc": "Defeat Ultra Greedier as Tainted&#160;???"
    },
    {
      "id": "ach-the-hierophant",
      "num": 529,
      "name": "The Hierophant",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-hierophant"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-bethany"
      },
      "desc": "Defeat Ultra Greedier as Tainted Bethany"
    },
    {
      "id": "ach-the-lovers",
      "num": 530,
      "name": "The Lovers",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-lovers"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-magdalene"
      },
      "desc": "Defeat Ultra Greedier as Tainted Magdalene"
    },
    {
      "id": "ach-the-chariot",
      "num": 531,
      "name": "The Chariot",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-chariot"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-hot-potato-challenge-42"
      },
      "desc": "Complete Hot Potato (challenge #42)"
    },
    {
      "id": "ach-justice",
      "num": 532,
      "name": "Justice",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "justice"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-cantripped-challenge-43"
      },
      "desc": "Complete Cantripped (challenge #43)"
    },
    {
      "id": "ach-the-hermit",
      "num": 533,
      "name": "The Hermit",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-hermit"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-red-redemption-challenge-44"
      },
      "desc": "Complete Red Redemption (challenge #44)"
    },
    {
      "id": "ach-wheel-of-fortune",
      "num": 534,
      "name": "Wheel of Fortune",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "wheel-of-fortune"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-cain"
      },
      "desc": "Defeat Ultra Greedier as Tainted Cain"
    },
    {
      "id": "ach-strength",
      "num": 535,
      "name": "Strength",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "strength"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-samson"
      },
      "desc": "Defeat Ultra Greedier as Tainted Samson"
    },
    {
      "id": "ach-the-hanged-man",
      "num": 536,
      "name": "The Hanged Man",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-hanged-man"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-keeper"
      },
      "desc": "Defeat Ultra Greedier as Tainted Keeper"
    },
    {
      "id": "ach-death",
      "num": 537,
      "name": "Death",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "death"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-forgotten"
      },
      "desc": "Defeat Ultra Greedier as Tainted Forgotten"
    },
    {
      "id": "ach-temperance",
      "num": 538,
      "name": "Temperance",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "temperance"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "complete-delete-this-challenge-45"
      },
      "desc": "Complete DELETE THIS (challenge #45)"
    },
    {
      "id": "ach-the-devil",
      "num": 539,
      "name": "The Devil",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-devil"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-azazel"
      },
      "desc": "Defeat Ultra Greedier as Tainted Azazel"
    },
    {
      "id": "ach-the-tower",
      "num": 540,
      "name": "The Tower",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-tower"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-apollyon"
      },
      "desc": "Defeat Ultra Greedier as Tainted Apollyon"
    },
    {
      "id": "ach-the-stars",
      "num": 541,
      "name": "The Stars",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-stars"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-isaac"
      },
      "desc": "Defeat Ultra Greedier as Tainted Isaac"
    },
    {
      "id": "ach-the-sun-and-the-moon",
      "num": 542,
      "name": "The Sun and the Moon",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-sun-and-the-moon"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-jacob"
      },
      "desc": "Defeat Ultra Greedier as Tainted Jacob"
    },
    {
      "id": "ach-judgement",
      "num": 543,
      "name": "Judgement",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "judgement"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-lazarus"
      },
      "desc": "Defeat Ultra Greedier as Tainted Lazarus"
    },
    {
      "id": "ach-the-world",
      "num": 544,
      "name": "The World",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "the-world"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "ultra-greedier",
        "charId": "tainted-eden"
      },
      "desc": "Defeat Ultra Greedier as Tainted Eden"
    },
    {
      "id": "ach-old-capacitor",
      "num": 545,
      "name": "Old Capacitor",
      "kind": "trinket",
      "unlocks": {
        "trinket": "old-capacitor"
      },
      "condition": {
        "type": "kill-count",
        "value": 10
      },
      "desc": "Kill 10 Battery Bums"
    },
    {
      "id": "ach-brimstone-bombs",
      "num": 546,
      "name": "Brimstone Bombs",
      "kind": "item",
      "unlocks": {
        "item": "brimstone-bombs"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "after-breaking-hornfels-minecart-kill-him-before-he-can-escape"
      },
      "desc": "After breaking Hornfel's minecart, kill him before he can escape"
    },
    {
      "id": "ach-mega-mush",
      "num": 547,
      "name": "Mega Mush",
      "kind": "item",
      "unlocks": {
        "item": "mega-mush"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-for-all-non-tainted-characters"
      },
      "desc": "Earn all Hard mode Completion Marks for all non-Tainted characters"
    },
    {
      "id": "ach-moms-lock",
      "num": 548,
      "name": "Mom's Lock",
      "kind": "trinket",
      "unlocks": {
        "trinket": "moms-lock"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-isaac"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Isaac"
    },
    {
      "id": "ach-dice-bag",
      "num": 549,
      "name": "Dice Bag",
      "kind": "trinket",
      "unlocks": {
        "trinket": "dice-bag"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Isaac"
    },
    {
      "id": "ach-holy-crown",
      "num": 550,
      "name": "Holy Crown",
      "kind": "trinket",
      "unlocks": {
        "trinket": "holy-crown"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-magdalene"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Magdalene"
    },
    {
      "id": "ach-mothers-kiss",
      "num": 551,
      "name": "Mother's Kiss",
      "kind": "trinket",
      "unlocks": {
        "trinket": "mothers-kiss"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Magdalene"
    },
    {
      "id": "ach-gilded-key",
      "num": 552,
      "name": "Gilded Key",
      "kind": "trinket",
      "unlocks": {
        "trinket": "gilded-key"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-cain"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Cain"
    },
    {
      "id": "ach-lucky-sack",
      "num": 553,
      "name": "Lucky Sack",
      "kind": "trinket",
      "unlocks": {
        "trinket": "lucky-sack"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Cain"
    },
    {
      "id": "ach-your-soul",
      "num": 554,
      "name": "Your Soul",
      "kind": "trinket",
      "unlocks": {
        "trinket": "your-soul"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-judas"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Judas"
    },
    {
      "id": "ach-number-magnet",
      "num": 555,
      "name": "Number Magnet",
      "kind": "trinket",
      "unlocks": {
        "trinket": "number-magnet"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Judas"
    },
    {
      "id": "ach-dingle-berry",
      "num": 556,
      "name": "Dingle Berry",
      "kind": "trinket",
      "unlocks": {
        "trinket": "dingle-berry"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-and-160"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted&#160;???"
    },
    {
      "id": "ach-ring-cap",
      "num": 557,
      "name": "Ring Cap",
      "kind": "trinket",
      "unlocks": {
        "trinket": "ring-cap"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted&#160;???"
    },
    {
      "id": "ach-strange-key",
      "num": 558,
      "name": "Strange Key",
      "kind": "trinket",
      "unlocks": {
        "trinket": "strange-key"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-eve"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Eve"
    },
    {
      "id": "ach-lil-clot",
      "num": 559,
      "name": "Lil Clot",
      "kind": "trinket",
      "unlocks": {
        "trinket": "lil-clot"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Eve"
    },
    {
      "id": "ach-temporary-tattoo",
      "num": 560,
      "name": "Temporary Tattoo",
      "kind": "trinket",
      "unlocks": {
        "trinket": "temporary-tattoo"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-samson"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Samson"
    },
    {
      "id": "ach-swallowed-m80",
      "num": 561,
      "name": "Swallowed M80",
      "kind": "trinket",
      "unlocks": {
        "trinket": "swallowed-m80"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Samson"
    },
    {
      "id": "ach-wicked-crown",
      "num": 562,
      "name": "Wicked Crown",
      "kind": "trinket",
      "unlocks": {
        "trinket": "wicked-crown"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-azazel"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Azazel"
    },
    {
      "id": "ach-azazels-stump",
      "num": 563,
      "name": "Azazel's Stump",
      "kind": "trinket",
      "unlocks": {
        "trinket": "azazels-stump"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Azazel"
    },
    {
      "id": "ach-torn-pocket",
      "num": 564,
      "name": "Torn Pocket",
      "kind": "trinket",
      "unlocks": {
        "trinket": "torn-pocket"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-lazarus"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Lazarus"
    },
    {
      "id": "ach-torn-card",
      "num": 565,
      "name": "Torn Card",
      "kind": "trinket",
      "unlocks": {
        "trinket": "torn-card"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Lazarus"
    },
    {
      "id": "ach-nuh-uh",
      "num": 566,
      "name": "Nuh Uh!",
      "kind": "trinket",
      "unlocks": {
        "trinket": "nuh-uh"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-eden"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Eden"
    },
    {
      "id": "ach-modeling-clay",
      "num": 567,
      "name": "Modeling Clay",
      "kind": "trinket",
      "unlocks": {
        "trinket": "modeling-clay"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Eden"
    },
    {
      "id": "ach-kids-drawing",
      "num": 568,
      "name": "Kid's Drawing",
      "kind": "trinket",
      "unlocks": {
        "trinket": "kids-drawing"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-lost"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Lost"
    },
    {
      "id": "ach-crystal-key",
      "num": 569,
      "name": "Crystal Key",
      "kind": "trinket",
      "unlocks": {
        "trinket": "crystal-key"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Lost"
    },
    {
      "id": "ach-the-twins",
      "num": 570,
      "name": "The Twins",
      "kind": "trinket",
      "unlocks": {
        "trinket": "the-twins"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-lilith"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Lilith"
    },
    {
      "id": "ach-adoption-papers",
      "num": 571,
      "name": "Adoption Papers",
      "kind": "trinket",
      "unlocks": {
        "trinket": "adoption-papers"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Lilith"
    },
    {
      "id": "ach-keepers-bargain",
      "num": 572,
      "name": "Keeper's Bargain",
      "kind": "trinket",
      "unlocks": {
        "trinket": "keepers-bargain"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-keeper"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Keeper"
    },
    {
      "id": "ach-cursed-penny",
      "num": 573,
      "name": "Cursed Penny",
      "kind": "trinket",
      "unlocks": {
        "trinket": "cursed-penny"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Keeper"
    },
    {
      "id": "ach-cricket-leg",
      "num": 574,
      "name": "Cricket Leg",
      "kind": "trinket",
      "unlocks": {
        "trinket": "cricket-leg"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-apollyon"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Apollyon"
    },
    {
      "id": "ach-apollyons-best-friend",
      "num": 575,
      "name": "Apollyon's Best Friend",
      "kind": "trinket",
      "unlocks": {
        "trinket": "apollyons-best-friend"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Apollyon"
    },
    {
      "id": "ach-polished-bone",
      "num": 576,
      "name": "Polished Bone",
      "kind": "trinket",
      "unlocks": {
        "trinket": "polished-bone"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-forgotten"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Forgotten"
    },
    {
      "id": "ach-hollow-heart",
      "num": 577,
      "name": "Hollow Heart",
      "kind": "trinket",
      "unlocks": {
        "trinket": "hollow-heart"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Forgotten"
    },
    {
      "id": "ach-expansion-pack",
      "num": 578,
      "name": "Expansion Pack",
      "kind": "trinket",
      "unlocks": {
        "trinket": "expansion-pack"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-bethany"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Bethany"
    },
    {
      "id": "ach-beths-essence",
      "num": 579,
      "name": "Beth's Essence",
      "kind": "trinket",
      "unlocks": {
        "trinket": "beths-essence"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Bethany"
    },
    {
      "id": "ach-rc-remote",
      "num": 580,
      "name": "RC Remote",
      "kind": "trinket",
      "unlocks": {
        "trinket": "rc-remote"
      },
      "condition": {
        "type": "defeat-boss-as",
        "boss": "isaac-satan-and-the-lamb",
        "charId": "tainted-jacob"
      },
      "desc": "Defeat Isaac, ???, Satan, and The Lamb as Tainted Jacob"
    },
    {
      "id": "ach-found-soul",
      "num": 581,
      "name": "Found Soul",
      "kind": "trinket",
      "unlocks": {
        "trinket": "found-soul"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother as Tainted Jacob"
    },
    {
      "id": "ach-member-card",
      "num": 582,
      "name": "Member Card",
      "kind": "item",
      "unlocks": {
        "item": "member-card"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "spend-40-coins-in-a-single-shop"
      },
      "desc": "Spend 40+ coins in a single Shop"
    },
    {
      "id": "ach-golden-razor",
      "num": 583,
      "name": "Golden Razor",
      "kind": "item",
      "unlocks": {
        "item": "golden-razor"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "in-a-single-run-obtain-99-coins-then-spend-all-of-them"
      },
      "desc": "In a single run, obtain 99 Coins, then spend all of them."
    },
    {
      "id": "ach-spindown-dice",
      "num": 584,
      "name": "Spindown Dice",
      "kind": "item",
      "unlocks": {
        "item": "spindown-dice"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Isaac"
    },
    {
      "id": "ach-hypercoagulation",
      "num": 585,
      "name": "Hypercoagulation",
      "kind": "item",
      "unlocks": {
        "item": "hypercoagulation"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Magdalene"
    },
    {
      "id": "ach-bag-of-crafting",
      "num": 586,
      "name": "Bag of Crafting",
      "kind": "item",
      "unlocks": {
        "item": "bag-of-crafting"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Cain"
    },
    {
      "id": "ach-dark-arts",
      "num": 587,
      "name": "Dark Arts",
      "kind": "item",
      "unlocks": {
        "item": "dark-arts"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Judas"
    },
    {
      "id": "ach-ibs",
      "num": 588,
      "name": "IBS",
      "kind": "item",
      "unlocks": {
        "item": "ibs"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted&#160;???"
    },
    {
      "id": "ach-sumptorium",
      "num": 589,
      "name": "Sumptorium",
      "kind": "item",
      "unlocks": {
        "item": "sumptorium"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Eve"
    },
    {
      "id": "ach-berserk",
      "num": 590,
      "name": "Berserk!",
      "kind": "item",
      "unlocks": {
        "item": "berserk"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Samson"
    },
    {
      "id": "ach-hemoptysis",
      "num": 591,
      "name": "Hemoptysis",
      "kind": "item",
      "unlocks": {
        "item": "hemoptysis"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Azazel"
    },
    {
      "id": "ach-flip",
      "num": 592,
      "name": "Flip",
      "kind": "item",
      "unlocks": {
        "item": "flip"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Lazarus"
    },
    {
      "id": "ach-corrupted-data",
      "num": 593,
      "name": "Corrupted Data",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "corrupted-data"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Eden"
    },
    {
      "id": "ach-ghost-bombs",
      "num": 594,
      "name": "Ghost Bombs",
      "kind": "item",
      "unlocks": {
        "item": "ghost-bombs"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Lost"
    },
    {
      "id": "ach-gello",
      "num": 595,
      "name": "Gello",
      "kind": "item",
      "unlocks": {
        "item": "gello"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Lilith"
    },
    {
      "id": "ach-keepers-kin",
      "num": 596,
      "name": "Keeper's Kin",
      "kind": "item",
      "unlocks": {
        "item": "keepers-kin"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Keeper"
    },
    {
      "id": "ach-abyss",
      "num": 597,
      "name": "Abyss",
      "kind": "item",
      "unlocks": {
        "item": "abyss"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Apollyon"
    },
    {
      "id": "ach-decap-attack",
      "num": 598,
      "name": "Decap Attack",
      "kind": "item",
      "unlocks": {
        "item": "decap-attack"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Forgotten"
    },
    {
      "id": "ach-lemegeton",
      "num": 599,
      "name": "Lemegeton",
      "kind": "item",
      "unlocks": {
        "item": "lemegeton"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Bethany"
    },
    {
      "id": "ach-anima-sola",
      "num": 600,
      "name": "Anima Sola",
      "kind": "item",
      "unlocks": {
        "item": "anima-sola"
      },
      "condition": {
        "type": "beat-delirium"
      },
      "desc": "Defeat Delirium as Tainted Jacob"
    },
    {
      "id": "ach-mega-chest",
      "num": 601,
      "name": "Mega Chest",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "mega-chest"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Isaac"
    },
    {
      "id": "ach-queen-of-hearts",
      "num": 602,
      "name": "Queen of Hearts",
      "kind": "card",
      "unlocks": {
        "card": "queen-of-hearts"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Magdalene"
    },
    {
      "id": "ach-gold-pill",
      "num": 603,
      "name": "Gold Pill",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "gold-pill"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Cain"
    },
    {
      "id": "ach-black-sack",
      "num": 604,
      "name": "Black Sack",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "black-sack"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Judas"
    },
    {
      "id": "ach-charming-poop",
      "num": 605,
      "name": "Charming Poop",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "charming-poop"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted&#160;???"
    },
    {
      "id": "ach-horse-pill",
      "num": 606,
      "name": "Horse Pill",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "horse-pill"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Eve"
    },
    {
      "id": "ach-crane-game",
      "num": 607,
      "name": "Crane Game",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "crane-game"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Samson"
    },
    {
      "id": "ach-hell-game",
      "num": 608,
      "name": "Hell Game",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "hell-game"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Azazel"
    },
    {
      "id": "ach-wooden-chest",
      "num": 609,
      "name": "Wooden Chest",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "wooden-chest"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Lazarus"
    },
    {
      "id": "ach-wild-card",
      "num": 610,
      "name": "Wild Card",
      "kind": "card",
      "unlocks": {
        "card": "wild-card"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Eden"
    },
    {
      "id": "ach-haunted-chest",
      "num": 611,
      "name": "Haunted Chest",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "haunted-chest"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Lost"
    },
    {
      "id": "ach-fools-gold",
      "num": 612,
      "name": "Fool's Gold",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "fools-gold"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Lilith"
    },
    {
      "id": "ach-golden-penny",
      "num": 613,
      "name": "Golden Penny",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "golden-penny"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Keeper"
    },
    {
      "id": "ach-rotten-beggar",
      "num": 614,
      "name": "Rotten Beggar",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "rotten-beggar"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Apollyon"
    },
    {
      "id": "ach-golden-battery",
      "num": 615,
      "name": "Golden Battery",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "golden-battery"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Forgotten"
    },
    {
      "id": "ach-confessional",
      "num": 616,
      "name": "Confessional",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "confessional"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Bethany"
    },
    {
      "id": "ach-golden-trinket",
      "num": 617,
      "name": "Golden Trinket",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "golden-trinket"
      },
      "condition": {
        "type": "beat-mega-satan"
      },
      "desc": "Defeat Mega Satan as Tainted Jacob"
    },
    {
      "id": "ach-soul-of-isaac",
      "num": 618,
      "name": "Soul of Isaac",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-isaac"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Isaac"
    },
    {
      "id": "ach-soul-of-magdalene",
      "num": 619,
      "name": "Soul of Magdalene",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-magdalene"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Magdalene"
    },
    {
      "id": "ach-soul-of-cain",
      "num": 620,
      "name": "Soul of Cain",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-cain"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Cain"
    },
    {
      "id": "ach-soul-of-judas",
      "num": 621,
      "name": "Soul of Judas",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-judas"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Judas"
    },
    {
      "id": "ach-soul-of-and-160",
      "num": 622,
      "name": "Soul of&#160;???",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "soul-of-and-160"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted&#160;???"
    },
    {
      "id": "ach-soul-of-eve",
      "num": 623,
      "name": "Soul of Eve",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-eve"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Eve"
    },
    {
      "id": "ach-soul-of-samson",
      "num": 624,
      "name": "Soul of Samson",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-samson"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Samson"
    },
    {
      "id": "ach-soul-of-azazel",
      "num": 625,
      "name": "Soul of Azazel",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-azazel"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Azazel"
    },
    {
      "id": "ach-soul-of-lazarus",
      "num": 626,
      "name": "Soul of Lazarus",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-lazarus"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Lazarus"
    },
    {
      "id": "ach-soul-of-eden",
      "num": 627,
      "name": "Soul of Eden",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-eden"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Eden"
    },
    {
      "id": "ach-soul-of-the-lost",
      "num": 628,
      "name": "Soul of the Lost",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-the-lost"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Lost"
    },
    {
      "id": "ach-soul-of-lilith",
      "num": 629,
      "name": "Soul of Lilith",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-lilith"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Lilith"
    },
    {
      "id": "ach-soul-of-the-keeper",
      "num": 630,
      "name": "Soul of the Keeper",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-the-keeper"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Keeper"
    },
    {
      "id": "ach-soul-of-apollyon",
      "num": 631,
      "name": "Soul of Apollyon",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-apollyon"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Apollyon"
    },
    {
      "id": "ach-soul-of-the-forgotten",
      "num": 632,
      "name": "Soul of the Forgotten",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-the-forgotten"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Forgotten"
    },
    {
      "id": "ach-soul-of-bethany",
      "num": 633,
      "name": "Soul of Bethany",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-bethany"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Bethany"
    },
    {
      "id": "ach-soul-of-jacob-and-esau",
      "num": 634,
      "name": "Soul of Jacob and Esau",
      "kind": "card",
      "unlocks": {
        "card": "soul-of-jacob-and-esau"
      },
      "condition": {
        "type": "beat-boss-rush"
      },
      "desc": "Defeat Hush and Boss Rush as Tainted Jacob"
    },
    {
      "id": "ach-a-strange-door",
      "num": 635,
      "name": "A Strange Door",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "a-strange-door"
      },
      "condition": {
        "type": "beat-mother"
      },
      "desc": "Defeat Mother"
    },
    {
      "id": "ach-death-certificate",
      "num": 636,
      "name": "Death Certificate",
      "kind": "item",
      "unlocks": {
        "item": "death-certificate"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "earn-all-hard-mode-completion-marks-for-all-characters-including-tainted-ones"
      },
      "desc": "Earn all Hard mode Completion Marks for all characters, including tainted ones"
    },
    {
      "id": "ach-dead-god",
      "num": 637,
      "name": "Dead God",
      "kind": "cosmetic",
      "unlocks": {
        "cosmetic": "dead-god"
      },
      "condition": {
        "type": "custom",
        "check": function (save, run) { var v = (save.custom || {})[this.key || this.metric]; return this.value == null ? !!v : v >= this.value },
        "key": "unlock-all-the-other-achievements-and-collect-every-item-in-the-game"
      },
      "desc": "Unlock all the other achievements and collect every item in the game"
    }
  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
