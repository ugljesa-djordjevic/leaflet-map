import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

import countriesData from '../data/countries.json';
import usaStatesData from '../data/usastates.json';
import citiesData from '../data/cities.json';

const generateAvailability = (id) => {
  const hash = String(id).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  return Math.abs(hash % 100);
};

const generateStoresForCity = (cityName, countryCode) => {
  const count = 3 + Math.abs(cityName.charCodeAt(0) % 8);
  return Array.from({ length: count }, (_, i) => ({
    id: `${countryCode}-${cityName}-${i}`,
    name: `Store ${100 + Math.abs((cityName.charCodeAt(0) + i * 7) % 900)}`,
    availability: generateAvailability(`${cityName}-${i}`),
    offset: { lat: Math.sin((i / count) * Math.PI * 2) * 0.02, lng: Math.cos((i / count) * Math.PI * 2) * 0.02 }
  }));
};

const getStatus = (av) => {
  if (av >= 70) return { label: 'Low', color: 'bg-blue-100 text-blue-600' };
  if (av >= 40) return { label: 'Medium', color: 'bg-amber-100 text-amber-700' };
  if (av >= 20) return { label: 'High', color: 'bg-red-50 text-red-500' };
  return { label: 'Critical', color: 'bg-red-50 text-red-500' };
};

const getMarkerColor = (av) => {
  if (av >= 80) return '#22c55e';
  if (av >= 60) return '#65a30d';
  if (av >= 40) return '#ca8a04';
  if (av >= 20) return '#ea580c';
  return '#dc2626';
};

const getPolygonStyle = (av) => ({ fillColor: getMarkerColor(av), weight: 1, opacity: 1, color: '#fff', fillOpacity: 0.75 });

const AvailabilityRing = ({ percentage, size = 40 }) => {
  const r = (size - 4) / 2, circ = 2 * Math.PI * r, offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={getMarkerColor(percentage)} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size < 35 ? '8px' : '11px', fill: '#374151', fontWeight: 500, transform: 'rotate(90deg)', transformOrigin: 'center' }}>{percentage}%</text>
    </svg>
  );
};

const MapController = ({ bounds, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    else if (center && zoom) map.setView(center, zoom);
  }, [bounds, center, zoom, map]);
  return null;
};

