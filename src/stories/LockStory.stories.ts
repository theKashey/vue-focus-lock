import LockStory from './LockStory.vue'

import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'LockStory',
  component: LockStory
} satisfies Meta<typeof LockStory>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {}
