;(function (IS) {
  'use strict'

  // ---------------------------------------------------------------------------
  // ISUCK — shared familiar definitions.
  //
  // Only the familiars that are NOT owned by a single collectible live here:
  // the generic swarm (blue flies / spiders and their variants), the Book of
  // Virtues wisps, the Abyss locusts, the temporary charmed allies that the
  // 'summoner' behaviour spawns, the Book of the Dead bone orbital and the
  // 'familiar-generic' fallback that IS.defineFamiliars defaults `sprite` to.
  //
  // Item-specific familiars (Brother Bobby, Sister Maggy, Demon Baby, …) are
  // defined by their own item file, next to the item that grants them.
  //
  // Schema (ARCHITECTURE.md §7.3): { id, name, sprite, behaviour, params }.
  // There is no `hooks` key on a familiar: IS.fireHook only walks p.items and
  // p.trinkets, so a hook here would never fire. Everything a familiar does is
  // `behaviour` (from IS.FAMILIAR_BEHAVIOUR_LIST) plus `params`.
  //
  // `sprite` always equals `id` so js/render/sprites-items.js can register one
  // draw function per familiar id.
  //
  // ---------------------------------------------------------------------------
  // PARAMS CONTRACT — js/engine/familiar.js reads exactly these keys.
  //
  // Body / motion
  //   r            collision radius, world units (player is 26, one tile is 80)
  //   speed        movement speed in UNITS PER SECOND — not a multiplier.
  //                The player moves 300 u/s at stats.speed 1.0.
  //   flying       true = ignores rocks, pits and webs, drawn with a shadow
  //   orbitR       orbit radius in units (orbital / orbitShooter)
  //   orbitSpeed   orbit angular velocity, radians/second
  //
  // Combat
  //   dmg          damage in PLAYER DAMAGE UNITS (a base tear is 3.5) — this is
  //                not enemy.dmg, which is half-hearts of contact damage
  //   fireDelay    seconds between shots (shooters and laserFamiliar)
  //   range        shot travel distance in units (base player range is 520);
  //                for 'chaser' it is the target acquisition radius. Omitted on
  //                the pure contact familiars ('orbital', 'wanderer'), which
  //                neither shoot nor seek — treat a missing `range` as infinite
  //   cooldown     seconds of downtime between attack cycles: the pause between
  //                rams for 'chaser', between spawns for 'summoner', and the
  //                per-target re-hit interval for contact damage ('orbital',
  //                'wanderer')
  //   tearFlags    flags applied to the shots it fires. Values from
  //                IS.TEAR_FLAG_LIST; the engine owns the behaviour, never data
  //   status       status applied on contact / on hit, from IS.STATUS_LIST
  //   statusSecs   duration for `status`, seconds (mirrors IS.applyStatus)
  //
  // Durability
  //   hp           hit points; 0 means indestructible (flies, spiders, locusts)
  //   blockShots   true = its body absorbs enemy projectiles
  //   life         default lifetime in seconds; 0 means it lasts until the run
  //                ends. A spawner overrides it per instance, because
  //                ctx.spawnFamiliar(id, opts) copies opts onto the instance:
  //                ctx.spawnFamiliar('charmed-fly', { life: 12 })
  // ---------------------------------------------------------------------------

  IS.defineFamiliars([

    // --- the swarm -----------------------------------------------------------
    // Guppy / Infestation / Forever Alone flies. Indestructible, permanent,
    // small fixed damage, they simply ram whatever is closest. Spiders are the
    // ground version: slower, no flight, a bit more damage per hit.

    {
      id: 'blue-fly',
      name: 'Blue Fly',
      sprite: 'blue-fly',
      behaviour: 'chaser',
      params: {
        r: 11,
        speed: 345,
        flying: true,
        dmg: 3,
        range: 900,
        cooldown: 0.35,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    {
      id: 'black-fly',
      name: 'Black Fly',
      sprite: 'black-fly',
      behaviour: 'chaser',
      params: {
        r: 13,
        speed: 290,
        flying: true,
        dmg: 5,
        range: 900,
        cooldown: 0.5,
        status: 'fear',
        statusSecs: 1.2,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    {
      id: 'red-fly',
      name: 'Red Fly',
      sprite: 'red-fly',
      behaviour: 'chaser',
      params: {
        r: 12,
        speed: 330,
        flying: true,
        dmg: 3.5,
        range: 900,
        cooldown: 0.4,
        status: 'burn',
        statusSecs: 3,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    {
      id: 'blue-spider',
      name: 'Blue Spider',
      sprite: 'blue-spider',
      behaviour: 'chaser',
      params: {
        r: 14,
        speed: 265,
        flying: false,
        dmg: 4,
        range: 760,
        cooldown: 0.55,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    {
      id: 'black-spider',
      name: 'Black Spider',
      sprite: 'black-spider',
      behaviour: 'chaser',
      params: {
        r: 15,
        speed: 240,
        flying: false,
        dmg: 4.5,
        range: 760,
        cooldown: 0.6,
        status: 'slow',
        statusSecs: 2.5,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    {
      id: 'red-spider',
      name: 'Red Spider',
      sprite: 'red-spider',
      behaviour: 'chaser',
      params: {
        r: 14,
        speed: 280,
        flying: false,
        dmg: 5,
        range: 760,
        cooldown: 0.5,
        status: 'bleed',
        statusSecs: 4,
        hp: 0,
        blockShots: false,
        life: 0
      }
    },

    // --- wisps (Book of Virtues) ---------------------------------------------
    // Wisps orbit the player, have a tiny hp pool and body-block enemy shots,
    // which is how they usually die. Each colour gets a different behaviour so
    // a wisp loadout actually plays differently: the plain and white wisps
    // shoot while orbiting, the black wisp fires a brimstone beam on a cadence,
    // the blue wisp is the pure shield — fat hp pool, no attack of its own.

    {
      id: 'wisp',
      name: 'Wisp',
      sprite: 'wisp',
      behaviour: 'orbitShooter',
      params: {
        r: 13,
        speed: 300,
        flying: true,
        orbitR: 62,
        orbitSpeed: 1.7,
        dmg: 3.5,
        fireDelay: 0.65,
        range: 420,
        hp: 2,
        blockShots: true,
        life: 0
      }
    },

    {
      id: 'white-wisp',
      name: 'White Wisp',
      sprite: 'white-wisp',
      behaviour: 'orbitShooter',
      params: {
        r: 13,
        speed: 300,
        flying: true,
        orbitR: 74,
        orbitSpeed: 1.4,
        dmg: 3.5,
        fireDelay: 0.8,
        range: 480,
        tearFlags: ['holy', 'light'],
        hp: 3,
        blockShots: true,
        life: 0
      }
    },

    {
      id: 'black-wisp',
      name: 'Black Wisp',
      sprite: 'black-wisp',
      behaviour: 'laserFamiliar',
      params: {
        r: 13,
        speed: 300,
        flying: true,
        orbitR: 56,
        orbitSpeed: 2,
        dmg: 2.2,
        fireDelay: 2.6,
        range: 560,
        tearFlags: ['brimstone', 'piercing'],
        hp: 2,
        blockShots: true,
        life: 0
      }
    },

    {
      id: 'blue-wisp',
      name: 'Blue Wisp',
      sprite: 'blue-wisp',
      behaviour: 'orbital',
      params: {
        r: 15,
        speed: 300,
        flying: true,
        orbitR: 50,
        orbitSpeed: 2.4,
        dmg: 2,
        hp: 5,
        blockShots: true,
        life: 0
      }
    },

    // --- locusts (Abyss) -----------------------------------------------------
    // Locusts sprint at an enemy, hit it hard, then re-acquire. They are
    // consumed by their own lifetime rather than by damage.
    //
    // APPROXIMATED: Isaac's locusts deal a fraction of the player's damage, so
    // they stay relevant on every floor. The params contract has no key for
    // scaling off p.stats, and inventing one would silently no-op the moment
    // familiar.js did not implement it, so these carry flat `dmg` tuned for
    // mid-run: a couple of tears' worth per ram, strong but not better than
    // simply shooting. Revisit once familiar.js exists and can read the stat
    // block directly.

    {
      id: 'red-locust',
      name: 'Red Locust',
      sprite: 'red-locust',
      behaviour: 'chaser',
      params: {
        r: 13,
        speed: 520,
        flying: true,
        dmg: 5,
        range: 1200,
        cooldown: 0.3,
        status: 'burn',
        statusSecs: 3,
        hp: 0,
        blockShots: false,
        life: 30
      }
    },

    {
      id: 'locust-of-pestilence',
      name: 'Locust of Pestilence',
      sprite: 'locust-of-pestilence',
      behaviour: 'chaser',
      params: {
        r: 14,
        speed: 470,
        flying: true,
        dmg: 4.5,
        range: 1200,
        cooldown: 0.35,
        status: 'poison',
        statusSecs: 5,
        hp: 0,
        blockShots: false,
        life: 30
      }
    },

    {
      id: 'locust-of-death',
      name: 'Locust of Death',
      sprite: 'locust-of-death',
      behaviour: 'chaser',
      params: {
        r: 15,
        speed: 600,
        flying: true,
        dmg: 8,
        range: 1400,
        cooldown: 0.45,
        tearFlags: ['piercing'],
        hp: 0,
        blockShots: false,
        life: 45
      }
    },

    // --- temporary charmed allies (the 'summoner' behaviour spawns these) ----
    // `life` is the default duration; a summoner familiar overrides it per
    // instance with ctx.spawnFamiliar(id, { life: n }).

    {
      id: 'charmed-fly',
      name: 'Charmed Fly',
      sprite: 'charmed-fly',
      behaviour: 'chaser',
      params: {
        r: 12,
        speed: 320,
        flying: true,
        dmg: 3,
        range: 900,
        cooldown: 0.4,
        hp: 0,
        blockShots: false,
        life: 20
      }
    },

    {
      id: 'charmed-spider',
      name: 'Charmed Spider',
      sprite: 'charmed-spider',
      behaviour: 'chaser',
      params: {
        r: 14,
        speed: 255,
        flying: false,
        dmg: 4,
        range: 760,
        cooldown: 0.55,
        status: 'slow',
        statusSecs: 2,
        hp: 0,
        blockShots: false,
        life: 20
      }
    },

    {
      id: 'charmed-minion',
      name: 'Charmed Minion',
      sprite: 'charmed-minion',
      behaviour: 'wanderer',
      params: {
        r: 20,
        speed: 175,
        flying: false,
        dmg: 6,
        cooldown: 1.1,
        hp: 12,
        blockShots: true,
        life: 25
      }
    },

    // --- bone orbital (Book of the Dead) -------------------------------------
    // Spins close to the player, shreds anything it touches and eats shots.
    // Indestructible: it lasts until the floor ends, not until it is shot.

    {
      id: 'bone-orbital',
      name: 'Bone Orbital',
      sprite: 'bone-orbital',
      behaviour: 'orbital',
      params: {
        r: 17,
        speed: 300,
        flying: true,
        orbitR: 78,
        orbitSpeed: 2.6,
        dmg: 4,
        cooldown: 0.25,
        hp: 0,
        blockShots: true,
        life: 0
      }
    },

    // --- fallback ------------------------------------------------------------
    // IS.defineFamiliars defaults `sprite` to 'familiar-generic', and
    // IS.spawnFamiliar falls back to this def for an id it does not know, so it
    // must be a complete, playable familiar rather than a stub.

    {
      id: 'familiar-generic',
      name: 'Familiar',
      sprite: 'familiar-generic',
      behaviour: 'follower',
      params: {
        r: 16,
        speed: 320,
        flying: true,
        dmg: 3.5,
        fireDelay: 0.7,
        range: 520,
        hp: 0,
        blockShots: false,
        life: 0
      }
    }

  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
