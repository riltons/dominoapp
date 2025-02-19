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
            created_by: user.id
          }));

          const { error: membersError } = await supabase
            .from(getTableName('community_members'))
            .insert(memberRecords);

          if (membersError) throw membersError;
        }
      }

      onSave();
      onClose();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar a comunidade.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {community ? 'Editar Comunidade' : 'Nova Comunidade'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome da comunidade"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição da comunidade"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Membros</Text>
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
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  playerChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  playerChipText: {
    fontSize: 14,
    color: '#333',
  },
  playerChipTextSelected: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
  },
});