import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const ImageCropperModal = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // بيسجل أبعاد الجزء اللي اليوزر قصه بالظبط
  const onCropChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // الـ Function السحرية اللي بتقص الصورة حقيقي وتطلعها كـ Base64 عشان تعرضها فوراً
  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImage) // بيبعت الصورة المقصوصة الجاهزة للبروفايل
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 backdrop-blur-md animate-fade-in'>
      
      {/* الـ Header بتاع المودال */}
      <div className='flex justify-between items-center py-2 border-b border-zinc-800 z-10'>
        <button onClick={onCancel} className='text-zinc-400 hover:text-white text-sm bg-zinc-800 px-4 py-2 rounded-xl'>إلغاء</button>
        <h3 className='text-base font-semibold text-white'>تعديل أبعاد الصورة</h3>
        <button onClick={handleSave} className='text-white bg-blue-600 hover:bg-blue-500 text-sm px-4 py-2 rounded-xl font-bold'>حفظ</button>
      </div>

      {/* منطقة الـ Cropper - بتاخد المساحة اللي في النص */}
      <div className='relative flex-1 w-full my-4 rounded-2xl overflow-hidden bg-zinc-950'>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1} // نسبة 1:1 يعني مربع (مثالي للـ Avatar الدائري)
          cropShape="round" // بيخلي المربع الشفاف دائري عشان يوريك شكل البروفايل بالظبط
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropChange}
          onZoomChange={setZoom}
        />
      </div>

      {/* الـ Control بتاع الزوم تحت */}
      <div className='w-full flex flex-col items-center gap-2 pb-6 z-10 px-4'>
        <span className='text-xs text-zinc-400'>اسحب للتحكم في الحجم والوش</span>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

    </div>
  )
}

// الكود المساعد لقص الصورة حقيقي على Canvas وتحويلها لـ Image URL سريعة
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = imageSrc
    image.setAttribute('crossOrigin', 'anonymous')
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      resolve(canvas.toDataURL('image/jpeg')) // بتخرج كـ Base64 جاهز للعرض والرفع
    }
    image.onerror = (error) => reject(error)
  })
}

export default ImageCropperModal