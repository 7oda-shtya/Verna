import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../theme/useTheme';
import { updateKyc } from '../../redux/slices/driver/authSlice';

const LICENSE_ID_DOCS = [
  { key: 'license', label: 'رخصة القيادة', existingUrl: (user: any) => user.driverLicense },
  { key: 'nationalIdFront', label: 'البطاقة — الوجه الأمامي', existingUrl: (user: any) => user.nationalIdFront },
  { key: 'nationalIdBack', label: 'البطاقة — الوجه الخلفي', existingUrl: (user: any) => user.nationalIdBack },
];

const CAR_DOCS = [
  { key: 'carPicture', label: 'صورة السيارة', existingUrl: (user: any) => user.car?.picture },
  { key: 'carLicense', label: 'رخصة السيارة', existingUrl: (user: any) => user.car?.licenseDocument },
];

const DocumentRow = ({ doc, existingUrl, pickedAsset, onPick, colors, theme }: any) => {
  const uploaded = Boolean(existingUrl);
  const pending = Boolean(pickedAsset);
  const statusColor = pending ? colors.primary : uploaded ? colors.success : colors.textSecondary;
  const statusLabel = pending ? 'جاهزة' : uploaded ? 'مرفوعة' : 'ناقصة';
  const statusIcon = pending || uploaded ? 'checkmark-circle' : 'alert-circle-outline';

  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
      {(pickedAsset?.uri || existingUrl) ? (
        <Image source={{ uri: pickedAsset?.uri || existingUrl }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name='document-outline' size={20} color={colors.textSecondary} />
        </View>
      )}

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' }}>{doc.label}</Text>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
          <Ionicons name={statusIcon} size={14} color={statusColor} />
          <Text style={{ ...theme.typography.tiny, color: statusColor, fontWeight: '700' }}>{statusLabel}</Text>
        </View>
      </View>

      <Pressable onPress={onPick} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primaryMuted }}>
        <Text style={{ ...theme.typography.tiny, color: colors.primary, fontWeight: '700' }}>{uploaded || pending ? 'استبدال' : 'رفع'}</Text>
      </Pressable>
    </View>
  );
};

const DocumentSection = ({ title, docs, user, pendingAssets, onPick, colors, theme }: any) => (
  <View style={{ gap: 8 }}>
    <Text style={{ ...theme.typography.caption, color: colors.textSecondary, textAlign: 'right', fontWeight: '700' }}>{title}</Text>
    {docs.map((doc: any) => (
      <DocumentRow
        key={doc.key}
        doc={doc}
        existingUrl={doc.existingUrl(user)}
        pickedAsset={pendingAssets[doc.key]}
        onPick={() => onPick(doc.key)}
        colors={colors}
        theme={theme}
      />
    ))}
  </View>
);

export function KycDocumentsForm({ onSaved, onSkip }: { onSaved?: () => void; onSkip?: () => void } = {}) {
  const dispatch = useDispatch<any>();
  const { theme } = useTheme();
  const { colors } = theme;
  const user = useSelector((state: any) => state.auth);

  const [pendingAssets, setPendingAssets] = useState<Record<string, any>>({});
  const [model, setModel] = useState(user.car?.model || '');
  const [plateNumber, setPlateNumber] = useState(user.car?.plateNumber || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasChanges = useMemo(
    () => Object.keys(pendingAssets).length > 0 || model.trim() !== (user.car?.model || '') || plateNumber.trim() !== (user.car?.plateNumber || ''),
    [pendingAssets, model, plateNumber, user.car],
  );

  const pickDocument = async (key: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('محتاجين إذن', 'محتاجين إذن الوصول للصور عشان تقدر ترفع المستندات');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingAssets(current => ({ ...current, [key]: { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName } }));
    setSuccess('');
  };

  const submit = async () => {
    if (!hasChanges || submitting) return;
    try {
      setSubmitting(true);
      setError('');
      const payload: Record<string, any> = { ...pendingAssets };
      if (model.trim() !== (user.car?.model || '')) payload.model = model.trim();
      if (plateNumber.trim() !== (user.car?.plateNumber || '')) payload.plateNumber = plateNumber.trim();
      await dispatch(updateKyc(payload)).unwrap();
      setPendingAssets({});
      setSuccess('تم حفظ بياناتك بنجاح');
      onSaved?.();
    } catch (requestError: any) {
      setError(typeof requestError === 'string' ? requestError : 'تعذر حفظ البيانات، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 10, padding: 14, borderRadius: 16, ...theme.components.card }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
          <Ionicons name='car-outline' size={18} color={colors.primary} />
          <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>بيانات السيارة</Text>
        </View>
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder='موديل السيارة'
          placeholderTextColor={colors.placeholder}
          style={{ ...theme.components.input, paddingVertical: 12, textAlign: 'right' }}
        />
        <TextInput
          value={plateNumber}
          onChangeText={setPlateNumber}
          placeholder='رقم اللوحة'
          placeholderTextColor={colors.placeholder}
          style={{ ...theme.components.input, paddingVertical: 12, textAlign: 'right' }}
        />
      </View>

      <View style={{ gap: 12, padding: 14, borderRadius: 16, ...theme.components.card }}>
        <DocumentSection title='رخصة القيادة والهوية' docs={LICENSE_ID_DOCS} user={user} pendingAssets={pendingAssets} onPick={pickDocument} colors={colors} theme={theme} />
        <View style={{ height: 1, backgroundColor: colors.divider }} />
        <DocumentSection title='مستندات السيارة' docs={CAR_DOCS} user={user} pendingAssets={pendingAssets} onPick={pickDocument} colors={colors} theme={theme} />
      </View>

      {error ? <Text style={{ ...theme.typography.caption, color: colors.error, textAlign: 'right' }}>{error}</Text> : null}
      {success ? <Text style={{ ...theme.typography.caption, color: colors.success, textAlign: 'right' }}>{success}</Text> : null}

      <Pressable disabled={!hasChanges || submitting} onPress={submit} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, opacity: !hasChanges || submitting ? 0.55 : 1 }}>
        {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.typography.subtitle, color: colors.onPrimary, fontWeight: '800' }}>حفظ البيانات</Text>}
      </Pressable>

      {onSkip ? (
        <Pressable onPress={onSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ ...theme.typography.body, color: colors.textSecondary, fontWeight: '700' }}>لاحقًا</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function KycUpload({ navigation }: any) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated }}>
          <Ionicons name='chevron-forward' size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...theme.typography.title, color: colors.textPrimary }}>مستندات الحساب</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, paddingBottom: 32 }} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
          <KycDocumentsForm onSkip={() => navigation.navigate('DriverTabs')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
