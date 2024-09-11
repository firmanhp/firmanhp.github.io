---
title: "Teknik Divide and Conquer dalam Dynamic Programming"
date: 2024-09-09 19:00:00 +0900
categories: [Algorithms]
tags: [competitive-programming, dynamic-programming, indonesia]
description: "(Post in Indonesian) Trik khusus dalam Dynamic Programming."
media_subpath: /assets/2024-09-09-dp-divide-and-conquer
image:
  path: img/recursion-tree.png
render_with_liquid: true
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/global/css/embed-pdf.css">

> **DISCLAIMER:**
Post ini memuat slide saja. Slide ini dibuat waktu saya diminta bantuan oleh Pak Denny
untuk mengisi kelas *Competitive Programming* waktu saya masih kuliah. Sekarang, saya sudah
tidak lagi aktif dalam dunia *competitive programming*. Mohon maaf apabila ada
kesalahan 🙏🙏🙏, *source code* untuk latexnya pun sudah hilang.
{: .prompt-warning}

## Materi

Slide bisa [diunduh disini]({{ site.baseurl }}{{ page.media_subpath }}/pdf/dnc_dp.pdf).

<embed
  class="embed-pdf-4-3"
  src="{{ site.baseurl }}{{ page.media_subpath }}/pdf/dnc_dp.pdf"
  type="application/pdf"
  />


## Contoh soal

### SPOJ LARMY
Untuk soal, [klik disini](https://www.spoj.com/problems/LARMY/)

Solusinya (dalam C++) bisa dilihat di bawah:

```c++
#include <bits/stdc++.h>
#define INF 1e9
using namespace std;

int N, K, H[5005];
int C[5005][5005];

int greater_heights[5005];
int dp[5005][5005];

void precompute_C() {
    // Hitung banyaknya tentara yang lebih tinggi di sebelah kiri
    // Ini awalnya akan menjadi nilai dari C[1][i]
    for (int i = 1; i <= N; ++i) {
        for (int j = 1; j < i; ++j) {
            if (H[j] > H[i])
                ++greater_heights[i];
        }
    }

    // Precompute C[i][j]
    for (int i = 1; i <= N; ++i) {
        for (int j = i; j <= N; ++j) {
            C[i][j] = greater_heights[j] + C[i][j-1];
        }

        // Untuk membuang orang ke-i untuk menghitung C[i+1][j]
        // menggunakan array greater_heights[]
        for (int j = i+1; j<= N; ++j) {
            if (H[j] < H[i]) {
                --greater_heights[j];
            }
        }
    }
}

// Basecase DP
void fill_basecase() {
    for (int i = 1; i <= N; ++i)
        dp[0][i] = INF;

    for (int i = 1; i <= K; ++i)
        dp[i][0] = INF;
}

void fill_table_row(int i, int l, int r, int opt_l, int opt_r) {
    if (l > r)
        return;
    
    int mid = (l+r)>>1;
    
    // mendapatkan opt_mid sambil mengisi nilai dp
    int opt_mid = -1;
    for (int k = opt_l; k <= opt_r; ++k) {
        // apabila k >= mid, sudah tidak termasuk batasan rekurens
        if (k >= mid)
            break;
        int val = dp[i-1][k] + C[k+1][mid];
        if ((opt_mid == -1) || (dp[i][mid] > val)) {
            opt_mid = k;
            dp[i][mid] = val;
        }
    }
    fill_table_row(i, l, mid-1, opt_l, opt_mid);
    fill_table_row(i, mid+1, r, opt_mid, opt_r);
}

int main() {
    cin.sync_with_stdio(0);
    cin.tie(0);
    cin >> N >> K;
    for(int i=1;i<=N;++i) {
        cin >> H[i];
    }

    precompute_C();
    fill_basecase();

    // Isi tabel DP
    for (int i=1;i<=K;++i) {
        fill_table_row(i, 1, N, 0, N-1);
    }

    cout << dp[K][N] << '\n';
    return 0;
}
```

### Kattis famouspagoda
Untuk soal, [klik disini](https://open.kattis.com/problems/famouspagoda)
