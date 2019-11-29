import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';

import LockStory from './LockStory.vue';
import GroupStory from './GroupStory.vue';
import NoFocusGuardsStory from './NoFocusGuardsStory.vue';
import NoTailingGuardStory from './NoTailingGuardStory.vue';

storiesOf('Lock', module)
  .add('simple', () => ({
    components: { LockStory },
    template: '<lock-story></lock-story>',
    methods: { action: action('clicked') },
  }));

storiesOf('Group', module)
  .add('focus group', () => ({
    components: { GroupStory },
    template: '<group-story></group-story>'
  }));

storiesOf('No focus guards', module)
  .add('no focus guards', () => ({
    components: { NoFocusGuardsStory },
    template: '<no-focus-guards-story></no-focus-guards-story>'
  }))
  .add('no tailing guard', () => ({
    components: { NoTailingGuardStory },
    template: '<no-tailing-guard-story></no-tailing-guard-story>'
  }));
