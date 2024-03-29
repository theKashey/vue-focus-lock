# vue-focus-lock
It is a trap! We got your focus and will not let him out!

[![NPM](https://nodei.co/npm/vue-focus-lock.png?downloads=true&stars=true)](https://nodei.co/npm/vue-focus-lock/)

----

- __Vue3 users__ - use v3+ `vue-focus-lock@3`
- __Vue2 users__ - use v2+ `vue-focus-lock@2`

----

This is a small, but very useful for:
 - Modal dialogs. You can not leave it with "Tab", ie tab-out.
 - Focused tasks. It will always brings you back.
 
You have to use it in _every_ modal dialog, or you `a11y` will be shitty.
 
# How to use
Just wrap something with focus lock, and focus will be `moved inside` on mount.
```html
<FocusLock>
 You can not leave this form
 <button @click="onClick" />
</FocusLock> 
```
 Demo - https://codesandbox.io/s/l5qlpxqvnq

# WHY?
From [MDN Article about accessible dialogs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_dialog_role):
 - The dialog must be properly labeled
 - Keyboard __focus must be managed__ correctly
 
This one is about managing the focus.

I'v got a good [article about focus management, dialogs and  WAI-ARIA](https://medium.com/@antonkorzunov/its-a-focus-trap-699a04d66fb5).    


# Behavior
 0. It will always keep focus inside Lock.
 1. It will cycle forward then you press Tab.
 2. It will cycle in reverse direction on Shift+Tab.
 3. It will do it using _browser_ tools, not emulation.
 4. It will handle positive tabIndex inside form.
 5. It will prevent any jump outside, returning focus to the last element.
 
 !! this realisation will not return focus  to the original place on Unlock !! 

You can use nested Locks or have more than one Lock on the page.
Only `last`, or `deepest` one will work. No fighting.

# API
 FocusLock has few props to tune behavior, all props are optional:
  - `disabled`, to disable(enable) behavior without altering the tree.
  - `group=''`, named focus group for focus scattering aka [combined lock targets](https://github.com/theKashey/vue-focus-lock/issues/2).
  - `noFocusGuards=false`, disable focus guards - virtual inputs which secure tab index.

#### Removing Tailing Guard
  FocusLock is adding `Focus Guards` before and after lock to remove some side effects, like page scrolling. 
  If you want to allow user _tab_ into address bar (only if your modal is the last tabbable element on the body), 
  you might remove the Tailing Guard. To do this, set `noFocusGuards` prop to `tail`.
```html
<FocusLock no-focus-guards="tail">
    ...
</FocusLock> 
```

# How it works
 Everything thing is simple - vue-focus-lock just dont left focus left boundaries of component, and
 do something only if escape attempt was succeeded.
 
 It is not altering tabbing behavior at all. We are good citizens.

# Licence
 MIT
 
 
