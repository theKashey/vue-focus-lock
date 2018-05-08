import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';

import LockStory from './LockStory.vue';

storiesOf('Lock', module)
  .add('simple', () => ({
    components: { LockStory },
    template: '<lock-story></lock-story>',
    methods: { action: action('clicked') },
  }))
