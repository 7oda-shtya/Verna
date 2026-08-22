/*
 * ملف reportWebVitals يمرر callback الأداء إلى مكتبة web-vitals عند الحاجة.
 */
// onPerfEntry يأتي من استدعاء reportWebVitals في index.js أو من أي نقطة قياس أداء.
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
