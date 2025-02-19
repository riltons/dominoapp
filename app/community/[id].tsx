import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getTableName } from '../../utils/tablePrefix';
import { useAuthStore } from '../../stores/authStore';
import BackHeader from '../../components/BackHeader';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (id) {
      loadCommunityDetails();
    }
  }, [id]);

  const loadCommunityDetails = async () => {
    try {
      // Load community details
      const { data: communityData, error: communityError } = await supabase
        .from(getTableName('communities'))
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Load community members with player details
      const { data: membersData, error: membersError } = await supabase
        .from(getTableName('community_members'))
        .select(`
          id,
          role,
          player:${getTableName('players')}!player_id(id, name, phone_number)
        `)
        .eq('community_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error loading community details:', error);
    }
  };

  if (!community) {
    return (
      <View style={styles.container}>
        <BackHeader title="Detalhes da Comunidade" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title={community.name} />
      <Stack.Screen
        options={{
          headerTitle: community.name,
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>
            {community.description || 'Sem descrição'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membros ({members.length})</Text>
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.player.name}</Text>
                <Text style={styles.memberPhone}>
                  {member.player.phone_number || 'Sem telefone'}
                </Text>
              </View>
              <View style={styles.memberRole}>
                <Text style={styles.roleText}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  memberPhone: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  memberRole: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});