import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { sendSupportMessageRequest } from '../../api/support.api';
import { useTheme } from '../../theme/useTheme';

export default function Support({ navigation }) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('لازم تسمح للتطبيق بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachment(result.assets[0]);
      setError('');
    }
  };

  const send = async () => {
    const content = question.trim();
    if (content.length < 5) return setError('اكتب سؤالك أو وضّح المشكلة بشكل أكبر');
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('message', content);
      if (attachment) {
        formData.append('attachment', {
          uri: attachment.uri,
          name: attachment.fileName || `support-${Date.now()}.jpg`,
          type: attachment.mimeType || 'image/jpeg',
        });
      }
      await sendSupportMessageRequest(formData);
      setQuestion('');
      setAttachment(null);
      setMessage('تم إرسال الرسالة بنجاح وهيتم حل المشكلة في أسرع وقت');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1, padding: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Pressable onPress={() => navigation.goBack()}><Ionicons name='arrow-back' size={25} color={colors.textPrimary} /></Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 23, fontWeight: '800' }}>المساعدة والدعم</Text>
        </View>
        <View style={{ ...theme.components.card, padding: 20, gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
            <Ionicons name='headset-outline' size={28} color={colors.primary} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800', textAlign: 'center' }}>إزاي نقدر نساعدك؟</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>اكتب سؤالك أو المشكلة بالتفصيل وسيتم حفظها لفريق الدعم.</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={2000}
            textAlignVertical='top'
            placeholder='اكتب رسالتك هنا...'
            placeholderTextColor={colors.placeholder}
            style={{ ...theme.components.input, color: colors.textPrimary, minHeight: 170, paddingTop: 14, textAlign: 'right' }}
          />
          {attachment ? (
            <View style={{ position: 'relative', alignSelf: 'stretch' }}>
              <Image source={{ uri: attachment.uri }} style={{ width: '100%', height: 150, borderRadius: 14 }} resizeMode='cover' />
              <Pressable onPress={() => setAttachment(null)} style={{ position: 'absolute', top: 8, left: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backdrop }}>
                <Ionicons name='close' size={20} color='#fff' />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={{ ...theme.components.secondaryButton, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name='image-outline' size={21} color={colors.primary} />
              <Text style={theme.components.secondaryButtonText}>إرفاق صورة</Text>
            </Pressable>
          )}
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{question.length}/2000</Text>
          {error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
          {message ? <Text style={{ color: colors.success, textAlign: 'center' }}>{message}</Text> : null}
          <Pressable disabled={loading} onPress={send} style={{ ...theme.components.primaryButton, padding: 15, opacity: loading ? 0.65 : 1 }}>
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.components.primaryButtonText, textAlign: 'center' }}>إرسال للدعم</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
