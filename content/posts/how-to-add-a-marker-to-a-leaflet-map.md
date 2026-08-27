---
title: How to Add a Marker to a Leaflet Map
date: 2026-08-27
description: Learn how to add a marker to a Leaflet map with clear code
  examples, custom icons, popups, and tips for handling multiple markers.
tags:
  - Leaflet
  - JavaScript
  - Web Maps
  - GIS
  - Tutorial
image: /images/leaflet-marker.png
---

Adding a marker to a Leaflet map takes just one line of code once your map is set up. In this guide you'll get the minimal snippet you need, plus how to add popups, custom icons, and multiple markers—so you can go from a blank map to an interactive, pin-covered map in minutes.

## The Quick Answer

If you already have a Leaflet map instance called `map`, add a marker like this:

```javascript
L.marker([51.505, -0.09]).addTo(map);
```

The array holds `[latitude, longitude]`. That's all it takes. The rest of this article shows how to set up the map, enhance markers, and avoid common mistakes.

## Setting Up a Basic Leaflet Map

Before you can add a marker, you need a map. Include Leaflet's CSS and JavaScript, add a container element, then initialize the map.

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<div id="map" style="height: 400px;"></div>

<script>
  const map = L.map('map').setView([51.505, -0.09], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
</script>
```

Two things matter here:

- The `#map` div **must have a height**, or the map won't render.
- `setView([lat, lng], zoom)` centers the map and sets the initial zoom level.

## Adding a Single Marker

With the map ready, drop a marker at any coordinate:

```javascript
L.marker([51.5, -0.09]).addTo(map);
```

You can also store the marker in a variable so you can modify it later:

```javascript
const marker = L.marker([51.5, -0.09]).addTo(map);
```

Keeping the reference lets you move the marker, remove it, or attach events down the line.

## Adding a Popup to Your Marker

Markers become far more useful when they display information on click. Chain a `.bindPopup()` call:

```javascript
L.marker([51.5, -0.09])
  .addTo(map)
  .bindPopup('<b>Hello!</b><br>This is a marker.')
  .openPopup();
```

`bindPopup()` accepts HTML, so you can include links, images, or formatted text. Calling `.openPopup()` opens it immediately; leave it off if you want the popup to appear only when the user clicks.

## Using a Custom Marker Icon

The default blue pin works, but custom icons help your markers stand out. Create an `L.icon` and pass it as an option:

```javascript
const customIcon = L.icon({
  iconUrl: 'my-pin.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

L.marker([51.5, -0.09], { icon: customIcon }).addTo(map);
```

Key properties:

- **iconSize** – width and height in pixels.
- **iconAnchor** – the point of the icon that sits on the coordinate (usually the bottom center).
- **popupAnchor** – where the popup opens relative to the anchor.

## Adding Multiple Markers

For several locations, store your data in an array and loop through it:

```javascript
const places = [
  { coords: [51.5, -0.09], name: 'London' },
  { coords: [48.8566, 2.3522], name: 'Paris' },
  { coords: [40.7128, -74.006], name: 'New York' }
];

places.forEach(place => {
  L.marker(place.coords)
    .addTo(map)
    .bindPopup(place.name);
});
```

This pattern scales easily. If you have hundreds or thousands of markers, look into the **Leaflet.markercluster** plugin to group nearby points and keep performance smooth.

## Making Markers Interactive

Attach event listeners to respond to user actions:

```javascript
const marker = L.marker([51.5, -0.09]).addTo(map);

marker.on('click', () => {
  console.log('Marker clicked!');
});
```

You can also make a marker draggable so users can reposition it:

```javascript
L.marker([51.5, -0.09], { draggable: true }).addTo(map);
```

Just as smart planning helps in other areas of life—like understanding a [Backdoor Roth IRA and how it works in 2026](/backdoor-roth-ira-how-it-works-in-2026)—a little structure with your marker data goes a long way toward a maintainable map.

## FAQ

### Why isn't my marker showing up?
The most common causes are a map container with no height, coordinates in the wrong order (Leaflet uses `[lat, lng]`, not `[lng, lat]`), or forgetting to call `.addTo(map)`.

### How do I remove a marker?
Store the marker in a variable and call `map.removeLayer(marker)`.

### Can I add a marker where the user clicks?
Yes. Listen for the map's click event: `map.on('click', e => L.marker(e.latlng).addTo(map));`.

### How do I fit the map to show all markers?
Create a `L.featureGroup` of your markers and call `map.fitBounds(group.getBounds())`.

## Conclusion

Adding a marker to a Leaflet map is as simple as `L.marker([lat, lng]).addTo(map)`, but the real power comes from popups, custom icons, and looping through location data. Start with the basics, then layer on interactivity as your project grows. With these snippets, you have everything needed to build a rich, marker-filled map.

## Removing a Marker

Store the marker in a variable and call `map.removeLayer(marker)` to take it off the map.


## Removing a Marker

Store the marker in a variable and call `map.removeLayer(marker)` to take it off the map.

<script type="application/ld+json" data-draftship-schema>
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why isn't my marker showing up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The most common causes are a map container with no height, coordinates in the wrong order (Leaflet uses `[lat, lng]`, not `[lng, lat]`), or forgetting to call `.addTo(map)`."
      }
    },
    {
      "@type": "Question",
      "name": "How do I remove a marker?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Store the marker in a variable and call `map.removeLayer(marker)`."
      }
    },
    {
      "@type": "Question",
      "name": "Can I add a marker where the user clicks?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Listen for the map's click event: `map.on('click', e => L.marker(e.latlng).addTo(map));`."
      }
    },
    {
      "@type": "Question",
      "name": "How do I fit the map to show all markers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Create a `L.featureGroup` of your markers and call `map.fitBounds(group.getBounds())`."
      }
    }
  ]
}
</script>

