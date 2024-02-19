import GroupStory from './GroupStory.vue'

import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'GroupStory',
  component: GroupStory
} satisfies Meta<typeof GroupStory>

export default meta
type Story = StoryObj<typeof meta>

export const FocusGroup: Story = {}
