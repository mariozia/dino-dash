# Higgsfield prompts for Dino Dash art

The game currently draws every sprite procedurally on canvas (see `js/art.js`) so it's
playable with zero image assets. When you're ready for real artwork, generate these on
higgsfield.ai (or any image model) and drop the exported PNGs into a new `assets/`
folder, then swap the matching `draw...` function for a `ctx.drawImage(...)` call using
the same coordinates.

General style guardrails to repeat in every prompt: **"2D mobile game asset, flat
vector illustration style, clean bold outlines, transparent background, side-on view,
vibrant prehistoric color palette, no text, no watermark."**

## Background (parallax layers, 3 separate exports)
1. Sky + volcano layer: "Prehistoric jungle sunset sky with a smoking volcano on the
   horizon, warm orange-to-purple gradient, glowing lava crater, 2D mobile game
   background art, flat vector style, wide horizontal composition, no characters."
2. Mid jungle silhouette: "Silhouette of prehistoric ferns, cycads and palm trees
   against a sunset sky, layered parallax background art for a 2D side-scrolling game,
   flat vector style, dark green-blue silhouette."
3. Ground/foreground: "Cracked prehistoric dirt ground with patches of grass, small
   rocks and fern fronds, seamless horizontally tileable, 2D side-scroller game
   foreground art, flat vector style."

## Player character — Velociraptor (default)
"Side-view velociraptor running pose, green and tan feathered skin, small arms, long
balancing tail, mouth open mid-screech, 2D mobile game character sprite, flat vector
illustration, transparent background, dynamic action pose, no text." Generate 3 frames
(legs up / mid-stride / legs down) for a run-cycle if your pipeline supports sprite
sheets.

## Obstacle — Meteor
"Glowing molten meteor rock hurtling through the air, orange cracked lava veins across
a dark grey rocky surface, trailing flame and embers, 2D mobile game obstacle sprite,
flat vector illustration, transparent background, side view, no text." Needs two
orientations: point-down (hangs from the top of the screen) and point-up (rises from
the ground) — or generate one and mirror vertically.

## Store character portraits
Use this template per character, swapping the description column from the table below:

"Side-view 2D game character icon of a {DESCRIPTION}, flat vector illustration style,
bold clean outlines, vibrant prehistoric color palette, transparent background,
friendly mascot energy, no text, no watermark, square composition."

| Character | Rarity | Price | Description to drop in |
|---|---|---|---|
| Velociraptor | Common | Free | green and tan feathered velociraptor, lean and fast |
| Compsognathus | Common | $6.99 | tiny olive-brown compsognathus, big curious eyes |
| Dilophosaurus | Uncommon | $14.99 | teal dilophosaurus with a bright red fanned neck frill |
| Pachycephalosaurus | Uncommon | $19.99 | sturdy brown pachycephalosaurus with a domed bony head |
| Stegosaurus | Rare | $34.99 | blue-grey stegosaurus with tall orange back plates |
| Ankylosaurus | Rare | $39.99 | olive-green armored ankylosaurus with a round club tail |
| Triceratops | Epic | $59.99 | grey-brown triceratops with three pale horns and a frill |
| Spinosaurus | Epic | $74.99 | deep blue spinosaurus with a tall red sail fin on its back |
| Pteranodon | Legendary | $99.99 | orange-red pteranodon with wide membrane wings, mid-flight |
| Tyrannosaurus Rex | Mythic | $149.99 | massive gold and crimson tyrannosaurus rex with glowing amber eyes, regal apex-predator pose |

Keep every render at the same camera angle/scale so they sit consistently in the store
grid and as the in-game sprite.
