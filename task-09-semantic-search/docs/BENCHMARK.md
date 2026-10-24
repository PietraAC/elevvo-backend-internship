# Task 9 Local Benchmark

- Date: 2026-10-24T01:52:53.367Z
- Runtime: Node.js v24.15.0
- Platform: win32 10.0.26200, AMD Ryzen 7 5800H with Radeon Graphics
- Model: Xenova/all-MiniLM-L6-v2
- Method: one explicit MISS, 100 sequential HIT requests, then 20 concurrent requests

| Metric | Result |
|---|---:|
| Minimum | 0.7 ms |
| Median | 0.9 ms |
| p95 | 1.2 ms |
| p99 | 1.6 ms |
| Maximum | 1.8 ms |
| Sequential cache hits | 100/100 |
| Concurrent cache hits | 20/20 |

**Result:** PASS — warm-cache p95 must be below 100 ms with 100/100 cache hits.
