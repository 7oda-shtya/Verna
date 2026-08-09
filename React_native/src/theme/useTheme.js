import { useSelector, useDispatch } from 'react-redux';
import { THEMES, DEFAULT_THEME_ID } from './themes';
import { changeTheme } from '../redux/slices/client/themeSlice';

// بيرجع الثيم الحالي (كامل بالـ colors) + دالة لتغييره وحفظه في AsyncStorage
export const useTheme = () => {
  const dispatch = useDispatch();
  const currentId = useSelector(state => state.theme.current);
  const theme = THEMES[currentId] || THEMES[DEFAULT_THEME_ID];

  const setTheme = themeId => {
    if (themeId === currentId || !THEMES[themeId]) return;
    dispatch(changeTheme(themeId));
  };

  return { theme, themeId: theme.id, setTheme };
};

export default useTheme;
