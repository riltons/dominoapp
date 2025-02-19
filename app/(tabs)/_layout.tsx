import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerTitle: '',
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
            <Ionicons name="game-controller" size={24} color="#4CAF50" />
            <Text style={{ color: '#fff', fontSize: 18, marginLeft: 8 }}>DominoApp</Text>
          </View>
        ),
        headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                // Implementar lógica de logout aqui
                router.replace('/auth');
              }}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          paddingVertical: 20,
          height: 70
        },
        tabBarItemStyle: {
          paddingVertical: 10
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#888',
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Jogadores',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Comunidades',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}