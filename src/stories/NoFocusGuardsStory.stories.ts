import NoFocusGuardsStory from './NoFocusGuardsStory.vue'

import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'NoFocusGuardsStory',
  component: NoFocusGuardsStory
} satisfies Meta<typeof NoFocusGuardsStory>

export default meta
type Story = StoryObj<typeof meta>

export const NoFocusGuards: Story = {}
