import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, Trash2, Calendar, DollarSign, Package,
  GripVertical, Clock, MapPin, Check, X, Edit2,
  Plane, Hotel, Utensils, ShoppingBag, Zap, MoreHorizontal,
  Map as MapIcon, Globe, Search, ChevronDown, ChevronRight,
  Car, CloudRain, Sun, BookOpen, Thermometer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  shadowUrl: markerShadow,
  iconRetinaUrl: markerIconPng,
});

// ─── Types ───────────────────────────────────────────────────────────────────

// 5 tabs instead of 7 — itinerary + map + weather are merged into "plan"
type TrekTab = 'trips' | 'plan' | 'bookings' | 'budget' | 'packing';
type ExpenseCategory = 'transport' | 'accommodation' | 'food' | 'activities' | 'shopping' | 'other';
type BookingType = 'flight' | 'hotel' | 'restaurant' | 'car' | 'activity' | 'other';

interface Trip {
  id: string; name: string; destination: string;
  startDate: string; endDate: string; emoji: string;
  lat: number | null; lng: number | null;
}
interface Activity {
  id: string; time: string; title: string;
  location: string; notes: string;
  lat: number | null; lng: number | null;
}
interface DayPlan { date: string; activities: Activity[]; }
interface Expense {
  id: string; category: ExpenseCategory; description: string;
  amount: number; currency: string; date: string;
}
interface PackItem {
  id: string; name: string; category: string; packed: boolean; qty: number;
}
interface Booking {
  id: string; type: BookingType; title: string;
  confirmation: string; date: string; time: string; notes: string;
}
interface WeatherDay {
  date: string; maxTemp: number; minTemp: number;
  precipitation: number; code: number;
}
interface TrekState {
  trips: Trip[];
  activeTrip: string | null;
  itineraries: Record<string, DayPlan[]>;
  expenses: Record<string, Expense[]>;
  packingLists: Record<string, PackItem[]>;
  bookings: Record<string, Booking[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }

function getDaysArray(start: string, end: string) {
  const days: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (cur <= endDate) {
    days.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

async function geocodePlace(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EXPENSE_CATS: Record<ExpenseCategory, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  transport:     { label: 'Transport',     color: 'bg-blue-500',   Icon: Plane },
  accommodation: { label: 'Accommodation', color: 'bg-purple-500', Icon: Hotel },
  food:          { label: 'Food & Drink',  color: 'bg-orange-500', Icon: Utensils },
  activities:    { label: 'Activities',    color: 'bg-green-500',  Icon: Zap },
  shopping:      { label: 'Shopping',      color: 'bg-pink-500',   Icon: ShoppingBag },
  other:         { label: 'Other',         color: 'bg-gray-500',   Icon: MoreHorizontal },
};

const BOOKING_TYPES: Record<BookingType, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  flight:     { label: 'Flight',     color: 'bg-sky-500',     Icon: Plane },
  hotel:      { label: 'Hotel',      color: 'bg-violet-500',  Icon: Hotel },
  restaurant: { label: 'Restaurant', color: 'bg-amber-500',   Icon: Utensils },
  car:        { label: 'Car Rental', color: 'bg-teal-500',    Icon: Car },
  activity:   { label: 'Activity',   color: 'bg-emerald-500', Icon: Zap },
  other:      { label: 'Other',      color: 'bg-gray-500',    Icon: MoreHorizontal },
};

const TRAVEL_EMOJIS = ['✈️','🌍','🏖️','🏔️','🗺️','🌏','🏕️','🗼','🏯','🌴','🚂','⛵'];
const PACK_CATEGORIES = ['Clothes', 'Toiletries', 'Electronics', 'Documents', 'Health', 'Misc'];

const PACKING_TEMPLATES = [
  { id: 'beach', name: 'Beach Trip', emoji: '🏖️', items: [
    { name: 'Swimsuit', category: 'Clothes', qty: 2 },
    { name: 'Sunscreen SPF 50', category: 'Toiletries', qty: 1 },
    { name: 'Sunglasses', category: 'Clothes', qty: 1 },
    { name: 'Beach towel', category: 'Misc', qty: 2 },
    { name: 'Flip flops', category: 'Clothes', qty: 1 },
    { name: 'After-sun lotion', category: 'Toiletries', qty: 1 },
  ]},
  { id: 'business', name: 'Business Trip', emoji: '💼', items: [
    { name: 'Laptop', category: 'Electronics', qty: 1 },
    { name: 'Laptop charger', category: 'Electronics', qty: 1 },
    { name: 'Business cards', category: 'Documents', qty: 1 },
    { name: 'Dress shirt', category: 'Clothes', qty: 3 },
    { name: 'Dress pants', category: 'Clothes', qty: 2 },
  ]},
  { id: 'camping', name: 'Camping', emoji: '🏕️', items: [
    { name: 'Tent', category: 'Misc', qty: 1 },
    { name: 'Sleeping bag', category: 'Misc', qty: 1 },
    { name: 'Flashlight', category: 'Electronics', qty: 1 },
    { name: 'First aid kit', category: 'Health', qty: 1 },
    { name: 'Water bottle', category: 'Misc', qty: 2 },
    { name: 'Insect repellent', category: 'Health', qty: 1 },
  ]},
  { id: 'winter', name: 'Winter Trip', emoji: '❄️', items: [
    { name: 'Winter jacket', category: 'Clothes', qty: 1 },
    { name: 'Thermal underwear', category: 'Clothes', qty: 2 },
    { name: 'Gloves', category: 'Clothes', qty: 1 },
    { name: 'Wool socks', category: 'Clothes', qty: 3 },
    { name: 'Beanie', category: 'Clothes', qty: 1 },
    { name: 'Hand warmers', category: 'Misc', qty: 4 },
  ]},
  { id: 'city', name: 'City Break', emoji: '🏙️', items: [
    { name: 'Comfortable shoes', category: 'Clothes', qty: 1 },
    { name: 'Power bank', category: 'Electronics', qty: 1 },
    { name: 'Day bag', category: 'Misc', qty: 1 },
    { name: 'Umbrella', category: 'Misc', qty: 1 },
    { name: 'Guidebook', category: 'Documents', qty: 1 },
  ]},
];

const WMO: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear sky',     emoji: '☀️' },
  1:  { label: 'Mainly clear',  emoji: '🌤️' },
  2:  { label: 'Partly cloudy', emoji: '⛅' },
  3:  { label: 'Overcast',      emoji: '☁️' },
  45: { label: 'Fog',           emoji: '🌫️' },
  48: { label: 'Icy fog',       emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle',       emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌦️' },
  61: { label: 'Slight rain',   emoji: '🌧️' },
  63: { label: 'Rain',          emoji: '🌧️' },
  65: { label: 'Heavy rain',    emoji: '🌧️' },
  71: { label: 'Light snow',    emoji: '🌨️' },
  73: { label: 'Snow',          emoji: '🌨️' },
  75: { label: 'Heavy snow',    emoji: '🌨️' },
  80: { label: 'Showers',       emoji: '🌦️' },
  81: { label: 'Showers',       emoji: '🌦️' },
  82: { label: 'Heavy showers', emoji: '🌦️' },
  85: { label: 'Snow showers',  emoji: '🌨️' },
  86: { label: 'Snow showers',  emoji: '🌨️' },
  95: { label: 'Thunderstorm',  emoji: '⛈️' },
  96: { label: 'Thunderstorm',  emoji: '⛈️' },
  99: { label: 'Thunderstorm',  emoji: '⛈️' },
};
function wmo(code: number) { return WMO[code] ?? { label: 'Unknown', emoji: '🌡️' }; }

// ─── Map helpers ──────────────────────────────────────────────────────────────

function MapCenterer({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 12); }, [center, map]);
  return null;
}

