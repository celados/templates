import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '../../.env' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL is required for Drizzle migrations')
}

export default defineConfig({
	dbCredentials: {
		// Migrations connect directly; Worker runtime traffic always uses Hyperdrive.
		url: databaseUrl,
	},
	dialect: 'postgresql',
	out: './drizzle',
	schema: './src/schema',
})
