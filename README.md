# quake-globe

> Every earthquake on Earth in the last 24 hours, on a globe you can spin.

An interactive 3D globe that pulls the live [USGS earthquake feed](https://earthquake.usgs.gov/earthquakes/feed/)
and plots each quake by location, depth and magnitude — with a timeline to replay the day.

## Features

- [x] Vite + React + TypeScript + React Three Fiber scaffold
- [x] Textured 3D Earth with orbit controls — day map, relief, ocean glint, night-side city lights, clouds and atmosphere glow
- [ ] Fetch and parse the USGS GeoJSON feed
- [ ] Quakes plotted on the globe, sized and colored by magnitude
- [ ] Pulse animation and hover tooltip
- [ ] 24h timeline scrubber with playback
- [ ] Magnitude / period filters and side list
- [ ] Live demo on GitHub Pages

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [three.js](https://threejs.org) via [React Three Fiber](https://r3f.docs.pmnd.rs) and [drei](https://drei.docs.pmnd.rs)
- [USGS GeoJSON feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) — no API key needed
- Earth textures from the [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## License

[MIT](LICENSE) © Jorge Garrido
