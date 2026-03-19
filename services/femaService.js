export const fetchFemaSafeLocations = async () => {
  try {
    const drcResponse = await fetch(
      'https://www.fema.gov/api/open/v2/DisasterRecoveryCenters?$limit=500',
    );
    const drcData = await drcResponse.json();

    const drcZones = drcData.DisasterRecoveryCenters.map(center => ({
      id: `drc-${center.id}`,
      type: 'Disaster Recovery Center',
      icon: '🏢',
      lat: center.latitude,
      lng: center.longitude,
      radius: 1,
      message: `FEMA Disaster Recovery Center: ${center.name}`,
      location: `${center.city}, ${center.state}`,
      severity: 'safe',
    }));

    const shelterResponse = await fetch(
      'https://www.fema.gov/api/open/v2/Shelters?$limit=500',
    );
    const shelterData = await shelterResponse.json();

    const shelterZones = shelterData.Shelters.map(shelter => ({
      id: `shelter-${shelter.id}`,
      type: 'Shelter',
      icon: '🏠',
      lat: shelter.latitude,
      lng: shelter.longitude,
      radius: 1,
      message: `FEMA Shelter: ${shelter.name}`,
      location: `${shelter.city}, ${shelter.state}`,
      severity: 'safe',
    }));

    return [...drcZones, ...shelterZones];
  } catch (error) {
    console.error('Error fetching FEMA safe locations:', error);
    return [];
  }
};
