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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jogadores</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
          <Text style={styles.addButtonText}>Novo Jogador</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playersList}>
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum jogador cadastrado</Text>
          </View>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.id}
              name={player.name}
              email={player.email}
              onEdit={() => handleEditPlayer(player)}
              onDelete={() => handleDeletePlayer(player)}
            />
          ))
        )}
      </View>

      <PlayerFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSavePlayer}
        initialData={selectedPlayer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#4CAF50',
    marginLeft: 8,
  },
  playersList: {
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
  },
});