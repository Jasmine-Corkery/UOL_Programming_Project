// services/disasterService.js

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

export async function fetchEarthquakes() {
  try {
    const response = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson",
    );
    const data = await response.json();

    return data.features.map((quake) =>
      normalizeZone({
        id: quake.id,
        type: "Earthquake",
        lat: quake.geometry.coordinates[1],
        lng: quake.geometry.coordinates[0],
        radius: 150,
        severity: quake.properties.mag >= 6 ? "critical" : "high",
        message: quake.properties.title,
        location: quake.properties.place,
        icon: "🌎",
      }),
    );
  } catch (err) {
    console.log("Earthquake fetch failed", err);
    return [];
  }
}

export async function fetchNOAAAlerts() {
  try {
    const response = await fetch("https://api.weather.gov/alerts/active");
    const data = await response.json();

    return data.features.map((alert) =>
      normalizeZone({
        id: alert.id,
        type: alert.properties.event,
        lat: alert.geometry?.coordinates?.[0]?.[0]?.[1] || 0,
        lng: alert.geometry?.coordinates?.[0]?.[0]?.[0] || 0,
        radius: 200,
        severity: alert.properties.severity?.toLowerCase() || "moderate",
        message: alert.properties.headline,
        location: alert.properties.areaDesc,
        icon: "🌪",
      }),
    );
  } catch (err) {
    console.log("NOAA fetch failed", err);
    return [];
  }
}

export async function fetchWildfires() {
  try {
    const response = await fetch(
      "https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_API_KEY/MODIS_NRT/world/1",
    );

    const text = await response.text();
    const rows = text.split("\n").slice(1);

    return rows.slice(0, 20).map((row, index) => {
      const cols = row.split(",");

      return normalizeZone({
        id: "fire-" + index,
        type: "Wildfire",
        lat: parseFloat(cols[0]),
        lng: parseFloat(cols[1]),
        radius: 50,
        severity: "high",
        message: "Active wildfire detected",
        location: "NASA FIRMS Data",
        icon: "🔥",
      });
    });
  } catch (err) {
    console.log("Wildfire fetch failed", err);
    return [];
  }
}

export async function fetchFEMA() {
  try {
    const response = await fetch(
      "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=20",
    );
    const data = await response.json();

    return data.DisasterDeclarationsSummaries.map((item) =>
      normalizeZone({
        id: item.disasterNumber,
        type: item.declarationType,
        lat: 0,
        lng: 0,
        radius: 300,
        severity: "moderate",
        message: item.incidentType,
        location: item.state,
        icon: "🏛",
      }),
    );
  } catch (err) {
    console.log("FEMA fetch failed", err);
    return [];
  }
}

export async function fetchAllDisasters() {
  const [earthquakes, weather, wildfires, fema] = await Promise.all([
    fetchEarthquakes(),
    fetchNOAAAlerts(),
    fetchWildfires(),
    fetchFEMA(),
  ]);

  return [...earthquakes, ...weather, ...wildfires, ...fema];
}
