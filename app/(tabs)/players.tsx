import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import PlayerCard from '../../components/PlayerCard';
import PlayerFormModal from '../../components/PlayerFormModal';
import { supabase } from '../../lib/supabase';
import { getTableName } from '../../utils/tablePrefix';

export default function PlayersScreen() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (user) {
      loadPlayers();
    }
  }, [user]);

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('players'))
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
    }
  };

  const handleAddPlayer = () => {
    setSelectedPlayer(null);
    setIsModalVisible(true);
  };

  const handleEditPlayer = (player) => {
    setSelectedPlayer(player);
    setIsModalVisible(true);
  };

  const handleDeletePlayer = async (player) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir o jogador ${player.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(getTableName('players'))
                .delete()
                .eq('id', player.id);

              if (error) throw error;
              loadPlayers();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o jogador.');
            }
          },
        },
      ]
    );
  };

  const handleSavePlayer = async (playerData) => {
    try {
      if (!playerData.name?.trim()) {
        throw new Error('O nome do jogador é obrigatório.');
      }

      const playerRecord = {
        name: playerData.name.trim(),
        phone_number: playerData.phone?.trim() || null,
        created_by: user.id
      };

      if (selectedPlayer) {
        const { data, error } = await supabase
          .from(getTableName('players'))
          .update({
            ...playerRecord,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedPlayer.id)
          .select();

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from(getTableName('players'))
          .insert([playerRecord])
          .select();

        if (error) throw error;
      }

      await loadPlayers();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar jogador:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o jogador.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jogadores</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum jogador cadastrado</Text>
          </View>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={handleEditPlayer}
              onDelete={handleDeletePlayer}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPlayer}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <PlayerFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSavePlayer}
        player={selectedPlayer}
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