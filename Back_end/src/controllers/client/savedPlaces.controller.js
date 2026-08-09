import ApiError from '../../utils/ApiError.js'
import { catchAsync } from '../../utils/catchAsync.js'
import { prisma } from '../../db.js'

const optionalText = value => {
	if (value === undefined) return undefined
	const text = String(value ?? '').trim()
	return text || null
}

const requiredText = (value, field) => {
	const text = String(value ?? '').trim()
	if (!text) throw new ApiError(400, 'اسم المكان مطلوب', field)
	return text
}

const requiredCoordinate = (value, field) => {
	const coordinate = Number(value)
	if (!Number.isFinite(coordinate)) throw new ApiError(400, 'الإحداثيات غير صحيحة', field)
	return coordinate
}

const findOwnedPlace = async (id, userId) => {
	const savedPlace = await prisma.savedPlace.findFirst({ where: { id, userId } })
	if (!savedPlace) throw new ApiError(404, 'المكان المحفوظ غير موجود')
	return savedPlace
}

export const getSavedPlaces = catchAsync(async (req, res) => {
	const savedPlaces = await prisma.savedPlace.findMany({
		where: { userId: req.user.id },
		orderBy: { createdAt: 'desc' },
	})
	res.status(200).json({ success: true, data: savedPlaces })
})

export const createSavedPlace = catchAsync(async (req, res) => {
	const { name, address, lat, lng, icon } = req.body
	const savedPlace = await prisma.savedPlace.create({
		data: {
			name: requiredText(name, 'name'),
			address: optionalText(address),
			lat: requiredCoordinate(lat, 'lat'),
			lng: requiredCoordinate(lng, 'lng'),
			icon: optionalText(icon),
			userId: req.user.id,
		},
	})
	res.status(201).json({ success: true, data: savedPlace })
})

export const updateSavedPlace = catchAsync(async (req, res) => {
	const { id } = req.params
	await findOwnedPlace(id, req.user.id)

	const data = {}
	if (req.body.name !== undefined) data.name = requiredText(req.body.name, 'name')
	for (const field of ['address', 'icon']) {
		if (req.body[field] !== undefined) data[field] = optionalText(req.body[field])
	}
	for (const field of ['lat', 'lng']) {
		if (req.body[field] !== undefined) data[field] = requiredCoordinate(req.body[field], field)
	}
	if (!Object.keys(data).length) throw new ApiError(400, 'مفيش بيانات للتعديل')

	const savedPlace = await prisma.savedPlace.update({ where: { id }, data })
	res.status(200).json({ success: true, data: savedPlace })
})

export const deleteSavedPlace = catchAsync(async (req, res) => {
	const { id } = req.params
	await findOwnedPlace(id, req.user.id)
	await prisma.savedPlace.delete({ where: { id } })
	res.status(200).json({ success: true })
})
