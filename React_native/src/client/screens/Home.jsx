import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View, ImageBackground } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Header from '../components/Header'
import { useNavigation } from '@react-navigation/native'
import client from '../../api/client'


const ClientHome = () => {
	const navigation = useNavigation()
	const [leaderboard, setLeaderboard] = useState([])
	const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
	const [leaderboardError, setLeaderboardError] = useState('')

	useEffect(() => {
		let mounted = true

		const loadLeaderboard = async () => {
			try {
				setLoadingLeaderboard(true)
				setLeaderboardError('')
				const response = await client.get('/leaderboard')
				if (!mounted) return
				setLeaderboard(response.data?.data?.currentWeek?.top10 ?? [])
			} catch (error) {
				if (!mounted) return
				setLeaderboardError('تعذر تحميل الليدر بورد حالياً')
			} finally {
				if (mounted) setLoadingLeaderboard(false)
			}
		}

		loadLeaderboard()

		return () => {
			mounted = false
		}
	}, [])

	return (
		<ImageBackground source={require('../../../assets/images/loginBg3.jpg')} resizeMode='cover' className='flex-1 z-0'>
			<Header />
			<View className="absolute inset-0 w-full h-full bg-black/50 z-1"></View>
			<View className='flex-1 flex flex-col p-4 pt-20 gap-4'>
				<View className='bg-zinc-900 border border-emerald-500/30 rounded-3xl p-4 shadow-lg w-full'>
					<Text className='text-white font-bold mb-3 text-lg'>الليدر بورد</Text>
					{loadingLeaderboard ? (
						<View className='items-center justify-center py-6'>
							<ActivityIndicator color='#34d399' />
						</View>
					) : leaderboardError ? (
						<Text className='text-zinc-400 text-sm'>{leaderboardError}</Text>
					) : leaderboard.length ? (
						<View className='gap-3'>
							{leaderboard.slice(0, 5).map(item => (
								<View key={`${item.id}-${item.rank}`} className='flex-row items-center justify-between rounded-2xl bg-zinc-800/80 px-4 py-3 border border-white/5'>
									<View className='flex-row items-center gap-3'>
										<View className='h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15'>
											<Text className='text-emerald-400 font-bold'>{item.rank}</Text>
										</View>
										<Text className='text-white font-semibold'>{item?.user?.name ?? 'مستخدم'}</Text>
									</View>
									<Text className='text-zinc-300 font-bold'>{item.tripCount} رحلة</Text>
								</View>
							))}
						</View>
					) : (
						<Text className='text-zinc-400 text-sm'>لا توجد بيانات لليدر بورد حالياً.</Text>
					)}
				</View>

				<View className='flex-1 flex flex-col items-center justify-center gap-4'>
					<Text className='text-zinc-500 text-sm'>لا توجد رحلات نشطة حالياً</Text>
					<Pressable onPress={() => navigation.navigate('RequestTrip')} className='flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-2xl font-bold transition-all'>
						<FontAwesome name='plus' size={14} color='white' />
						<Text className='text-white font-bold'>اطلب رحلة جديدة</Text>
					</Pressable>
				</View>
			</View>

		</ImageBackground>
	)
}

export default ClientHome