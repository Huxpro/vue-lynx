# Create-path wire bytes — vapor delivery/staging cells (#337/#338)

- date: 2026-07-22T23:33:45.826Z; git: 605d93c; host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- Serialized vuePatchUpdate buffer bytes per op (BG flush hook), instrumented vapor app; cells: off=runtime REGISTER_TREE, bundle=+b! (REGISTER_TREE_BUNDLE hash only), code=+b:c (INSTANTIATE_TEMPLATE only).

| op | vapor bytes | +b! bytes | +b:c bytes | vapor ops | +b! ops | +b:c ops |
|---|--:|--:|--:|--:|--:|--:|
| create1k | 159529 | 159531 | 159480 | 7000 | 7000 | 7000 |
| update10th | 5192 | 5194 | 5281 | 100 | 100 | 100 |
| select | 39 | 39 | 39 | 2 | 2 | 2 |
| swap | 39 | 39 | 39 | 2 | 2 | 2 |
| remove | 13 | 13 | 13 | 1 | 1 | 1 |
| append1k | 171030 | 170948 | 170962.5 | 7000 | 7000 | 7000 |
| create10k | 1689303 | 1689690 | 1689562 | 70000 | 70000 | 70000 |
| clear10k | 120009 | 120009 | 120009 | 10001 | 10001 | 10001 |
