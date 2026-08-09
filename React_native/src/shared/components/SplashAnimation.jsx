import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// -------------------------------------------------------------------------
// الأصول الحقيقية اللي عملتها ورفعتها في المشروع
// -------------------------------------------------------------------------
const LEFT_ARROW = require('../../../assets/images/left-arrow.png'); // 179x383
const RIGHT_ARROW = require('../../../assets/images/right-arrow.png'); // 207x391
const MARKER = require('../../../assets/images/marker.png'); // 157x214
const ROAD = require('../../../assets/images/road.png'); // 445x277
const LOGO = require('../../../assets/images/Logo.png'); // اسم البرنامج ككلمة/صورة

// أحجام العرض النهائية (بنحافظ على الـ aspect ratio بتاع كل صورة)
const LEFT_W = 96;
const LEFT_H = LEFT_W * (383 / 179); // ≈ 197
const RIGHT_W = 110;
const RIGHT_H = RIGHT_W * (391 / 207); // ≈ 189
const MARKER_W = 62;
const MARKER_H = MARKER_W * (214 / 157); // ≈ 84.5
const ROAD_W = 450;
const ROAD_H = ROAD_W * (277 / 445); // ≈ 155.6
// عدّل الأبعاد دي بعد ما تشوف شكل Logo.png الحقيقي عندك (بالذات لو مش نفس النسبة)
const LOGO_W = 150;
const LOGO_H = 42;

// -------------------------------------------------------------------------
// توقيتات الحركة — مضبوطة عشان السلسلة الكاملة (سهمين + ماركر + طريق + لوجو)
// تاخد حوالي ثانيتين قبل ما تستقر وتستنى انتهاء التحميل الحقيقي
// -------------------------------------------------------------------------
const EXIT_DURATION = 420;
const REENTER_DURATION = 600;
const DETAILS_START = EXIT_DURATION + REENTER_DURATION - 120; // ≈ 900ms
const MARKER_FADE_DURATION = 420;
const ROAD_REVEAL_DELAY = 140; // بعد الماركر
const ROAD_REVEAL_DURATION = 500;
const LOGO_DELAY = ROAD_REVEAL_DELAY + ROAD_REVEAL_DURATION + 150; // بعد ما الطريق يخلص يتكشف
const LOGO_FADE_DURATION = 350;
// إجمالي وقت السلسلة ≈ 900 + 140 + 500 + 150 + 350 ≈ 2000ms (ثانيتين)

// الموضع النهائي: السهمين متلاقيين في نص الحاوية بشكل V، والماركر فوق نقطة التلاقي
const FINAL_LEFT = { x: -51, y: 26 };
const FINAL_RIGHT = { x: 52, y: 25 };
const FINAL_MARKER = { x: 5, y: -66 };
const FINAL_ROAD = { x: 40, y: 330 };
const FINAL_LOGO = { x: 0, y: 150 };

