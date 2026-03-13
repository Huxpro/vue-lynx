import type React from 'react';
import { IconHandle } from '@douyinfe/semi-icons';
import { Resizable } from '@douyinfe/semi-ui';

export const ResizableContainer = ({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) => {
  return (
    <Resizable
      style={{
        display: show ? 'block' : 'none',
      }}
      enable={{
        top: false,
        right: false,
        bottom: false,
        topLeft: false,
        topRight: false,
        bottomLeft: false,
        bottomRight: false,
        left: true,
      }}
      defaultSize={{
        width: 280,
      }}
      minWidth={200}
      maxWidth={600}
      handleStyle={{
        left: {
          left: '-8px',
          width: '8px',
        },
      }}
      handleNode={{
        left: (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconHandle style={{ fontSize: '12px', marginLeft: '-2px' }} />
          </div>
        ),
      }}
    >
      {children}
    </Resizable>
  );
};
