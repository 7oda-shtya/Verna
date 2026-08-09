import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../theme/useTheme';
import { updateKyc } from '../../redux/slices/driver/authSlice';

// key: the multipart field name PUT /driver/auth/kyc expects
// existingUrl: where the already-uploaded document (if any) lives on the driver's profile
const DOCUMENTS = [
  { key: 'license', label: 'رخصة القيادة', existingUrl: (user: any) => user.driverLicense },
  { key: 'nationalIdFront', label: 'البطاقة الشخصية (الوجه الأمامي)', existingUrl: (user: any) => user.nationalIdFront },
  { key: 'nationalIdBack', label: 'البطاقة الشخصية (الوجه الخلفي)', existingUrl: (user: any) => user.nationalIdBack },
  { key: 'carPicture', label: 'صورة السيارة', existingUrl: (user: any) => user.car?.picture },
  { key: 'carLicense', label: 'رخصة السيارة', existingUrl: (user: any) => user.car?.licenseDocument },
];

const DocumentRow = ({ doc, existingUrl, pickedAsset, onPick, colors, theme }: any) => (
  <View style={{ gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right' }}>{doc.label}</Text>
      {pickedAsset ? (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
          <Ionicons name='checkmark-circle' size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>جاهزة للرفع</Text>
        </View>
      ) : existingUrl ? (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
          <Ionicons name='checkmark-circle' size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>مرفوعة</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
          <Ionicons name='alert-circle-outline' size={16} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>لم يتم الرفع</Text>
        </View>
      )}
    </View>

    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
      {(pickedAsset?.uri || existingUrl) ? (
        <Image source={{ uri: pickedAsset?.uri || existingUrl }} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.surfaceElevated }} />
      ) : (
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name='document-outline' size={24} color={colors.textSecondary} />
        </View>
      )}
      <Pressable onPress={onPick} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>{existingUrl || pickedAsset ? 'استبدال الصورة' : 'اختيار صورة'}</Text>
      </Pressable>
    </View>
  </View>
);

// The shared form body — used both here (as a standalone editable screen reachable from
// DriverProfile) and embedded in DriverAccountPendingScreen (the PENDING-review gate), so the
// same upload/already-uploaded logic isn't duplicated between the two entry points.
export function KycDocumentsForm({ onSaved }: { onSaved?: () => void } = {}) {
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
    <View style={{ gap: 16 }}>
      <View style={{ gap: 10 }}>
        <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary, textAlign: 'right' }}>بيانات السيارة</Text>
        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TextInput value={model} onChangeText={setModel} placeholder='موديل السيارة' placeholderTextColor={colors.placeholder} style={{ flex: 1, ...theme.components.input, paddingVertical: 12, textAlign: 'right' }} />
          <TextInput value={plateNumber} onChangeText={setPlateNumber} placeholder='رقم اللوحة' placeholderTextColor={colors.placeholder} style={{ flex: 1, ...theme.components.input, paddingVertical: 12, textAlign: 'right' }} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary, textAlign: 'right' }}>المستندات المطلوبة</Text>
        {DOCUMENTS.map(doc => (
          <DocumentRow
            key={doc.key}
            doc={doc}
            existingUrl={doc.existingUrl(user)}
            pickedAsset={pendingAssets[doc.key]}
            onPick={() => pickDocument(doc.key)}
            colors={colors}
            theme={theme}
          />
        ))}
      </View>

      {error ? <Text style={{ color: colors.error, textAlign: 'right' }}>{error}</Text> : null}
      {success ? <Text style={{ color: colors.success, textAlign: 'right' }}>{success}</Text> : null}

      <Pressable disabled={!hasChanges || submitting} onPress={submit} style={{ minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, opacity: !hasChanges || submitting ? 0.55 : 1 }}>
        {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>حفظ البيانات</Text>}
      </Pressable>
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
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4 }}>
        <KycDocumentsForm />
      </ScrollView>
    </SafeAreaView>
  );
}
