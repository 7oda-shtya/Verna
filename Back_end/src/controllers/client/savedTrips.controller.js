import ApiError from '../../utils/ApiError.js'
import { catchAsync } from '../../utils/catchAsync.js'
import { prisma } from '../../db.js'

const optionalText = value => {
	if (value === undefined) return undefined
	const text = String(value ?? '').trim()
	return text || null
}

const requiredText = (value, field, label) => {
	const text = String(value ?? '').trim()
	if (!text) throw new ApiError(400, `${label} مطلوب`, field)
	return text
}

const requiredCoordinate = (value, field) => {
	const coordinate = Number(value)
	if (!Number.isFinite(coordinate)) throw new ApiError(400, 'الإحداثيات غير صحيحة', field)
	return coordinate
}

const findOwnedTrip = async (id, userId) => {
	const savedTrip = await prisma.savedTrip.findFirst({ where: { id, userId } })
	if (!savedTrip) throw new ApiError(404, 'الرحلة المحفوظة غير موجودة')
	return savedTrip
}

export const getSavedTrips = catchAsync(async (req, res) => {
	const savedTrips = await prisma.savedTrip.findMany({
		where: { userId: req.user.id },
		orderBy: { createdAt: 'desc' },
	})
	res.status(200).json({ success: true, data: savedTrips })
})

export const createSavedTrip = catchAsync(async (req, res) => {
	const { title, icon, fromLat, fromLng, fromName, toLat, toLng, toName } = req.body
	const savedTrip = await prisma.savedTrip.create({
		data: {
			title: requiredText(title, 'title', 'اسم الرحلة'),
			icon: optionalText(icon),
			fromLat: requiredCoordinate(fromLat, 'fromLat'),
			fromLng: requiredCoordinate(fromLng, 'fromLng'),
			fromName: optionalText(fromName),
			toLat: requiredCoordinate(toLat, 'toLat'),
			toLng: requiredCoordinate(toLng, 'toLng'),
			toName: optionalText(toName),
			userId: req.user.id,
		},
	})
	res.status(201).json({ success: true, data: savedTrip })
})

export const updateSavedTrip = catchAsync(async (req, res) => {
	const { id } = req.params
	await findOwnedTrip(id, req.user.id)

	const data = {}
	if (req.body.title !== undefined) data.title = requiredText(req.body.title, 'title', 'اسم الرحلة')
	for (const field of ['icon', 'fromName', 'toName']) {
		if (req.body[field] !== undefined) data[field] = optionalText(req.body[field])
	}
	for (const field of ['fromLat', 'fromLng', 'toLat', 'toLng']) {
		if (req.body[field] !== undefined) data[field] = requiredCoordinate(req.body[field], field)
	}
	if (!Object.keys(data).length) throw new ApiError(400, 'مفيش بيانات للتعديل')

	const savedTrip = await prisma.savedTrip.update({ where: { id }, data })
	res.status(200).json({ success: true, data: savedTrip })
})

export const deleteSavedTrip = catchAsync(async (req, res) => {
	const { id } = req.params
	await findOwnedTrip(id, req.user.id)
	await prisma.savedTrip.delete({ where: { id } })
	res.status(200).json({ success: true })
})

// Backwards-compatible name used by older imports.
export const addLocationToSavedTrips = createSavedTrip
