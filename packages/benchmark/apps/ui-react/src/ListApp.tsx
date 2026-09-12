import './List.css';

declare const __BENCH_LIST_ROWS__: number;

interface ListRowData {
  readonly id: string;
  readonly label: string;
}

const rows: readonly ListRowData[] = Array.from(
  { length: __BENCH_LIST_ROWS__ },
  (_, index) => ({ id: `row-${index}`, label: `Row ${index}` }),
);

export function ListApp() {
  return (
    <view className='bench-list-page'>
      <list
        className='bench-list-viewport'
        list-type='single'
        span-count={1}
        preload-buffer-count={2}
        scroll-orientation='vertical'
      >
        {rows.map((row) => (
          <list-item
            key={row.id}
            className='bench-list-cell'
            item-key={row.id}
            reuse-identifier='bench-list-row'
            estimated-main-axis-size-px={40}
          >
            <view className='bench-list-cell-body'>
              <text className='bench-list-key'>{row.id}</text>
              <text className='bench-list-label'>{row.label}</text>
            </view>
          </list-item>
        ))}
      </list>
    </view>
  );
}
