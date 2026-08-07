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
  // There is no `hooks` key on a familiar — IS.fireHook only walks p.items and
  // then p.trinkets, so a hook here would never fire. Everything a familiar
  // does is `behaviour` (from IS.FAMILIAR_BEHAVIOUR_LIST) plus `params`.
  //
  // `sprite` always equals `id` so js/render/sprites-items.js can register one
  // draw function per familiar id.
  //
  // ---------------------------------------------------------------------------
  // PARAMS CONTRACT — js/engine/familiar.js reads exactly these keys, and this
  // block is the spec it implements. Nothing below is a sentinel: an absent key
  // means "no limit", never zero, so the obvious `if (f.hp <= 0) remove` in the
  // engine cannot wipe out the indestructible familiars on spawn.
  //
  // Body / motion
  //   r            collision radius, world units (the player is 26, a tile 80)
  //   speed        movement speed in UNITS PER SECOND — not a multiplier. The
  //                player moves 300 u/s at stats.speed 1.0. On the orbiting
  //                behaviours this is how fast the ring itself chases the
  //                player, not the orbit rate (that is `orbitSpeed`).
  //   flying       true = ignores rocks, pits and webs, drawn with a shadow
  //   orbitR       orbit radius in units ('orbital' / 'orbitShooter')
  //   orbitSpeed   orbit angular velocity, radians per second
  //
  // Combat
  //   dmg          damage in PLAYER DAMAGE UNITS (a base tear is 3.5). This is
  //                not enemy.dmg, which is half-hearts of contact damage.
  //   fireDelay    seconds between shots. Shooting behaviours only ('follower',
  //                'orbitShooter', 'stationaryDrop', 'copycat') plus
  //                'laserFamiliar'.
  //   range        shot travel distance in units (base player range is 520).
  //                For 'laserFamiliar' it is the beam length (IS.spawnLaser
  //                opts.len). For 'chaser' it is the target-acquisition radius.
  //                Absent on the pure contact familiars ('orbital', 'wanderer'),
  //                which neither shoot nor seek — treat a missing `range` as
  //                unlimited.
  //   cooldown     seconds of downtime between attack cycles: the pause between
  //                rams for 'chaser', between spawns for 'summoner', and the
  //                per-target re-hit interval for the contact familiars
  //                ('orbital', 'wanderer').
  //   tearFlags    flags applied to the TEARS this familiar fires, so only the
  //                shooting behaviours may carry it. Values from
  //                IS.TEAR_FLAG_LIST; the engine owns every flag's behaviour,
  //                data never implements one. A ramming familiar uses `status`
  //                instead — a tear flag on something that fires nothing would
  //                load fine and silently do nothing.
  //   brimstone    'laserFamiliar' only: fire a brimstone beam rather than a
  //                thin laser (IS.spawnLaser opts.brimstone).
  //   status       status applied on contact, or on tear/beam hit, from
  //                IS.STATUS_LIST
  //   statusSecs   duration for `status` in seconds (mirrors IS.applyStatus)
  //
  // Durability
  //   hp           hit points. Present only on the destructible familiars; a
  //                familiar enemy fire cannot remove omits `hp` and declares
  //                `invulnerable: true`. Missing hp = treat as Infinity.
  //   invulnerable true = enemy shots, contact and explosions cannot destroy it
  //   blockShots   true = its body absorbs enemy projectiles
  //   life         lifetime in seconds. Present only on the temporary
  //                familiars; missing `life` = lasts until the run ends. A
  //                spawner overrides it per instance, because
  //                ctx.spawnFamiliar(id, opts) copies opts onto the instance:
  //                ctx.spawnFamiliar('charmed-fly', { life: 12 }).
  // ---------------------------------------------------------------------------

  IS.defineFamiliars([

    // --- the swarm -----------------------------------------------------------
    // Guppy / Infestation / Forever Alone flies, and everything else that
    // showers blue flies. Indestructible, permanent, small fixed damage; they
    // simply ram whatever is closest and peel off for a moment between hits.
    // Spiders are the ground version: slower, no flight, more damage per hit
    // and a longer recovery. The black and red variants swap raw speed for a
    // status on contact.

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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
      }
    },

    // --- wisps (Book of Virtues) ---------------------------------------------
    // Wisps ring the player, carry a tiny hp pool and body-block enemy shots,
    // which is how they usually die. Each colour gets its own behaviour so a
    // wisp loadout actually plays differently: the plain and white wisps shoot
    // while orbiting, the black wisp charges a brimstone beam on a slow
    // cadence, and the blue wisp is the pure shield — the fattest hp pool, a
    // tight orbit, contact damage only.

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
        blockShots: true
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
        blockShots: true
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
        brimstone: true,
        hp: 2,
        blockShots: true
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
        cooldown: 0.3,
        hp: 5,
        blockShots: true
      }
    },

    // --- locusts (Abyss) -----------------------------------------------------
    // Abyss eats the pedestals on the floor and gives back one locust each, so
    // these are permanent, indestructible run familiars rather than temporary
    // summons. A locust sprints across the room at the nearest enemy, hits it
    // hard, then peels off and re-acquires.
    //
    // APPROXIMATED: Isaac's locusts deal a multiple of the player's damage, so
    // they scale for the whole run. `params` has no key for reading p.stats and
    // adding one the engine may not honour would be a silent no-op, so these
    // carry flat `dmg` tuned for mid-run — a couple of tears per ram, strong
    // but never better than simply shooting.

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
        invulnerable: true,
        blockShots: false
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
        invulnerable: true,
        blockShots: false
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
        dmg: 9,
        range: 1400,
        cooldown: 0.45,
        invulnerable: true,
        blockShots: false
      }
    },

    // --- temporary charmed allies (the 'summoner' behaviour spawns these) ----
    // `life` is the default duration; a summoner overrides it per instance with
    // ctx.spawnFamiliar(id, { life: n }). The two small ones cannot be killed
    // inside their short window; the minion is a real body with hp that eats
    // shots aimed at the player.

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
        invulnerable: true,
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
        invulnerable: true,
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
    //
    // APPROXIMATED: Isaac's Book of the Dead orbitals are scoped to the room
    // they were conjured in. `life` is in seconds and ctx exposes no way to
    // despawn a familiar, so ours are permanent and indestructible instead —
    // fewer of them per use is what keeps that honest, which is the spawning
    // item's business, not this file's.

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
        invulnerable: true,
        blockShots: true
      }
    },

    // --- fallback ------------------------------------------------------------
    // IS.defineFamiliars defaults `sprite` to 'familiar-generic', and
    // IS.spawnFamiliar falls back to this def for an id it does not know, so it
    // has to be a complete, playable familiar rather than a stub: a plain
    // follower that shoots a base-strength tear at the nearest enemy.

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
        invulnerable: true,
        blockShots: false
      }
    }

  ])

})(typeof window !== 'undefined' ? (window.IS = window.IS || {}) : (globalThis.IS = globalThis.IS || {}))
