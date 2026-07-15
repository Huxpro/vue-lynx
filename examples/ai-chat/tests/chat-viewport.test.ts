import { describe, expect, it } from 'vitest';

import {
  bottomDistance,
  calculateBottomSpacer,
  calculateMessageLaunchDistance,
  isNearBottom,
  nextWebBottomOffset,
  turnScrollMode,
} from '../src/lib/chat-viewport';

describe('chat viewport geometry', () => {
  it('treats the user as near the bottom within a small tolerance', () => {
    const metrics = { scrollTop: 508, scrollHeight: 1200, viewportHeight: 640 };

    expect(bottomDistance(metrics)).toBe(52);
    expect(isNearBottom(metrics)).toBe(true);
    expect(isNearBottom({ ...metrics, scrollTop: 400 })).toBe(false);
  });

  it('clamps bounce and undersized-content distances to zero', () => {
    expect(bottomDistance({ scrollTop: -20, scrollHeight: 500, viewportHeight: 640 })).toBe(0);
    expect(
      bottomDistance({
        scrollTop: 600,
        scrollHeight: 1200,
        viewportHeight: 640,
      }),
    ).toBe(0);
  });

  it('uses the measured composer height as the normal bottom spacer', () => {
    expect(
      calculateBottomSpacer({
        composerHeight: 116,
        keyboardHeight: 0,
        viewportHeight: 640,
      }),
    ).toBe(116);
  });

  it('shrinks intentional blank space while the keyboard or answer consumes it', () => {
    const closed = calculateBottomSpacer({
      composerHeight: 104,
      keyboardHeight: 0,
      viewportHeight: 700,
      anchoredTurnHeight: 84,
    });
    const opened = calculateBottomSpacer({
      composerHeight: 104,
      keyboardHeight: 300,
      viewportHeight: 700,
      anchoredTurnHeight: 84,
    });

    expect(closed).toBe(600);
    expect(opened).toBe(600);
    expect(
      calculateBottomSpacer({
        composerHeight: 104,
        keyboardHeight: 300,
        viewportHeight: 700,
        anchoredTurnHeight: 640,
      }),
    ).toBe(404);
  });

  it('uses conventional bottom-follow scrolling on Web and top anchoring on Native', () => {
    expect(turnScrollMode('web')).toBe('bottom');
    expect(turnScrollMode('iOS')).toBe('anchor');
    expect(turnScrollMode('Android')).toBe('anchor');
  });

  it('changes the Web bottom offset on every request so the observed attribute fires', () => {
    const first = nextWebBottomOffset(0);
    const second = nextWebBottomOffset(first);
    const third = nextWebBottomOffset(second);

    expect(first).toBe(1_000_000);
    expect(second).toBe(999_999);
    expect(third).toBe(1_000_000);
  });

  it('measures a visible Native launch from the composer toward the anchored turn', () => {
    expect(
      calculateMessageLaunchDistance({
        platform: 'iOS',
        viewportHeight: 760,
        composerHeight: 112,
        keyboardHeight: 300,
        messageHeight: 72,
      }),
    ).toBe(260);
    expect(
      calculateMessageLaunchDistance({
        platform: 'iOS',
        viewportHeight: 1200,
        composerHeight: 80,
        keyboardHeight: 0,
        messageHeight: 40,
      }),
    ).toBe(420);
    expect(
      calculateMessageLaunchDistance({
        platform: 'Android',
        viewportHeight: 240,
        composerHeight: 160,
        keyboardHeight: 80,
        messageHeight: 72,
      }),
    ).toBe(44);
    expect(
      calculateMessageLaunchDistance({
        platform: 'web',
        viewportHeight: 760,
        composerHeight: 112,
        keyboardHeight: 0,
        messageHeight: 72,
      }),
    ).toBe(0);
  });
});
