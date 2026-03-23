// imports
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { runHazardSimulation } from '../services/simulationEngine';
// Simulation screen component
export default function SimulationScreen() {
  console.log('SIMULATION RENDERING');
  const [simulationData, setSimulationData] = useState(null);

  const runSimulation = () => {
    const result = runHazardSimulation({
      hazardType: 'flood',
      severity: 7,
      userLocation: {
        lat: 28.5383,
        lng: -81.3792,
      },
    });

    setSimulationData(result);
  };
  // UI - screen for testing the simulation engine
  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }}>
        {simulationData && (
          <Circle
            center={{
              latitude: 28.5383,
              longitude: -81.3792,
            }}
            radius={simulationData.impactRadius}
            strokeColor="red"
            fillColor="rgba(255,0,0,0.3)"
          />
        )}

        {simulationData?.projectedSafeZones.map(zone => (
          <Marker
            key={zone.id}
            coordinate={{
              latitude: zone.lat,
              longitude: zone.lng,
            }}
          />
        ))}
      </MapView>

      <TouchableOpacity onPress={runSimulation}>
        <Text>Run Simulation</Text>
      </TouchableOpacity>
    </View>
  );
}
