import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayerCardProps {
  name: string;
  email: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PlayerCard({ name, email, onEdit, onDelete }: PlayerCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="pencil" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
});