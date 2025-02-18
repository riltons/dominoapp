import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      setError('');
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, phone);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DominoApp</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Celular"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchText}>
          {isLogin
            ? 'Não tem uma conta? Cadastre-se'
            : 'Já tem uma conta? Entre'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 15,
  },
});