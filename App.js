import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import preparednessTaskScreen from './screens/PreparednessTaskScreen';
import emergencyAlertScreen from './screens/EmergencyAlertScreen';
import resourceHubScreen from './screens/ResourceHubScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Task" component={preparednessTaskScreen} />
        <Stack.Screen name="Alert" component={emergencyAlertScreen} />
        <Stack.Screen name="Resources" component={resourceHubScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
