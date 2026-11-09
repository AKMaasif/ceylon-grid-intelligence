# Third-party notices

## Sri Lanka geographic outline

`apps/web/public/lanka/sri-lanka.geojson` is an unmodified geoBoundaries gbOpen
LKA ADM0 outline (year represented: 2017), sourced from OpenStreetMap/Wambacher.
Source reports ODbL 1.0. Attribution, pinned source and license links are in
`apps/web/public/lanka/GEOGRAPHY_SOURCE.txt`; the map displays attribution.

## @meta-sam/parser (Meta Platforms, Inc.)

`apps/web` uses `@meta-sam/parser` 0.1.0 server-side to decode SAM 3 segmentation masks into SVG outlines
(`apps/web/src/server/perception/mask-outline.ts`). It is distributed under the **SAM License**; a copy of the
agreement is in [`licenses/SAM-LICENSE.txt`](licenses/SAM-LICENSE.txt). This project uses the package as published
and does not modify, decompile or reverse engineer it.
