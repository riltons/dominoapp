import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { getTableName } from '../../utils/tablePrefix';
import CommunityFormModal from '../../components/CommunityFormModal';

export default function CommunitiesScreen() {
  const { user } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  useEffect(() => {
    if (user) {
      loadCommunities();
    }
  }, [user]);

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('communities'))
        .select('*, community_members(player:players(*))') // Join with members and their player info
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as comunidades.');
    }
  };

  const handleAddCommunity = () => {
    setSelectedCommunity(null);
    setIsModalVisible(true);
  };

  const handleEditCommunity = (community) => {
    setSelectedCommunity(community);
    setIsModalVisible(true);
  };

  const handleDeleteCommunity = async (community) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir a comunidade ${community.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(getTableName('communities'))
                .delete()
                .eq('id', community.id);

              if (error) throw error;
              loadCommunities();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a comunidade.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {communities.map((community) => (
          <View key={community.id} style={styles.communityCard}>
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.memberCount}>
                {community.community_members?.length || 0} membros
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleEditCommunity(community)}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCommunity(community)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddCommunity}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <CommunityFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={loadCommunities}
        community={selectedCommunity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  communityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }
});