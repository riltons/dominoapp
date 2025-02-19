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
      console.log('[INFO] Iniciando busca de comunidades para o usuário:', user.id);
      
      // Buscar comunidades onde o usuário é membro ou é o criador
      const { data: communities, error } = await supabase
        .from(getTableName('communities'))
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (error) {
        console.error('[ERROR] Erro ao buscar comunidades:', error);
        throw error;
      }

      console.log('[INFO] Comunidades encontradas:', communities?.length || 0);
      setCommunities(communities || []);
    } catch (error) {
      console.error('[ERROR] Erro detalhado ao carregar comunidades:', error);
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

  const handleSaveCommunity = async (communityData) => {
    try {
      if (!communityData.name?.trim()) {
        throw new Error('O nome da comunidade é obrigatório.');
      }

      const communityRecord = {
        name: communityData.name.trim(),
        description: communityData.description?.trim() || null,
        created_by: user.id
      };

      if (selectedCommunity) {
        const { data, error } = await supabase
          .from(getTableName('communities'))
          .update({
            ...communityRecord,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCommunity.id)
          .select();

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from(getTableName('communities'))
          .insert([communityRecord])
          .select();

        if (error) throw error;
      }

      await loadCommunities();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar comunidade:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar a comunidade.');
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Comunidades</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {communities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma comunidade cadastrada</Text>
          </View>
        ) : (
          communities.map((community) => (
            <View key={community.id} style={styles.communityCard}>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityDescription}>{community.description}</Text>
              </View>
              <View style={styles.communityActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditCommunity(community)}
                >
                  <Ionicons name="pencil" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteCommunity(community)}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCommunity}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CommunityFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveCommunity}
        community={selectedCommunity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  scrollView: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  communityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#999',
  },
  communityActions: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});