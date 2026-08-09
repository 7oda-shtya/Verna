import React from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Line, Circle } from 'react-native-svg'

type NeonStreaksProps = {
	width?: number
	height?: number
	color?: string
	style?: object
}

const NeonStreaks = ({ width = 200, height = 100, color = '#22D3EE', style }: NeonStreaksProps) => {
	return (
		<View pointerEvents='none' style={[{ width, height, position: 'absolute' }, style]}>
			<Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<Defs>
					<LinearGradient id='fade1' gradientUnits='userSpaceOnUse' x1={10} y1={0} x2={70} y2={0}>
						<Stop offset='0%' stopColor={color} stopOpacity='0' />
						<Stop offset='50%' stopColor={color} stopOpacity='0.9' />
						<Stop offset='100%' stopColor={color} stopOpacity='0' />
					</LinearGradient>
					<LinearGradient id='fade2' gradientUnits='userSpaceOnUse' x1={0} y1={0} x2={90} y2={0}>
						<Stop offset='0%' stopColor={color} stopOpacity='0' />
						<Stop offset='55%' stopColor={color} stopOpacity='1' />
						<Stop offset='100%' stopColor={color} stopOpacity='0' />
					</LinearGradient>
					<LinearGradient id='fade3' gradientUnits='userSpaceOnUse' x1={19} y1={0} x2={59} y2={0}>
						<Stop offset='0%' stopColor={color} stopOpacity='0' />
						<Stop offset='50%' stopColor={color} stopOpacity='0.8' />
						<Stop offset='100%' stopColor={color} stopOpacity='0' />
					</LinearGradient>
					<LinearGradient id='fade4' gradientUnits='userSpaceOnUse' x1={0} y1={0} x2={60} y2={0}>
						<Stop offset='0%' stopColor={color} stopOpacity='0' />
						<Stop offset='55%' stopColor={color} stopOpacity='1' />
						<Stop offset='100%' stopColor={color} stopOpacity='0' />
					</LinearGradient>
					<RadialGradient id='dotGlow' cx='50%' cy='50%' r='50%'>
						<Stop offset='0%' stopColor={color} stopOpacity='1' />
						<Stop offset='100%' stopColor={color} stopOpacity='0' />
					</RadialGradient>
				</Defs>

				<Line x1={0} y1={20} x2={60} y2={20} stroke='url(#fade1)' strokeWidth={7} strokeLinecap='round' opacity={0.3} />
				<Line x1={0} y1={20} x2={60} y2={20} stroke='url(#fade1)' strokeWidth={2} strokeLinecap='round' opacity={0.85} />

				<Line x1={0} y1={35} x2={90} y2={35} stroke='url(#fade2)' strokeWidth={12} strokeLinecap='round' opacity={0.3} />
				<Line x1={0} y1={35} x2={90} y2={35} stroke='url(#fade2)' strokeWidth={2.5} strokeLinecap='round' opacity={1} />
				<Circle cx={45} cy={35} r={4} fill='url(#dotGlow)' opacity={0.85} />

				<Line x1={19} y1={60} x2={59} y2={60} stroke='url(#fade3)' strokeWidth={9} strokeLinecap='round' opacity={0.28} />
				<Line x1={19} y1={60} x2={59} y2={60} stroke='url(#fade3)' strokeWidth={2} strokeLinecap='round' opacity={0.75} />
				<Circle cx={60} cy={58} r={3} fill='url(#dotGlow)' opacity={0.6} />

				<Line x1={0} y1={79} x2={60} y2={79} stroke='url(#fade1)' strokeWidth={7} strokeLinecap='round' opacity={0.3} />
				<Line x1={0} y1={79} x2={60} y2={79} stroke='url(#fade1)' strokeWidth={2} strokeLinecap='round' opacity={0.85} />
			</Svg>
		</View>
	)
}

export default NeonStreaks