export default function DeviceAvailabilityDashboard() {
  const [view, setView] = useState('world');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapCenter, setMapCenter] = useState([30, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  const countriesWithAvailability = useMemo(() => countriesData.features.map(f => ({
    ...f, properties: { ...f.properties, availability: generateAvailability(f.properties.ADM0_A3 || f.properties.NAME) }
  })), []);

  const citiesForCountry = useMemo(() => {
    if (!selectedCountry) return [];
    const code = selectedCountry.properties.ADM0_A3 || selectedCountry.properties.ISO_A3;
    const name = selectedCountry.properties.NAME;
    return citiesData.features.filter(c => c.properties.ADM0_A3 === code || c.properties.ADM0NAME === name)
      .map(c => ({ ...c, properties: { ...c.properties, availability: generateAvailability(c.properties.NAME) } }));
  }, [selectedCountry]);

  const storesForCity = useMemo(() => selectedCity ? generateStoresForCity(selectedCity.properties.NAME, selectedCity.properties.ADM0_A3) : [], [selectedCity]);

  const overallAvailability = useMemo(() => {
    if (view === 'city' && storesForCity.length) return Math.round(storesForCity.reduce((s, x) => s + x.availability, 0) / storesForCity.length);
    if (view === 'country' && citiesForCountry.length) return Math.round(citiesForCountry.reduce((s, c) => s + c.properties.availability, 0) / citiesForCountry.length);
    return 91;
  }, [view, storesForCity, citiesForCountry]);

  const currentTitle = useMemo(() => {
    if (view === 'city' && selectedCity) return selectedCity.properties.NAME;
    if (view === 'country' && selectedCountry) return selectedCountry.properties.NAME;
    return 'World';
  }, [view, selectedCountry, selectedCity]);

  const listItems = useMemo(() => {
    if (view === 'city') return storesForCity.map(s => ({ id: s.id, name: s.name, availability: s.availability }));
    if (view === 'country') return citiesForCountry.map(c => ({ id: c.properties.NAME, name: c.properties.NAME, availability: c.properties.availability }));
    return countriesWithAvailability.map(c => ({ id: c.properties.ADM0_A3, name: c.properties.NAME, availability: c.properties.availability })).slice(0, 100);
  }, [view, storesForCity, citiesForCountry, countriesWithAvailability]);

  const sortedItems = useMemo(() => [...listItems].sort((a, b) => a.availability - b.availability), [listItems]);
  const paginatedItems = useMemo(() => sortedItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage), [sortedItems, page]);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  const handleCountryClick = (feature, layer) => { setSelectedCountry(feature); setView('country'); setPage(0); setMapBounds(layer.getBounds()); };
  const handleCityClick = (city) => { setSelectedCity(city); setView('city'); setPage(0); setMapBounds(null); setMapCenter([city.geometry.coordinates[1], city.geometry.coordinates[0]]); setMapZoom(13); };
  const handleBack = () => {
    if (view === 'city') { setSelectedCity(null); setView('country'); if (selectedCountry) setMapBounds(L.geoJSON(selectedCountry).getBounds()); }
    else if (view === 'country') { setSelectedCountry(null); setView('world'); setMapBounds(null); setMapCenter([30, 0]); setMapZoom(2); }
    setPage(0);
  };

  const onEachCountry = (feature, layer) => {
    layer.on({ click: () => handleCountryClick(feature, layer), mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9, weight: 2 }), mouseout: (e) => e.target.setStyle({ fillOpacity: 0.75, weight: 1 }) });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
          {view !== 'world' ? <button onClick={handleBack} className="p-1 hover:bg-gray-100 rounded"><ArrowLeft size={20} className="text-gray-600" /></button> : <button className="p-1 hover:bg-gray-100 rounded"><RefreshCw size={18} className="text-gray-400" /></button>}
          <span className="text-gray-700 font-medium">{currentTitle}</span>
        </div>

        <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" zoomControl={true}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
          <MapController bounds={mapBounds} center={mapCenter} zoom={mapZoom} />

          {view === 'world' && <GeoJSON key="world" data={{ type: 'FeatureCollection', features: countriesWithAvailability }} style={(f) => getPolygonStyle(f.properties.availability)} onEachFeature={onEachCountry} />}

          {view === 'country' && selectedCountry && (
            <>
              <GeoJSON key={`c-${selectedCountry.properties.ADM0_A3}`} data={selectedCountry} style={() => ({ fillColor: '#e5e7eb', fillOpacity: 0.4, weight: 2, color: '#9ca3af' })} />
              {citiesForCountry.map((city) => (
                <CircleMarker key={city.properties.NAME} center={[city.geometry.coordinates[1], city.geometry.coordinates[0]]} radius={22}
                  pathOptions={{ fillColor: getMarkerColor(city.properties.availability), fillOpacity: 0.9, color: '#fff', weight: 2 }}
                  eventHandlers={{ click: () => handleCityClick(city) }}>
                  <Tooltip permanent direction="center" className="availability-tooltip"><span style={{ color: '#fff', fontWeight: 600, fontSize: '11px' }}>{city.properties.availability}%</span></Tooltip>
                </CircleMarker>
              ))}
            </>
          )}

          {view === 'city' && selectedCity && storesForCity.map((store) => (
            <CircleMarker key={store.id} center={[selectedCity.geometry.coordinates[1] + store.offset.lat, selectedCity.geometry.coordinates[0] + store.offset.lng]} radius={20}
              pathOptions={{ fillColor: getMarkerColor(store.availability), fillOpacity: 0.9, color: '#fff', weight: 2 }}>
              <Tooltip permanent direction="center" className="availability-tooltip"><span style={{ color: '#fff', fontWeight: 600, fontSize: '10px' }}>{store.availability}%</span></Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="absolute bottom-6 left-4 z-[1000] bg-white px-3 py-2 rounded shadow-sm">
          <div className="h-3 w-28 rounded" style={{ background: 'linear-gradient(to right, #dc2626, #ea580c, #ca8a04, #84cc16, #22c55e)' }} />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span></div>
        </div>
      </div>

      <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3"><span className="font-semibold text-gray-700">AVAILABILITY</span><span>|</span><span className="uppercase">{view === 'world' ? 'REGIONS' : currentTitle}</span></div>
          <div className="flex items-center gap-3"><AvailabilityRing percentage={overallAvailability} size={52} /><span className="text-4xl font-light text-gray-800">{overallAvailability}%</span></div>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="text-xs font-medium text-gray-400 mb-3 tracking-wide">OVERALL DEVICE AVAILABILITY</div>
          <div className="space-y-1">
            {paginatedItems.map((item) => {
              const status = getStatus(item.availability);
              return (
                <div key={item.id} className="flex items-center gap-2.5 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
                  <AvailabilityRing percentage={item.availability} size={30} />
                  <span className="flex-1 text-sm text-gray-700 font-medium truncate">{item.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${status.color}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
          <span>{page * itemsPerPage + 1}–{Math.min((page + 1) * itemsPerPage, sortedItems.length)} of {sortedItems.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
