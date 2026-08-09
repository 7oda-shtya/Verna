import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { getTripMessagesRequest } from '../../api/messages.api';
import { emit, on } from '../../client/services/socket.service';
import { useTheme } from '../../theme/useTheme';

export default function TripChatScreen({ route }) {
  const { tripId } = route.params;
  const userId = useSelector(state => state.auth.id);
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;
    getTripMessagesRequest(tripId)
      .then(response => !cancelled && setMessages(response.data.data))
      .catch(requestError => !cancelled && setError(requestError.response?.data?.message || requestError.message));
    emit('trip:join', tripId).catch(() => {});
    on('chat:message', message => {
      if (message.tripId === tripId) {
        setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      }
    }).then(cleanup => { unsubscribe = cleanup; }).catch(socketError => setError(socketError.message));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [tripId]);

  const send = useCallback(() => {
    const text = content.trim();
    if (!text) return;
    setContent('');
    emit('chat:message', { tripId, content: text }, response => {
      if (!response?.success) {
        setContent(text);
        setError(response?.message || 'تعذر إرسال الرسالة');
      }
    }).catch(sendError => {
      setContent(text);
      setError(sendError.message);
    });
  }, [content, tripId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {error && <Text style={{ color: theme.colors.error, padding: 12 }}>{error}</Text>}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.senderId === userId ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
            padding: 10,
            borderRadius: 14,
            backgroundColor: item.senderId === userId ? theme.colors.primary : theme.colors.surface,
          }}>
            <Text style={{ color: item.senderId === userId ? '#fff' : theme.colors.textPrimary }}>{item.content}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder='اكتب رسالة'
          placeholderTextColor={theme.colors.textSecondary}
          style={{ flex: 1, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 12 }}
          maxLength={2000}
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={{ justifyContent: 'center', paddingHorizontal: 18, borderRadius: 14, backgroundColor: theme.colors.primary }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>إرسال</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
