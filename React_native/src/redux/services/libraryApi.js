import { createApi } from '@reduxjs/toolkit/query/react';
import client from '../../api/client';

const axiosBaseQuery = () => async ({ url, method = 'get', data }) => {
  try {
    const result = await client({ url, method, data });
    return { data: result.data };
  } catch (error) {
    return { error: { status: error.response?.status, data: error.response?.data || error.message } };
  }
};

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SavedPlaces', 'SavedTrips'],
  endpoints: builder => ({
    getSavedPlaces: builder.query({ query: () => ({ url: '/saved-places' }), providesTags: ['SavedPlaces'] }),
    getSavedTrips: builder.query({ query: () => ({ url: '/saved-trips' }), providesTags: ['SavedTrips'] }),
  }),
});

export const { useGetSavedPlacesQuery, useGetSavedTripsQuery } = libraryApi;
