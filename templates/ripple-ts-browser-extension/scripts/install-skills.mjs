#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'

// Project skills configure local agent tooling; CI and non-macOS hosts must not need private repos.
if (process.platform === 'darwin' && process.env.CI === undefined) {
	const skillInstall = spawnSync('skill', ['install'], { stdio: 'inherit' })

	if (skillInstall.error) {
		throw skillInstall.error
	}

	process.exitCode = skillInstall.status ?? 1
}
