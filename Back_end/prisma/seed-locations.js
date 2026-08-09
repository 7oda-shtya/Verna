import 'dotenv/config'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../src/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
	const raw = await readFile(path.join(__dirname, '../src/data/locations.json'), 'utf-8')
	const places = JSON.parse(raw)

	let created = 0
	let skipped = 0

	for (const place of places) {
		const name = place.name[0]
		const lat = place.coords[0]
		const lng = place.coords[1]

		const existing = await prisma.location.findFirst({ where: { name } })
		if (existing) {
			skipped++
			continue
		}

		await prisma.location.create({ data: { name, lat, lng } })
		created++
	}

	console.log(`Seed done: ${created} created, ${skipped} skipped (already existed).`)
}

main()
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
