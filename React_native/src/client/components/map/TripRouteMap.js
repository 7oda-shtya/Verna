import { useState } from 'react';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import { View, Pressable, Text } from 'react-native';

const toCoord = point => ({
  latitude: point.lat,
  longitude: point.lng,
});
const TILE_URLS = {
  standard: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
};

const TripRouteMap = ({ startPin, endPin, waypoints = [], routeCoordinates = [], onMapPress }) => {
  const [mapStyle, setMapStyle] = useState('standard');

  const initialRegion = {
    latitude: startPin?.lat ?? 31.1313,
    longitude: startPin?.lng ?? 33.7984,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} initialRegion={initialRegion} onPress={e => onMapPress?.(e.nativeEvent.coordinate)}>
        <UrlTile key={mapStyle} urlTemplate={TILE_URLS[mapStyle]} maximumZ={19} />
        {startPin && <Marker coordinate={toCoord(startPin)} title={startPin.name} pinColor='green' />}
        {endPin && <Marker coordinate={toCoord(endPin)} title={endPin.name} pinColor='red' />}
        {waypoints.map((waypoint, index) => (
          <Marker key={index} coordinate={toCoord(waypoint)} title={waypoint.name} pinColor='blue' />
        ))}
        {routeCoordinates.length > 0 && <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor='blue' />}
      </MapView>
      <View style={{ position: 'absolute', top: 40, right: 10, flexDirection: 'row' }}>
        {Object.keys(TILE_URLS).map(style => (
          <Pressable key={style} onPress={() => setMapStyle(style)}>
            <Text>{style}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default TripRouteMap;
