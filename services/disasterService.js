const normalizeZone = ({
  id,
  type,
  lat,
  lng,
  radius,
  severity,
  message,
  location,
  icon,
}) => ({
  id,
  type,
  lat,
  lng,
  radius,
  severity,
  message,
  location,
  icon,
});

// Earthquake Data
// Fetches earhquake data from USGS
export async function fetchEarthquakes() {
  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson',
    );
    const data = await response.json();

    return data.features.map(quake =>
      normalizeZone({
        id: quake.id,
        type: 'Earthquake',
        lat: quake.geometry.coordinates[1],
        lng: quake.geometry.coordinates[0],
        radius: 150,
        severity: quake.properties.mag >= 6 ? 'critical' : 'high',
        message: quake.properties.title,
        location: quake.properties.place,
        icon: '🌎',
      }),
    );
  } catch (err) {
    console.log('Earthquake fetch failed', err);
    return [];
  }
}
// NOAA Weather Alerts
// Fetches active weather alerts from NOAA
export async function fetchNOAAAlerts() {
  try {
    const response = await fetch('https://api.weather.gov/alerts/active');
    const data = await response.json();

    return data.features.map(alert =>
      normalizeZone({
        id: alert.id,
        type: alert.properties.event,
        lat: alert.geometry?.coordinates?.[0]?.[0]?.[1] || 0,
        lng: alert.geometry?.coordinates?.[0]?.[0]?.[0] || 0,
        radius: 200,
        severity: alert.properties.severity?.toLowerCase() || 'moderate',
        message: alert.properties.headline,
        location: alert.properties.areaDesc,
        icon: '🌪',
      }),
    );
  } catch (err) {
    console.log('NOAA fetch failed', err);
    return [];
  }
}

// Wildfire Data - Mocked for demo purposes
export async function fetchWildfires() {
  try {
    // Simulated wildfire data
    const mockFires = [
      {
        id: 'fire-1',
        lat: 34.05,
        lng: -118.25,
        location: 'Los Angeles, USA',
      },
      {
        id: 'fire-2',
        lat: -33.86,
        lng: 151.21,
        location: 'Sydney, Australia',
      },
      {
        id: 'fire-3',
        lat: 37.77,
        lng: -122.42,
        location: 'San Francisco, USA',
      },
    ];

    return mockFires.map(fire =>
      normalizeZone({
        id: fire.id,
        type: 'Wildfire',
        lat: fire.lat,
        lng: fire.lng,
        radius: 50,
        severity: 'high',
        message: 'Active wildfire detected (simulated)',
        location: fire.location,
        icon: '🔥',
      }),
    );
  } catch (err) {
    console.log('Mock wildfire failed', err);
    return [];
  }
}
// Fetches recent FEMA disaster declarations
export async function fetchFEMA() {
  try {
    const response = await fetch(
      'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=20',
    );
    const data = await response.json();

    return data.DisasterDeclarationsSummaries.map(item =>
      normalizeZone({
        id: item.disasterNumber,
        type: item.declarationType,
        lat: 0,
        lng: 0,
        radius: 300,
        severity: 'moderate',
        message: item.incidentType,
        location: item.state,
        icon: '🏛',
      }),
    );
  } catch (err) {
    console.log('FEMA fetch failed', err);
    return [];
  }
}
// Combined disaster fetch
export async function fetchAllDisasters() {
  const [earthquakes, weather, wildfires, fema] = await Promise.all([
    fetchEarthquakes(),
    fetchNOAAAlerts(),
    fetchWildfires(),
    fetchFEMA(),
  ]);

  return [...earthquakes, ...weather, ...wildfires, ...fema];
}
