import client from './client'

const isDriverApp = process.env.APP_VARIANT === 'driver'
const base = isDriverApp ? '/driver/auth' : '/client/auth'
const accountRole = isDriverApp ? 'DRIVER' : 'CLIENT'

export const loginRequest = (identifier, password) => {
	return client.post(`${base}/login`, isDriverApp ? { phone: identifier, password } : { identifier, password })
}

export const registerRequest = data => {
	if (!isDriverApp) return client.post(`${base}/register`, data)

	const formData = data instanceof FormData ? data : new FormData()
	if (!(data instanceof FormData)) {
		Object.entries(data).forEach(([key, value]) => {
			if (value == null) return
			if ((key === 'license' || key === 'carPicture') && value.uri) {
				formData.append(key, {
					uri: value.uri,
					type: value.mimeType || value.type || 'image/jpeg',
					name: value.fileName || value.name || `${key}.jpg`,
				})
				return
			}
			formData.append(key, value)
		})
	}

	return client.post(`${base}/register`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
}

export const getMeRequest = () => {
	return client.get(`${base}/me`)
}

export const updateProfileRequest = formData => {
	return client.put('/client/auth/profile', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
}

export const requestOtpRequest = (phone, purpose) => {
	return client.post('/auth/otp/request', { phone, purpose, role: accountRole })
}

export const verifyOtpRequest = (phone, code, purpose) => {
	return client.post('/auth/otp/verify', { phone, code, purpose, role: accountRole })
}

export const resetPasswordRequest = (phone, code, newPassword) => {
	return client.post('/auth/password/reset', { phone, code, newPassword, role: accountRole })
}

export const changePasswordRequest = (currentPassword, newPassword) => {
	return client.patch('/client/auth/password', { currentPassword, newPassword })
}

export const deleteAccountRequest = password => {
	return client.delete('/client/auth/account', { data: { password } })
}
