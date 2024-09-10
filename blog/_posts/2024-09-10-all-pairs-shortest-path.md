---
title: "All-Pairs Shortest Path"
date: 2024-09-10 11:00:00 +0900
categories: [Algorithms]
tags: [competitive-programming, graph-theory, indonesia]
description: "(Post in Indonesian) Algoritma klasik dalam teori graf."
media_subpath: /assets/2024-09-10-all-pairs-shortest-path
image:
  path: img/graph.png
render_with_liquid: true
---
<link rel="stylesheet" href="{{ site.baseurl }}/assets/global/css/embed-pdf.css">

Saat kuliah Desain dan Analisis Algoritma (yang diampu oleh [Kak Raja](https://nivotko.wordpress.com)),
kami diberikan tugas akhir untuk menjelaskan satu topik algoritma tingkat *advanced*. Seingat saya untuk
pembagian topiknya diundi. Untungnya tim kami (+Norman, +Reynaldo, +Windi) dapat bagian yang termasuk
paling mudah (*All-pairs shortest path*), yang lain seingat saya dapat yang lebih sulit seperti *Flow*,
*Fast fourier transform*, dan *Shor's algorithm*?

Jadinya kami mengambil sumber dari buku Algorithms dari Jeff Erickson ([Bukunya gratis](http://algorithms.wtf)).
Buku tsb juga menjadi salah satu buku referensi saat kuliah. Daripada slide dan diktatnya nganggur, jadi saya taro
sini saja biar enggak mubazir. Lumayan untuk nambah sumber belajar CS berbahasa Indonesia.

Biasanya untuk APSP kita pakai algoritma *Floyd-Warshall*, namun notes di bawah juga membantu menjelaskan perspektif
lain yang tidak biasa didengar (buat saya) seperti algoritma *Johnson*, *Shimbel*, dan *Fischer-Meyer*

## Materi

### Slide

Slide bisa [diunduh disini]({{ site.baseurl }}{{ page.media_subpath }}/pdf/apsp-slide.pdf).

<embed
  class="embed-pdf-16-9"
  src="{{ site.baseurl }}{{ page.media_subpath }}/pdf/apsp-slide.pdf"
  type="application/pdf"
  />

### Diktat

Diktat bisa [diunduh disini]({{ site.baseurl }}{{ page.media_subpath }}/pdf/apsp-notes.pdf).

<embed
  class="embed-pdf-letter"
  src="{{ site.baseurl }}{{ page.media_subpath }}/pdf/apsp-notes.pdf"
  type="application/pdf"
  />

