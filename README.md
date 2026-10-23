# Voxel Wilds — Expanded

A single-file voxel sandbox (`index.html`, Three.js via CDN) overhauled into a
much fuller Minecraft-style experience. All artwork is **original procedural
16×16 pixel art** generated at runtime — inspired by Minecraft's style, with
no Mojang assets copied.

## What's in the overhaul
- **Texture system rebuilt**: every one of the 500+ registry entries gets its
  own painted tile(s) on a 64×64 tile atlas (grass top/side/dirt, log
  side/rings, planks per wood family, ores per host rock, stained glass,
  bricks, coral, sculk, redstone devices, plants as transparent cut-outs…).
  Zero blocks share an identical face-tile set (verified headlessly).
- **Content**: 12 wood families, stone/deepslate variants, all dye colors of
  wool/concrete/terracotta, deepslate + nether ores, water & lava, coral,
  nether/end blocks, furniture & workstations, plus ~90 items — full
  wooden→netherite tool sets, armor, shields, trident, buckets, fish, food.
- **Mobs (34 types)**: farm animals, cat/fox/goat/frog/panda/llama/turtle,
  squid, bee & bat (flying), and zombie/creeper/skeleton/spider/enderman/
  slime/witch/pillager/husk/stray/drowned/blaze… with walk-cycle leg
  animation, flying/swimming movement, biome- and night-appropriate
  spawning, drops, and tiny synthesized sounds (no audio assets).
- **Systems that actually work**: tools mine their material faster and hit
  harder, armor in inventory reduces damage, ores drop raw materials,
  furnaces smelt (hold a raw item, use a Furnace, burns 1 coal), chests and
  barrels store/take items, beds skip to morning, lakes/riverside terrain
  with swimming, lava pools underground, biome-specific trees (oak, birch,
  spruce, cactus) and flowers.
- 76 crafting recipes (per-wood planks, all tool tiers, furnace, chest,
  shield, bow, armor…), creative inventory tabs + search, survival mode,
  day/night, local same-browser multiplayer, touch controls.

## Honest scope limits
Simplified (not full Minecraft): no Nether/End dimensions or portals, no
enchanting/brewing/redstone simulation beyond the pre-existing piston/
dropper basics, stairs/slabs are full cubes with stair-style shading,
smelting is instant, armor is inventory-based rather than worn slots.

## Develop / test
- `python3 tools/build.py` — regenerates `index.html` from the original
  game (`/tmp/base.html`) + `/tmp/overhaul.js`.
- `node tools/test-harness.js` — headless validation of registries,
  textures, drops, recipes, mob loot and terrain generation.
- Play: serve the folder, e.g. `python3 -m http.server 8000`, open
  `index.html`. Requires internet once for the Three.js CDN + font.