const SplashAnimation = ({ ready, onFinished }) => {
  const { width, height } = useWindowDimensions();
  const [showDetails, setShowDetails] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [sequenceDone, setSequenceDone] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const leftProgress = useSharedValue(0);
  const rightProgress = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  const markerOpacity = useSharedValue(0);
  const markerTranslateY = useSharedValue(10);

  const roadOpacity = useSharedValue(0);
  // بيتحكم في ارتفاع الجزء المكشوف من الطريق (0 = مخفي تماماً، 1 = ظاهر بالكامل)
  const roadReveal = useSharedValue(0);

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(10);

  useEffect(() => {
    // 0 -> 1: يخرج من تحت-يمين لبرّه الشاشة فوق-شمال
    // 1 -> 2: يرجع يدخل من نفس نقطة البداية ويستقر في مكانه النهائي جوه الأيقونة
    leftProgress.value = withSequence(
      withTiming(1, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) }),
      withTiming(0, { duration: 0 }),
      withTiming(2, { duration: REENTER_DURATION, easing: Easing.out(Easing.back(1.15)) }),
    );

    rightProgress.value = withDelay(
      60,
      withSequence(
        withTiming(1, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
        withTiming(2, { duration: REENTER_DURATION, easing: Easing.out(Easing.back(1.15)) }),
      ),
    );

    const detailsTimer = setTimeout(() => {
      setShowDetails(true);

      // الماركر يفيد أولاً
      markerOpacity.value = withTiming(1, {
        duration: MARKER_FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });
      markerTranslateY.value = withTiming(0, {
        duration: MARKER_FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });

      // الطريق يظهر بالتدريج من تحت لفوق (كشف مش فيد لحظي)
      roadOpacity.value = withDelay(
        ROAD_REVEAL_DELAY,
        withTiming(1, { duration: 120, easing: Easing.linear }),
      );
      roadReveal.value = withDelay(
        ROAD_REVEAL_DELAY,
        withTiming(1, { duration: ROAD_REVEAL_DURATION, easing: Easing.out(Easing.cubic) }),
      );
    }, DETAILS_START);

    const logoTimer = setTimeout(() => {
      setShowLogo(true);
      logoOpacity.value = withTiming(1, {
        duration: LOGO_FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });
      logoTranslateY.value = withTiming(0, {
        duration: LOGO_FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });
    }, DETAILS_START + LOGO_DELAY);

    const doneTimer = setTimeout(() => {
      setSequenceDone(true);
    }, DETAILS_START + LOGO_DELAY + LOGO_FADE_DURATION);

    return () => {
      clearTimeout(detailsTimer);
      clearTimeout(logoTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    if (ready && sequenceDone && !fadingOut) {
      setFadingOut(true);
      overlayOpacity.value = withDelay(
        300,
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) }, finished => {
          if (finished) runOnJS(onFinished)();
        }),
      );
    }
  }, [ready, sequenceDone, fadingOut]);

  // السهم الشمال: من تحت-يمين برّه الشاشة -> فوق-شمال برّه الشاشة -> مكانه النهائي
  const leftStyle = useAnimatedStyle(() => {
    const p = leftProgress.value;
    let tx, ty;
    if (p <= 1) {
      tx = (1 - p) * width * 0.75 - p * width * 0.55;
      ty = (1 - p) * height * 0.55 - p * height * 0.55;
    } else {
      const t = p - 1;
      tx = (1 - t) * width * 0.75 + t * FINAL_LEFT.x;
      ty = (1 - t) * height * 0.55 + t * FINAL_LEFT.y;
    }
    return { transform: [{ translateX: tx }, { translateY: ty }] };
  });

  // السهم اليمين: من تحت-شمال برّه الشاشة -> فوق-يمين برّه الشاشة -> مكانه النهائي
  const rightStyle = useAnimatedStyle(() => {
    const p = rightProgress.value;
    let tx, ty;
    if (p <= 1) {
      tx = -((1 - p) * width * 0.75) + p * width * 0.55;
      ty = (1 - p) * height * 0.55 - p * height * 0.55;
    } else {
      const t = p - 1;
      tx = -((1 - t) * width * 0.75) + t * FINAL_RIGHT.x;
      ty = (1 - t) * height * 0.55 + t * FINAL_RIGHT.y;
    }
    return { transform: [{ translateX: tx }, { translateY: ty }] };
  });

  const markerStyle = useAnimatedStyle(() => ({
    opacity: markerOpacity.value,
    transform: [
      { translateX: FINAL_MARKER.x },
      { translateY: FINAL_MARKER.y + markerTranslateY.value },
    ],
  }));

  // الصندوق الخارجي: مكانه ثابت تماماً (بس عشان نحدد فين تحط الطريق على الشاشة)
  const roadWrapperStyle = useAnimatedStyle(() => ({
    opacity: roadOpacity.value,
    transform: [{ translateX: FINAL_ROAD.x }, { translateY: FINAL_ROAD.y }],
  }));

  // صندوق الـ mask جوه: overflow hidden وملتصق بأسفل الصندوق الخارجي، وارتفاعه
  // بس هو اللي بيكبر من 0 لحد الارتفاع الكامل — الصورة نفسها جواه ثابتة
  // تماماً وملتصقة بأسفل الـ mask، فمفيش أي حركة/ترانسليشن، مجرد كشف تدريجي.
  const roadMaskStyle = useAnimatedStyle(() => ({
    height: roadReveal.value * ROAD_H,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateX: FINAL_LOGO.x },
      { translateY: FINAL_LOGO.y + logoTranslateY.value },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}
      pointerEvents={fadingOut ? 'none' : 'auto'}>
      <View style={styles.iconWrap}>
        {showDetails && (
          <Animated.View
            style={[
              { position: 'absolute', width: ROAD_W, height: ROAD_H },
              roadWrapperStyle,
            ]}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: ROAD_W,
                  overflow: 'hidden',
                },
                roadMaskStyle,
              ]}>
              <Animated.Image
                source={ROAD}
                resizeMode="contain"
                style={{ position: 'absolute', bottom: 0, left: 0, width: ROAD_W, height: ROAD_H }}
              />
            </Animated.View>
          </Animated.View>
        )}

        <Animated.Image
          source={LEFT_ARROW}
          resizeMode="contain"
          style={[{ width: LEFT_W, height: LEFT_H, position: 'absolute' }, leftStyle]}
        />
        <Animated.Image
          source={RIGHT_ARROW}
          resizeMode="contain"
          style={[{ width: RIGHT_W, height: RIGHT_H, position: 'absolute' }, rightStyle]}
        />
        {showDetails && (
          <Animated.Image
            source={MARKER}
            resizeMode="contain"
            style={[{ width: MARKER_W, height: MARKER_H, position: 'absolute' }, markerStyle]}
          />
        )}

        {showLogo && (
          <Animated.Image
            source={LOGO}
            resizeMode="contain"
            style={[{ width: LOGO_W, height: LOGO_H, position: 'absolute' }, logoStyle]}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1E3F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  iconWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashAnimation;