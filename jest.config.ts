import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset()

export default {
  ...presetConfig,
  collectCoverage: true,
  coverageReporters: ['text'],
  resolver: 'ts-jest-resolver',
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/types/**/*.{ts,js}',
    '!src/**/constants/**/*.{ts,js}',
  ],

} satisfies Config