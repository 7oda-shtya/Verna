import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'http://192.168.1.10:5000/api'

const client = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
})

client.interceptors.request.use(async config => {
	const token = await SecureStore.getItemAsync('authToken')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

export default client