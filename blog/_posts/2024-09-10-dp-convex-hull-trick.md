---
title: "Convex Hull Trick dalam Dynamic Programming"
date: 2024-09-10 09:00:00 +0900
categories: [Algorithms]
tags: [competitive-programming, dynamic-programming, indonesia]
description: "(Post in Indonesian) Trik khusus dalam Dynamic Programming."
media_subpath: /assets/2024-09-10-dp-convex-hull-trick
image:
  path: img/max-y.png
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

Slide bisa [diunduh disini]({{ site.baseurl }}{{ page.media_subpath }}/pdf/convex_hull_dp.pdf).

<embed
  class="embed-pdf-4-3"
  src="{{ site.baseurl }}{{ page.media_subpath }}/pdf/convex_hull_dp.pdf"
  type="application/pdf"
  />

## Contoh soal

### SPOJ GOODG
Untuk soal, [klik disini](https://www.spoj.com/problems/GOODG/)

Solusinya (dalam C++) bisa dilihat di bawah:

```c++
#include <bits/stdc++.h>
#define INF 1000000000
using namespace std;
typedef long long LL;

// Struktur data garis dalam bentuk ax + by = c
struct Line{ //ax+by=c
	LL a,b,c;
	
  // Komponen x pada titik potong
  double intersect(Line l) {
		assert(a*l.b != b*l.a);
		return (double)((c*l.b) - (b*l.c))/(double)((a*l.b)-(b*l.a));
	}

	LL evaluate(LL x) {
		return c-(a*x);
	}
};

// Struktur data untuk menyimpan garis-garis relevan
struct RelevantLines{
    // Vector sebagai stack
    vector<Line> lines;

    void insert_line(Line l) {
        Line l3 = l;
        while (lines.size() > 1) {
            int sz = (int)lines.size();
            Line l1 = lines[sz-2];
            Line l2 = lines[sz-1];
            double x_12 = l1.intersect(l2);
            double x_13 = l1.intersect(l3);
            
            if (x_13 <= x_12) lines.pop_back();
            else break;
        }
        
        lines.push_back(l3);
    }

    pair<double, double> get_interval(int line_idx) {
        double left_interval = -INF;
        double right_interval = INF;

        if (line_idx > 0)
            left_interval = lines[line_idx].intersect(lines[line_idx-1]);

        if (line_idx < (int)lines.size()-1)
            right_interval = lines[line_idx].intersect(lines[line_idx+1]);

        return make_pair(left_interval, right_interval);
    }

    // Binary search
    LL query(LL x) {
        int l = 0;
        int r = lines.size()-1;
        int mid;
        while (l<=r) {
            mid = (l+r)/2;
            pair<double, double> interval = get_interval(mid);
            if ((interval.first <= x) && (x <= interval.second))
                return lines[mid].evaluate(x);
            else if (x > interval.second)
                l = mid + 1;
            else
                r = mid - 1;
        }

        // Shouldn't have reached here
        assert(false);
    }
};

// y = mx + c menjadi (-m)x + y = c (ax + by = c)
Line make_line(LL m, LL c) {
    return (Line){-m, 1, c};
}


LL a[1000005], d[1000005];
LL V[1000005];
int main() {
    int N;
    cin.sync_with_stdio(0);
    cin.tie(0);

    cin >> N;
    for (int i=1;i<=N;++i)
        cin >> a[i] >> d[i];
    
    LL ans = 0;
    RelevantLines y_rel;
    memset(V, 0, sizeof V);
    
    y_rel.insert_line(make_line(-(N+1), 0));
    for (LL i=N;i>=1;--i) {
        LL maxval = y_rel.query(d[i]);
        V[i] = a[i] + maxval + i*d[i];
        ans = max(ans, V[i]);
        y_rel.insert_line(make_line(-i, V[i]));
    }

    cout << ans << '\n';
    return 0;
}
```
