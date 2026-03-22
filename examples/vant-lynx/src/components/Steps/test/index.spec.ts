import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Steps from '../index.vue';
import Step from '../../Step/index.vue';

describe('Steps', () => {
  it('should render steps with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 0 }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    // Steps root should have van-steps class
    const stepsEl = container.querySelector('.van-steps');
    expect(stepsEl).toBeTruthy();
    // Default direction is horizontal
    expect(container.querySelector('.van-steps--horizontal')).toBeTruthy();
  });

  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 0 }, {
            default: () => [
              h(Step, null, {
                default: () => 'B',
                'active-icon': () => 'Custom Active Icon',
              }),
              h(Step, null, {
                default: () => 'A',
                'inactive-icon': () => 'Custom Inactive Icon',
              }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Active Icon');
    expect(texts).toContain('Custom Inactive Icon');
  });

  it('should emit clickStep event when step is clicked', async () => {
    const onClickStep = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1, onClickStep }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
              h(Step, null, { default: () => 'C' }),
            ],
          });
        },
      }),
    );

    // Click on the first step title
    const titles = container.querySelectorAll('.van-step__title');
    expect(titles.length).toBe(3);
    await fireEvent.tap(titles[0]);
    expect(onClickStep).toHaveBeenCalledWith(0);

    // Click on the third step circle-container
    const circles = container.querySelectorAll('.van-step__circle-container');
    await fireEvent.tap(circles[2]);
    expect(onClickStep).toHaveBeenCalledTimes(2);
    expect(onClickStep).toHaveBeenLastCalledWith(2);
  });

  it('should change inactive color when using inactive-color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 0, inactiveColor: 'red' }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    // The waiting step title should have inactiveColor
    const titles = container.querySelectorAll('.van-step__title');
    expect(titles.length).toBe(2);
    // Second step (waiting) should have red color style
    const waitingTitle = titles[1];
    expect(waitingTitle.getAttribute('style')).toContain('red');
  });

  it('should change inactive icon when using inactive-icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 0, inactiveIcon: 'foo' }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    // The second step (waiting) should render an Icon with name "foo"
    const steps = container.querySelectorAll('.van-step');
    expect(steps.length).toBe(2);
    const waitingStep = steps[1];
    // Icon component renders with van-icon-foo class
    expect(waitingStep.querySelector('.van-icon-foo')).toBeTruthy();
  });

  it('should change finish icon when using finish-icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1, finishIcon: 'foo' }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    // First step (finish) should render an Icon with name "foo"
    const firstStep = container.querySelector('.van-step');
    expect(firstStep).toBeTruthy();
    expect(firstStep!.querySelector('.van-icon-foo')).toBeTruthy();
  });

  it('should render finish icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1 }, {
            default: () => [
              h(Step, null, {
                default: () => 'A',
                'finish-icon': () => 'Custom Finish Icon',
              }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Finish Icon');
  });

  it('should render vertical direction', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 0, direction: 'vertical' }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    expect(container.querySelector('.van-steps--vertical')).toBeTruthy();
    expect(container.querySelector('.van-step--vertical')).toBeTruthy();
  });

  it('should apply correct status classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1 }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
              h(Step, null, { default: () => 'C' }),
            ],
          });
        },
      }),
    );
    const steps = container.querySelectorAll('.van-step');
    expect(steps.length).toBe(3);
    // First step: finish
    expect(steps[0].className).toContain('van-step--finish');
    // Second step: process
    expect(steps[1].className).toContain('van-step--process');
    // Third step: waiting
    expect(steps[2].className).toContain('van-step--waiting');
  });

  it('should render icon-prefix correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Steps, { active: 1, iconPrefix: 'custom-icon' }, {
            default: () => [
              h(Step, null, { default: () => 'A' }),
              h(Step, null, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    // The active step icon should use custom-icon prefix
    const activeStep = container.querySelector('.van-step--process');
    expect(activeStep).toBeTruthy();
    expect(activeStep!.querySelector('.custom-icon')).toBeTruthy();
  });
});
