import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';

import LockStory from './LockStory.vue';
import GroupStory from './GroupStory.vue';

storiesOf('Lock', module)
  .add('simple', () => ({
    components: { LockStory },
    template: '<lock-story></lock-story>',
    methods: { action: action('clicked') },
  }))

storiesOf('Group', module)
  .add('focus group', () => ({
    components: { GroupStory },
    template: '<group-story></group-story>'
  }))
