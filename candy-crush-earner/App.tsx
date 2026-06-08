import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GameScreen from './src/screens/GameScreen';
import WalletScreen from './src/screens/WalletScreen';
import MapScreen from './src/screens/MapScreen';
import InvitationScreen from './src/screens/InvitationScreen';
import StoreScreen from './src/screens/StoreScreen';
import AssetService from './src/services/AssetService';

const Stack = createNativeStackNavigator();

function App() {
  React.useEffect(() => {
    AssetService.fetchConfig();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Map" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Invitation" component={InvitationScreen} />
          <Stack.Screen name="Store" component={StoreScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
