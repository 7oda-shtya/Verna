import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_IDS, DEFAULT_THEME_ID } from '../../../theme/themes';

const THEME_STORAGE_KEY = 'app_theme';

export const loadTheme = createAsyncThunk('theme/load', async () => {
  const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  if (stored && Object.values(THEME_IDS).includes(stored)) {
    return stored;
  }
  return DEFAULT_THEME_ID;
});

export const changeTheme = createAsyncThunk('theme/change', async themeId => {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
  return themeId;
});

const initialState = {
  current: DEFAULT_THEME_ID,
  ready: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.current = action.payload;
        state.ready = true;
      })
      .addCase(loadTheme.rejected, state => {
        state.ready = true;
      })
      .addCase(changeTheme.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export default themeSlice.reducer;
