# ListDataSource iOS validation

Date: 2026-07-22

Device: iPhone 17 Pro Simulator, iOS 26.2

Host: LynxExplorer 1.4.0

Page: `ListDataSourceBenchmark.lynx.bundle`

## English

The benchmark completed successfully after applying all four mutation batches:

| Check | Result |
| --- | ---: |
| Initial logical rows | 10,000 |
| Final logical rows | 9,250 |
| Prepend | 250 rows, 803 ms |
| Middle removal | 1,000 rows, 682 ms |
| Rotation | 2,000 rows, 814 ms |
| Reactive updates | about 1,000 rows, 578 ms |
| Native cells created | 18 |
| Active / pooled | 9 / 9 |
| Hydrations | 72 |
| Native element nodes | 82 |
| Native `list-item` instances | 18 |
| Element memory | 87,904 bytes |
| Main-thread runtime | 39,876,992 bytes |
| Background runtime | 78,738,640 bytes |

The native DOM reported `logical=9250 · created=18 · active=9 · pooled=9 · hydrations=72` and contained exactly 18 physical `list-item` children. This independently confirms that logical item count is no longer equal to native tree count.

Existing device cases also completed without console errors:

| Case | Logical items | Created cells |
| --- | ---: | ---: |
| Basic | 80 | 9 |
| Waterfall | 40 | 12 |
| Infinite | 16 | 8 |
| Recycle | 40 | 7 |

An unpaced sequence of several distant `scrollToPosition` calls was intentionally run first. The host queued thousands of cell requests before returning off-screen leases, eventually materializing most rows. The stable workload paces distinct native relayouts by 350 ms. This does not hide an adapter leak: after the paced run the high-water mark remained 18 cells and half were in the recycle pool.

Evidence: [`list-data-source-benchmark.jpeg`](./list-data-source-benchmark.jpeg).

## 中文

四组 mutation 全部完成后，benchmark 验证通过：

| 检查项 | 结果 |
| --- | ---: |
| 初始逻辑行数 | 10,000 |
| 最终逻辑行数 | 9,250 |
| 前插 | 250 行，803 ms |
| 删除中间段 | 1,000 行，682 ms |
| 旋转移动 | 2,000 行，814 ms |
| 响应式更新 | 约 1,000 行，578 ms |
| 创建的 native cell | 18 |
| active / pooled | 9 / 9 |
| hydration 次数 | 72 |
| 原生 element node | 82 |
| 原生 `list-item` 实例 | 18 |
| element 内存 | 87,904 bytes |
| 主线程 runtime | 39,876,992 bytes |
| 后台 runtime | 78,738,640 bytes |

原生 DOM 显示 `logical=9250 · created=18 · active=9 · pooled=9 · hydrations=72`，并且确实只有 18 个物理 `list-item` 子节点。这独立证明逻辑数据量已不再等于原生树数量。

旧设备案例也均无 console error：Basic 80→9、Waterfall 40→12、Infinite 16→8、Recycle 40→7。

最初还故意执行了多个完全不间隔的远距离 `scrollToPosition`：host 在归还屏外 lease 之前排队请求了数千个 cell，最后物化了大部分行。稳定 workload 在相互独立的 native relayout 之间间隔 350 ms。这并不是掩盖适配器泄漏：稳定运行后的 cell 高水位仍为 18，并且其中一半已回到 recycle pool。

截图证据：[`list-data-source-benchmark.jpeg`](./list-data-source-benchmark.jpeg)。
