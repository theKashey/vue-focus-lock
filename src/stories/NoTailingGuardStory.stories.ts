import NoTailingGuardStory from './NoTailingGuardStory.vue'

import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'NoTailingGuardStory',
  component: NoTailingGuardStory
} satisfies Meta<typeof NoTailingGuardStory>

export default meta
type Story = StoryObj<typeof meta>

export const NoTailingGuards: Story = {}
