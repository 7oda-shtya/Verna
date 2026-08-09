import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tripHistory: [],
  historyLoaded: false,
  savedPlaces: [],
  savedTrips: [],
  favoritesLoaded: false,
}

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setTripHistory: (state, action) => {
      state.tripHistory = action.payload || []
      state.historyLoaded = true
    },
    setFavorites: (state, action) => {
      state.savedPlaces = action.payload?.places || []
      state.savedTrips = action.payload?.trips || []
      state.favoritesLoaded = true
    },
    setSavedPlaces: (state, action) => {
      state.savedPlaces = action.payload || []
      state.favoritesLoaded = true
    },
    setSavedTrips: (state, action) => {
      state.savedTrips = action.payload || []
      state.favoritesLoaded = true
    },
    updateSavedPlace: (state, action) => {
      const item = action.payload
      const index = state.savedPlaces.findIndex(place => place.id === item.id)
      if (index === -1) state.savedPlaces.unshift(item)
      else state.savedPlaces[index] = item
    },
    updateSavedTrip: (state, action) => {
      const item = action.payload
      const index = state.savedTrips.findIndex(trip => trip.id === item.id)
      if (index === -1) state.savedTrips.unshift(item)
      else state.savedTrips[index] = item
    },
    removeSavedPlaceFromStore: (state, action) => {
      state.savedPlaces = state.savedPlaces.filter(place => place.id !== action.payload)
    },
    removeSavedTripFromStore: (state, action) => {
      state.savedTrips = state.savedTrips.filter(trip => trip.id !== action.payload)
    },
  },
})

export const {
  setTripHistory,
  setFavorites,
  setSavedPlaces,
  setSavedTrips,
  updateSavedPlace,
  updateSavedTrip,
  removeSavedPlaceFromStore,
  removeSavedTripFromStore,
} = librarySlice.actions

export default librarySlice.reducer