function NoTripSelected({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
      <Plane className="w-12 h-12 opacity-30" />
      <p className="text-sm">No trip selected.</p>
      <Button variant="outline" size="sm" onClick={onSwitch}>Go to My Trips</Button>
    </div>
  );
}

// ─── Plan View — split panel: day list (left) + map + weather (right) ─────────

interface PlanViewProps {
  trip: Trip;
  itinerary: DayPlan[];
  weather: WeatherDay[];
  weatherLoading: boolean;
  onUpdateItinerary: (days: DayPlan[]) => void;
}

function PlanView({ trip, itinerary, weather, weatherLoading, onUpdateItinerary }: PlanViewProps) {
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newAct, setNewAct] = useState({ time: '', title: '', location: '', notes: '' });
  const [geocodingId, setGeocodingId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    trip.lat && trip.lng ? [trip.lat, trip.lng] : [20, 0]
  );

  const days = getDaysArray(trip.startDate, trip.endDate);
  const weatherByDate = Object.fromEntries(weather.map(w => [w.date, w]));

  const markers: { lat: number; lng: number; label: string; day: number }[] = [];
  itinerary.forEach((day, i) => {
    day.activities.forEach(act => {
      if (act.lat && act.lng) markers.push({ lat: act.lat, lng: act.lng, label: act.title, day: i + 1 });
    });
  });

  function getDayPlan(date: string): DayPlan {
    return itinerary.find(d => d.date === date) ?? { date, activities: [] };
  }

  function upsertDays(updated: DayPlan[]) {
    const merged = [...itinerary];
    for (const day of updated) {
      const idx = merged.findIndex(d => d.date === day.date);
      if (idx >= 0) merged[idx] = day; else merged.push(day);
    }
    onUpdateItinerary(merged);
  }

  function addActivity(date: string) {
    if (!newAct.title.trim()) return;
    const day = getDayPlan(date);
    upsertDays([{ ...day, activities: [...day.activities, { id: genId(), ...newAct, lat: null, lng: null }] }]);
    setNewAct({ time: '', title: '', location: '', notes: '' });
    setAddingDay(null);
  }

  function removeActivity(date: string, actId: string) {
    const day = getDayPlan(date);
    upsertDays([{ ...day, activities: day.activities.filter(a => a.id !== actId) }]);
  }

  async function geocodeActivity(date: string, actId: string, location: string) {
    setGeocodingId(actId);
    const coords = await geocodePlace(location);
    setGeocodingId(null);
    if (!coords) return;
    const day = getDayPlan(date);
    upsertDays([{ ...day, activities: day.activities.map(a => a.id === actId ? { ...a, ...coords } : a) }]);
    setMapCenter([coords.lat, coords.lng]);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const srcDate = result.source.droppableId;
    const dstDate = result.destination.droppableId;
    const srcDay = getDayPlan(srcDate);
    const dstDay = getDayPlan(dstDate);
    if (srcDate === dstDate) {
      const acts = [...srcDay.activities];
      const [moved] = acts.splice(result.source.index, 1);
      acts.splice(result.destination.index, 0, moved);
      upsertDays([{ ...srcDay, activities: acts }]);
    } else {
      const srcActs = [...srcDay.activities];
      const dstActs = [...dstDay.activities];
      const [moved] = srcActs.splice(result.source.index, 1);
      dstActs.splice(result.destination.index, 0, moved);
      upsertDays([{ ...srcDay, activities: srcActs }, { ...dstDay, activities: dstActs }]);
    }
  }

  async function handleMapSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const coords = await geocodePlace(searchQuery);
    setSearching(false);
    if (coords) {
      setSearchResult({ ...coords, label: searchQuery });
      setMapCenter([coords.lat, coords.lng]);
    }
  }

  function toggleDay(date: string) {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  const panelH = 'calc(100vh - 240px)';

  return (
    <div className="flex gap-4" style={{ height: panelH }}>

      {/* ── LEFT: Day list ── */}
      <div className="w-[400px] shrink-0 overflow-y-auto pr-1 space-y-2">
        <h2 className="text-base font-semibold sticky top-0 bg-background/90 backdrop-blur py-2 z-10">
          {trip.emoji} {trip.name}
          <span className="text-muted-foreground font-normal text-sm ml-2">
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </span>
        </h2>

        <DragDropContext onDragEnd={onDragEnd}>
          {days.map((date, i) => {
            const day = getDayPlan(date);
            const isOpen = expandedDays.has(date);
            const w = weatherByDate[date];

            return (
              <Card key={date} className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleDay(date)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className="font-semibold text-sm shrink-0">Day {i + 1}</span>
                    <span className="text-muted-foreground text-xs truncate">{formatDate(date)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {w && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{wmo(w.code).emoji}</span>
                        <span>{Math.round(w.maxTemp)}°/{Math.round(w.minTemp)}°</span>
                      </span>
                    )}
                    {day.activities.length > 0 && (
                      <Badge variant="secondary" className="text-xs py-0">{day.activities.length}</Badge>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-1.5 border-t">
                    <Droppable droppableId={date}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 pt-2 min-h-[4px]">
                          {day.activities.map((act, idx) => (
                            <Draggable key={act.id} draggableId={act.id} index={idx}>
                              {(drag) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  className="flex items-start gap-2 p-2.5 rounded-lg border bg-background/60 group text-sm"
                                >
                                  <div {...drag.dragHandleProps} className="mt-0.5 cursor-grab text-muted-foreground shrink-0">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {act.time && (
                                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                          <Clock className="w-3 h-3" />{act.time}
                                        </span>
                                      )}
                                      <span className="font-medium">{act.title}</span>
                                    </div>
                                    {act.location && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                        <span className="text-xs text-muted-foreground truncate">{act.location}</span>
                                        {act.lat ? (
                                          <button
                                            className="text-xs text-primary hover:underline shrink-0"
                                            onClick={() => setMapCenter([act.lat!, act.lng!])}
                                          >view</button>
                                        ) : (
                                          <button
                                            className="text-xs text-primary hover:underline shrink-0"
                                            onClick={() => geocodeActivity(date, act.id, act.location)}
                                            disabled={geocodingId === act.id}
                                          >{geocodingId === act.id ? 'locating…' : 'pin'}</button>
                                        )}
                                      </div>
                                    )}
                                    {act.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.notes}</p>}
                                  </div>
                                  <button onClick={() => removeActivity(date, act.id)} className="opacity-0 group-hover:opacity-100 text-destructive shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {addingDay === date ? (
                      <div className="border rounded-lg p-2.5 space-y-2 bg-background/60 mt-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Time</Label>
                            <Input type="time" value={newAct.time} onChange={e => setNewAct(p => ({ ...p, time: e.target.value }))} className="h-7 text-xs mt-0.5" />
                          </div>
                          <div>
                            <Label className="text-xs">Activity *</Label>
                            <Input placeholder="Visit museum" value={newAct.title} onChange={e => setNewAct(p => ({ ...p, title: e.target.value }))} className="h-7 text-xs mt-0.5" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Location</Label>
                          <Input placeholder="e.g. Eiffel Tower" value={newAct.location} onChange={e => setNewAct(p => ({ ...p, location: e.target.value }))} className="h-7 text-xs mt-0.5" />
                        </div>
                        <Textarea placeholder="Notes…" value={newAct.notes} onChange={e => setNewAct(p => ({ ...p, notes: e.target.value }))} className="h-12 text-xs resize-none" />
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs" onClick={() => addActivity(date)}><Check className="w-3 h-3 mr-1" />Add</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingDay(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="w-full mt-1 text-xs text-muted-foreground border border-dashed rounded-md py-1.5 hover:text-foreground hover:border-foreground/30 transition-colors"
                        onClick={() => { setAddingDay(date); setExpandedDays(prev => new Set([...prev, date])); }}
                      >
                        + Add activity
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </DragDropContext>
      </div>

      {/* ── RIGHT: Map + Weather ── */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">

        {/* Map search */}
        <div className="flex gap-2 shrink-0">
          <Input
            placeholder="Search a place on the map…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMapSearch()}
            className="h-9"
          />
          <Button size="sm" onClick={handleMapSearch} disabled={searching} className="shrink-0">
            <Search className="w-4 h-4 mr-1" />{searching ? '…' : 'Search'}
          </Button>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border shrink-0" style={{ height: '320px' }}>
          <MapContainer center={mapCenter} zoom={trip.lat ? 11 : 3} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterer center={mapCenter} />
            {searchResult && (
              <Marker position={[searchResult.lat, searchResult.lng]}>
                <Popup>{searchResult.label}</Popup>
              </Marker>
            )}
            {markers.map((m, i) => (
              <Marker key={i} position={[m.lat, m.lng]}>
                <Popup><strong>{m.label}</strong><br /><span className="text-xs">Day {m.day}</span></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Weather forecast */}
        <div className="shrink-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            {weatherLoading ? 'Loading forecast…' : !trip.lat ? 'Forecast unavailable — pin destination first' : `16-Day Forecast · ${trip.destination}`}
          </p>
          {!weatherLoading && weather.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {days.map((date, i) => {
                const w = weatherByDate[date];
                if (!w) return (
                  <div key={date} className="flex items-center gap-2 p-2 rounded-lg border bg-card/40 opacity-50">
                    <span className="text-lg">—</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">Day {i + 1} · {formatDate(date)}</p>
                      <p className="text-xs text-muted-foreground">Outside 16-day window</p>
                    </div>
                  </div>
                );
                const { label, emoji } = wmo(w.code);
                return (
                  <div key={date} className="flex items-center gap-2 p-2 rounded-lg border bg-card/40 hover:bg-card/70 transition-colors">
                    <span className="text-xl shrink-0">{emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">Day {i + 1} · {formatDate(date)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Thermometer className="w-3 h-3" />
                          <span className="text-foreground font-medium">{Math.round(w.maxTemp)}°</span>
                          <span>/{Math.round(w.minTemp)}°</span>
                        </span>
                        <span className="truncate">{label}</span>
                        {w.precipitation > 0 && <span className="shrink-0">{w.precipitation.toFixed(1)}mm</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned locations list */}
        {markers.length > 0 && (
          <div className="shrink-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Pinned locations
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {markers.map((m, i) => (
                <button
                  key={i}
                  className="flex items-center gap-2 text-xs p-2 rounded-lg border bg-card/40 hover:bg-card/70 text-left transition-colors"
                  onClick={() => setMapCenter([m.lat, m.lng])}
                >
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{m.label}</span>
                  <Badge variant="outline" className="ml-auto shrink-0 text-xs py-0">D{m.day}</Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bookings View ────────────────────────────────────────────────────────────

interface BookingsViewProps {
  trip: Trip; bookings: Booking[];
  onAdd: (b: Booking) => void; onRemove: (id: string) => void;
}

function BookingsView({ trip, bookings, onAdd, onRemove }: BookingsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Booking, 'id'>>({
    type: 'flight', title: '', confirmation: '', date: '', time: '', notes: '',
  });

  function submit() {
    if (!form.title.trim() || !form.date) return;
    onAdd({ id: genId(), ...form });
    setForm({ type: 'flight', title: '', confirmation: '', date: '', time: '', notes: '' });
    setShowForm(false);
  }

  const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reservations</h2>
          <p className="text-xs text-muted-foreground">Flights, hotels, restaurants & more</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}><Plus className="w-4 h-4 mr-1" />Add Booking</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as BookingType }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                  {Object.entries(BOOKING_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Title *</Label>
                <Input placeholder="e.g. SQ 321 Singapore → London" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Confirmation #</Label>
                <Input placeholder="ABC123" value={form.confirmation} onChange={e => setForm(p => ({ ...p, confirmation: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Date *</Label>
                <Input type="date" value={form.date} min={trip.startDate} max={trip.endDate} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Gate, address, contact…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-14 text-sm resize-none mt-1" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submit}><Check className="w-3 h-3 mr-1" />Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <BookOpen className="w-10 h-10 opacity-20" />
          <p className="text-sm">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(b => {
            const { Icon, color, label } = BOOKING_TYPES[b.type];
            return (
              <Card key={b.id} className="group">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${color} text-white shrink-0`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{b.title}</p>
                        {b.confirmation && <Badge variant="outline" className="text-xs font-mono">{b.confirmation}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{label} · {formatDate(b.date)}{b.time ? ` · ${b.time}` : ''}</p>
                      {b.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{b.notes}</p>}
                    </div>
                    <button onClick={() => onRemove(b.id)} className="opacity-0 group-hover:opacity-100 text-destructive shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Budget View ──────────────────────────────────────────────────────────────

function BudgetView({ trip, expenses, onAdd, onRemove }: { trip: Trip; expenses: Expense[]; onAdd: (e: Expense) => void; onRemove: (id: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    category: 'other', description: '', amount: 0, currency: 'USD',
    date: new Date().toISOString().split('T')[0],
  });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = (Object.keys(EXPENSE_CATS) as ExpenseCategory[]).map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  function submit() {
    if (!form.description.trim() || form.amount <= 0) return;
    onAdd({ id: genId(), ...form });
    setForm({ category: 'other', description: '', amount: 0, currency: 'USD', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Budget Tracker</h2>
          <p className="text-xs text-muted-foreground">{trip.emoji} {trip.name}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}><Plus className="w-4 h-4 mr-1" />Add Expense</Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold">${total.toFixed(2)}</span>
            <span className="text-muted-foreground text-sm">total spent</span>
          </div>
          {byCategory.length > 0 && (
            <div className="space-y-2">
              {byCategory.map(({ cat, total: catTotal }) => {
                const { color, label, Icon } = EXPENSE_CATS[cat];
                const pct = total > 0 ? (catTotal / total) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1"><Icon className="w-3 h-3" />{label}</span>
                      <span className="font-medium">${catTotal.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                  {Object.entries(EXPENSE_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                  {['USD','EUR','GBP','JPY','AUD','CAD','CHF','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Input placeholder="e.g. Flight ticket" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-9 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submit}><Check className="w-3 h-3 mr-1" />Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No expenses yet.</p>
        ) : (
          [...expenses].sort((a, b) => b.date.localeCompare(a.date)).map(exp => {
            const { Icon, label } = EXPENSE_CATS[exp.category];
            return (
              <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 group">
                <div className={`p-1.5 rounded-md ${EXPENSE_CATS[exp.category].color} text-white`}><Icon className="w-3.5 h-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{label} · {exp.date}</p>
                </div>
                <span className="font-semibold text-sm shrink-0">{exp.currency} {exp.amount.toFixed(2)}</span>
                <button onClick={() => onRemove(exp.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="w-4 h-4" /></button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Packing View ─────────────────────────────────────────────────────────────

function PackingView({ trip, items, onAdd, onAddMany, onToggle, onRemove }: {
  trip: Trip; items: PackItem[];
  onAdd: (i: PackItem) => void; onAddMany: (i: PackItem[]) => void;
  onToggle: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Misc', qty: 1 });

  const packed = items.filter(i => i.packed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

  const grouped = PACK_CATEGORIES.reduce<Record<string, PackItem[]>>((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const extra = items.filter(i => !PACK_CATEGORIES.includes(i.category));
  if (extra.length) grouped['Other'] = extra;

  function applyTemplate(tpl: typeof PACKING_TEMPLATES[0]) {
    const existing = new Set(items.map(i => i.name.toLowerCase()));
    const newItems = tpl.items.filter(i => !existing.has(i.name.toLowerCase())).map(i => ({ id: genId(), ...i, packed: false }));
    if (newItems.length) onAddMany(newItems);
    setShowTemplates(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Packing List</h2>
          <p className="text-xs text-muted-foreground">{trip.emoji} {trip.name}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowTemplates(v => !v); setShowForm(false); }}>Templates</Button>
          <Button size="sm" onClick={() => { setShowForm(v => !v); setShowTemplates(false); }}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
        </div>
      </div>

      {showTemplates && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-3">Choose a starter template</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PACKING_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors text-left">
                  <span className="text-xl">{tpl.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{tpl.items.length} items</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Items already in your list are skipped.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{packed}/{total} packed · {pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Item name *</Label>
                <Input placeholder="e.g. Sunscreen" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Qty</Label>
                <Input type="number" min="1" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))} className="h-9 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1">
                {PACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { if (!form.name.trim()) return; onAdd({ id: genId(), ...form, packed: false }); setForm({ name: '', category: 'Misc', qty: 1 }); setShowForm(false); }}>
                <Check className="w-3 h-3 mr-1" />Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
          <div className="space-y-1">
            {catItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card/50 group">
                <button onClick={() => onToggle(item.id)} className="shrink-0">
                  {item.packed
                    ? <Check className="w-4 h-4 text-primary" />
                    : <div className="w-4 h-4 rounded border border-muted-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${item.packed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}{item.qty > 1 && <span className="text-muted-foreground ml-1">×{item.qty}</span>}
                </span>
                <button onClick={() => onRemove(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {total === 0 && <p className="text-sm text-muted-foreground text-center py-8">Use a template or add items to start packing!</p>}
    </div>
  );
}

// ─── Trips View ───────────────────────────────────────────────────────────────

const BLANK_FORM = { name: '', destination: '', startDate: '', endDate: '', emoji: '✈️' };

function TripForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: typeof BLANK_FORM; submitLabel: string;
  onSubmit: (v: typeof BLANK_FORM) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof typeof BLANK_FORM>(key: K, value: string) {
    setForm(p => {
      const next = { ...p, [key]: value };
      if (key === 'startDate' && next.endDate && next.endDate < value) next.endDate = '';
      return next;
    });
  }

  function handleSubmit() {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('Trip name is required.');
    if (!form.destination.trim()) errs.push('Destination is required.');
    if (!form.startDate) errs.push('Start date is required.');
    if (!form.endDate) errs.push('End date is required.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]); onSubmit(form);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Emoji</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {TRAVEL_EMOJIS.map(e => (
            <button key={e} onClick={() => set('emoji', e)}
              className={`text-lg p-1 rounded-md transition-colors ${form.emoji === e ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Trip name *</Label>
          <Input placeholder="Summer in Japan" value={form.name} onChange={e => set('name', e.target.value)} className="h-9 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Destination *</Label>
          <Input placeholder="Tokyo, Japan" value={form.destination} onChange={e => set('destination', e.target.value)} className="h-9 text-sm mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start date *</Label>
          <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="h-9 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">End date *</Label>
          <Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => set('endDate', e.target.value)} className="h-9 text-sm mt-1" />
        </div>
      </div>
      {errors.length > 0 && <div className="text-xs text-destructive space-y-0.5">{errors.map((e, i) => <p key={i}>• {e}</p>)}</div>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit}><Check className="w-3 h-3 mr-1" />{submitLabel}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function TripsView({ trips, activeTrip, onSelect, onDelete, onCreate, onEdit, onUpdateCoords }: {
  trips: Trip[]; activeTrip: string | null;
  onSelect: (id: string) => void; onDelete: (id: string) => void;
  onCreate: (t: Trip) => void; onEdit: (t: Trip) => void;
  onUpdateCoords: (id: string, lat: number, lng: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleCreate(v: typeof BLANK_FORM) {
    const trip: Trip = { id: genId(), name: v.name.trim(), destination: v.destination.trim(), startDate: v.startDate, endDate: v.endDate, emoji: v.emoji, lat: null, lng: null };
    onCreate(trip);
    setShowForm(false);
    geocodePlace(v.destination.trim()).then(c => { if (c) onUpdateCoords(trip.id, c.lat, c.lng); });
  }

  function handleEdit(trip: Trip, v: typeof BLANK_FORM) {
    const destChanged = v.destination.trim() !== trip.destination;
    onEdit({ ...trip, name: v.name.trim(), destination: v.destination.trim(), startDate: v.startDate, endDate: v.endDate, emoji: v.emoji, lat: destChanged ? null : trip.lat, lng: destChanged ? null : trip.lng });
    setEditingId(null);
    if (destChanged) geocodePlace(v.destination.trim()).then(c => { if (c) onUpdateCoords(trip.id, c.lat, c.lng); });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Trips</h2>
        <Button size="sm" onClick={() => { setShowForm(v => !v); setEditingId(null); }}>
          <Plus className="w-4 h-4 mr-1" />New Trip
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create a new trip</CardTitle></CardHeader>
          <CardContent><TripForm initial={BLANK_FORM} submitLabel="Create Trip" onSubmit={handleCreate} onCancel={() => setShowForm(false)} /></CardContent>
        </Card>
      )}

      {trips.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Plane className="w-16 h-16 opacity-20" />
          <p className="font-medium">No trips yet</p>
          <p className="text-sm">Create your first trip to start planning!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trips.map(trip => {
            const isActive = trip.id === activeTrip;
            const isEditing = editingId === trip.id;
            return (
              <Card key={trip.id}
                className={`transition-all ${!isEditing ? 'cursor-pointer hover:shadow-md' : ''} ${isActive ? 'ring-2 ring-primary' : ''}`}
                onClick={() => { if (!isEditing) onSelect(trip.id); }}>
                <CardContent className="py-4">
                  {isEditing ? (
                    <div onClick={e => e.stopPropagation()}>
                      <p className="text-sm font-semibold mb-3">Edit trip</p>
                      <TripForm
                        initial={{ name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, emoji: trip.emoji }}
                        submitLabel="Save Changes"
                        onSubmit={v => handleEdit(trip, v)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-3xl">{trip.emoji}</span>
                        <h3 className="font-semibold mt-1">{trip.name}</h3>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5"><MapPin className="w-3 h-3" />{trip.destination}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Calendar className="w-3 h-3" />{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isActive && <Badge className="text-xs">Active</Badge>}
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); setEditingId(trip.id); setShowForm(false); }} className="text-muted-foreground opacity-50 hover:opacity-100">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDelete(trip.id); }} className="text-destructive opacity-50 hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main TrekPage ────────────────────────────────────────────────────────────

export function TrekPage({ siteJwt }: { siteJwt: string | null }) {
  if (!siteJwt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-muted-foreground">
        <Plane className="w-14 h-14 opacity-20" />
        <p className="font-medium">Sign in and enter the access code to use Trek.</p>
        <p className="text-sm opacity-70">Use the login button in the top-right corner.</p>
      </div>
    );
  }
  return <TrekContent siteJwt={siteJwt} />;
}

// ─── TrekContent — authenticated, all hooks here ──────────────────────────────

function TrekContent({ siteJwt }: { siteJwt: string }) {
  const API = import.meta.env.VITE_API_URL as string;

  const apiFetch = useCallback((path: string, opts?: RequestInit) =>
    fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${siteJwt}`,
        ...(opts?.headers as Record<string, string> ?? {}),
      },
    }), [siteJwt, API]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packItems, setPackItems] = useState<PackItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TrekTab>('trips');
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Ref always holds the latest trip data for the debounced save closure
  const latestDataRef = useRef({ itinerary, expenses, packItems, bookings });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestDataRef.current = { itinerary, expenses, packItems, bookings };
  }, [itinerary, expenses, packItems, bookings]);

  const activeTrip = trips.find(t => t.id === activeTripId) ?? null;

  // ── Load trips on mount ────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/trek/trips')
      .then(r => r.json())
      .then(({ trips: t }: { trips: Trip[] }) => {
        setTrips(t);
        if (t.length > 0) setActiveTripId(t[0].id);
      })
      .catch(console.error)
      .finally(() => setTripsLoading(false));
  }, [apiFetch]);

  // ── Load trip state when active trip changes ───────────────────────────────
  useEffect(() => {
    if (!activeTripId) {
      setItinerary([]); setExpenses([]); setPackItems([]); setBookings([]);
      return;
    }
    setStateLoading(true);
    setItinerary([]); setExpenses([]); setPackItems([]); setBookings([]);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    apiFetch(`/api/trek/trips/${activeTripId}/state`)
      .then(r => r.json())
      .then(({ state: s }: { state: { itinerary?: DayPlan[]; expenses?: Expense[]; packingList?: PackItem[]; bookings?: Booking[] } | null }) => {
        if (s) {
          setItinerary(s.itinerary ?? []);
          setExpenses(s.expenses ?? []);
          setPackItems(s.packingList ?? []);
          setBookings(s.bookings ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setStateLoading(false));
  }, [activeTripId, apiFetch]);

  // ── Weather ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'plan' || !activeTrip?.lat || !activeTrip?.lng || weather.length > 0) return;
    fetchWeather(activeTrip.lat, activeTrip.lng);
  }, [activeTab, activeTrip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchWeather(lat: number, lng: number) {
    setWeatherLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=16`;
      const data = await (await fetch(url)).json();
      if (data.daily) {
        setWeather(data.daily.time.map((date: string, i: number) => ({
          date,
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          precipitation: data.daily.precipitation_sum[i] ?? 0,
          code: data.daily.weathercode[i],
        })));
      }
    } catch { /* ignore */ }
    setWeatherLoading(false);
  }

  // ── Debounced save ─────────────────────────────────────────────────────────
  function scheduleSave() {
    const tid = activeTripId;
    if (!tid || stateLoading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { itinerary: itin, expenses: exps, packItems: pack, bookings: bks } = latestDataRef.current;
      apiFetch(`/api/trek/trips/${tid}/state`, {
        method: 'PUT',
        body: JSON.stringify({ itinerary: itin, expenses: exps, packingList: pack, bookings: bks }),
      }).catch(console.error);
    }, 500);
  }

  // ── Trip handlers ──────────────────────────────────────────────────────────
  function createTrip(trip: Trip) {
    // Optimistic: add to local state immediately so geocode can find the trip
    setTrips(ts => [...ts, trip]);
    setActiveTripId(trip.id);
    setWeather([]);
    setActiveTab('plan');
    apiFetch('/api/trek/trips', {
      method: 'POST',
      body: JSON.stringify(trip),
    }).catch(console.error);
  }

  function updateTripCoords(id: string, lat: number, lng: number) {
    setTrips(ts => ts.map(t => t.id === id ? { ...t, lat, lng } : t));
    apiFetch(`/api/trek/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ lat, lng }),
    }).catch(console.error);
  }

  function editTrip(t: Trip) {
    setTrips(ts => ts.map(x => x.id === t.id ? t : x));
    setWeather([]);
    apiFetch(`/api/trek/trips/${t.id}`, {
      method: 'PUT',
      body: JSON.stringify(t),
    }).catch(console.error);
  }

  function selectTrip(id: string) {
    setActiveTripId(id);
    setWeather([]);
    setActiveTab('plan');
  }

  function deleteTrip(id: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setTrips(ts => {
      const remaining = ts.filter(t => t.id !== id);
      setActiveTripId(activeTripId === id ? (remaining[0]?.id ?? null) : activeTripId);
      return remaining;
    });
    apiFetch(`/api/trek/trips/${id}`, { method: 'DELETE' }).catch(console.error);
  }

  function updateItinerary(days: DayPlan[]) {
    setItinerary(days);
    latestDataRef.current = { ...latestDataRef.current, itinerary: days };
    scheduleSave();
  }

  function addExpense(exp: Expense) {
    setExpenses(es => {
      const next = [...es, exp];
      latestDataRef.current = { ...latestDataRef.current, expenses: next };
      scheduleSave();
      return next;
    });
  }

  function removeExpense(id: string) {
    setExpenses(es => {
      const next = es.filter(e => e.id !== id);
      latestDataRef.current = { ...latestDataRef.current, expenses: next };
      scheduleSave();
      return next;
    });
  }

  function addPackItem(item: PackItem) {
    setPackItems(ps => {
      const next = [...ps, item];
      latestDataRef.current = { ...latestDataRef.current, packItems: next };
      scheduleSave();
      return next;
    });
  }

  function addPackItems(items: PackItem[]) {
    setPackItems(ps => {
      const next = [...ps, ...items];
      latestDataRef.current = { ...latestDataRef.current, packItems: next };
      scheduleSave();
      return next;
    });
  }

  function togglePackItem(id: string) {
    setPackItems(ps => {
      const next = ps.map(i => i.id === id ? { ...i, packed: !i.packed } : i);
      latestDataRef.current = { ...latestDataRef.current, packItems: next };
      scheduleSave();
      return next;
    });
  }

  function removePackItem(id: string) {
    setPackItems(ps => {
      const next = ps.filter(i => i.id !== id);
      latestDataRef.current = { ...latestDataRef.current, packItems: next };
      scheduleSave();
      return next;
    });
  }

  function addBooking(b: Booking) {
    setBookings(bs => {
      const next = [...bs, b];
      latestDataRef.current = { ...latestDataRef.current, bookings: next };
      scheduleSave();
      return next;
    });
  }

  function removeBooking(id: string) {
    setBookings(bs => {
      const next = bs.filter(b => b.id !== id);
      latestDataRef.current = { ...latestDataRef.current, bookings: next };
      scheduleSave();
      return next;
    });
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: { id: TrekTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'trips',    label: 'My Trips', Icon: Globe },
    { id: 'plan',     label: 'Plan',     Icon: MapIcon },
    { id: 'bookings', label: 'Bookings', Icon: BookOpen },
    { id: 'budget',   label: 'Budget',   Icon: DollarSign },
    { id: 'packing',  label: 'Packing',  Icon: Package },
  ];

  const isPlan = activeTab === 'plan';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (tripsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex gap-1 mb-6 border-b pb-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-9 w-20 rounded bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`${isPlan ? 'max-w-full' : 'max-w-4xl'} mx-auto px-4 py-6 transition-all`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shrink-0">
          <Plane className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">TREK</h1>
          <p className="text-xs text-muted-foreground">Your personal travel planner</p>
        </div>
        {activeTrip && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-base">{activeTrip.emoji}</span>
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{activeTrip.name}</p>
              <p className="text-xs text-muted-foreground">{activeTrip.destination}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}

        {/* Trip switcher */}
        {trips.length > 1 && (
          <div className="ml-auto flex items-center gap-1 pb-1">
            {trips.map(t => (
              <button
                key={t.id}
                onClick={() => selectTrip(t.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${t.id === activeTripId ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <span>{t.emoji}</span><span className="max-w-[80px] truncate">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* State loading indicator */}
      {stateLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading trip data…
        </div>
      )}

      {/* Content */}
      {activeTab === 'trips' && (
        <TripsView trips={trips} activeTrip={activeTripId} onSelect={selectTrip} onDelete={deleteTrip} onCreate={createTrip} onEdit={editTrip} onUpdateCoords={updateTripCoords} />
      )}
      {activeTab === 'plan' && (
        activeTrip
          ? <PlanView trip={activeTrip} itinerary={itinerary} weather={weather} weatherLoading={weatherLoading} onUpdateItinerary={updateItinerary} />
          : <NoTripSelected onSwitch={() => setActiveTab('trips')} />
      )}
      {activeTab === 'bookings' && (
        activeTrip ? <BookingsView trip={activeTrip} bookings={bookings} onAdd={addBooking} onRemove={removeBooking} /> : <NoTripSelected onSwitch={() => setActiveTab('trips')} />
      )}
      {activeTab === 'budget' && (
        activeTrip ? <BudgetView trip={activeTrip} expenses={expenses} onAdd={addExpense} onRemove={removeExpense} /> : <NoTripSelected onSwitch={() => setActiveTab('trips')} />
      )}
      {activeTab === 'packing' && (
        activeTrip ? <PackingView trip={activeTrip} items={packItems} onAdd={addPackItem} onAddMany={addPackItems} onToggle={togglePackItem} onRemove={removePackItem} /> : <NoTripSelected onSwitch={() => setActiveTab('trips')} />
      )}
    </div>
  );
}
