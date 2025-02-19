import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { getTableName } from '../utils/tablePrefix';

export default function CommunityFormModal({
  visible,
  onClose,
  onSave,
  community,
}) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  useEffect(() => {
    if (visible) {
      if (community) {
        setName(community.name || '');
        setDescription(community.description || '');
        const members = community.community_members?.map(m => m.player) || [];
        setSelectedPlayers(members);
      } else {
        setName('');
        setDescription('');
        setSelectedPlayers([]);
      }
      loadAvailablePlayers();
    }
  }, [visible, community]);

  const loadAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName('players'))
        .select('*')
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;
      setAvailablePlayers(data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
    }
  };

  const togglePlayerSelection = (player) => {
    setSelectedPlayers(current =>
      current.find(p => p.id === player.id)
        ? current.filter(p => p.id !== player.id)
        : [...current, player]
    );
  };

  const handleSave = async () => {
    try {
      if (!name?.trim()) {
        throw new Error('O nome da comunidade é obrigatório.');
      }

      const communityData = {
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id
      };

      let communityId;

      if (community) {
        const { data, error } = await supabase
          .from(getTableName('communities'))
          .update({
            ...communityData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', community.id)
          .select();

        if (error) throw error;
        communityId = community.id;
      } else {
        const { data, error } = await supabase
          .from(getTableName('communities'))
          .insert([communityData])
          .select();

        if (error) throw error;
        communityId = data[0].id;
      }

      // Update members
      if (communityId) {
        // Remove existing members
        await supabase
          .from(getTableName('community_members'))
          .delete()
          .eq('community_id', communityId);

        // Add selected members
        if (selectedPlayers.length > 0) {
          const memberRecords = selectedPlayers.map(player => ({
            community_id: communityId,
            player_id: player.id,
            user_id: user.id,
            role: 'member'
          }));

          const { error: membersError } = await supabase
            .from(getTableName('community_members'))
            .insert(memberRecords);

          if (membersError) throw membersError;
        }
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Comunidade salva com sucesso!', ToastAndroid.SHORT);
      }
      onSave();
      onClose();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar a comunidade.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {community ? 'Editar Comunidade' : 'Nova Comunidade'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome da comunidade"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição da comunidade"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Membros</Text>
              <ScrollView style={styles.playersContainer}>
                <View style={styles.playersList}>
                  {availablePlayers.map(player => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.playerChip,
                        selectedPlayers.find(p => p.id === player.id) && styles.playerChipSelected
                      ]}
                      onPress={() => togglePlayerSelection(player)}
                    >
                      <Text
                        style={[
                          styles.playerChipText,
                          selectedPlayers.find(p => p.id === player.id) && styles.playerChipTextSelected
                        ]}
                      >
                        {player.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  playersContainer: {
    maxHeight: 150,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  playerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  playerChipSelected: {
    backgroundColor: '#4CAF50',
  },
  playerChipText: {
    fontSize: 14,
    color: '#fff',
  },
  playerChipTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});