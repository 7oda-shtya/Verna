import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Setting from './Setting';
import { useSelector } from 'react-redux'
import { useTheme } from '../../theme/useTheme'
import { useNavigation } from '@react-navigation/native'
import { TourTarget, TOUR_IDS } from '../../tour'

const Header = () => {
	const [settingsVisible, setSettingsVisible] = useState(false);
	const navigation = useNavigation();
	const { theme } = useTheme();
	const { colors } = theme;

	const wallet = useSelector((state) => state.auth?.wallet) || 0
	const handleSettingsPress = () => {
		setSettingsVisible(!settingsVisible);
	};

	return (
		<SafeAreaView edges={['top']} className='flex-row justify-between px-4 pb-4 items-center z-50'>
			<Pressable
				onPress={handleSettingsPress}
				className='rounded-full h-12 w-12 items-center justify-center'
				style={{ backgroundColor: colors.surfaceElevated }}
			>
				<FontAwesome name='gear' size={18} color={colors.textPrimary} />
			</Pressable>

			<TourTarget tourId={TOUR_IDS.APP_GLOBAL} targetId='wallet' asChild>
				<Pressable
					onPress={() => navigation.navigate('WalletRequests')}
					accessibilityRole='button'
					accessibilityLabel='المحفظة'
					className='rounded-full min-w-[92px] px-4 h-12 flex-row items-center justify-center gap-2 shadow-lg'
					style={{ backgroundColor: colors.surfaceElevated }}>
					<FontAwesome name='money' size={16} color={colors.warning} />
					<Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>المحفظة {wallet || 0}</Text>
				</Pressable>
			</TourTarget>

			<Setting isOpen={settingsVisible} onClose={() => setSettingsVisible(false)} />
		</SafeAreaView>
	);
};

export default Header;
