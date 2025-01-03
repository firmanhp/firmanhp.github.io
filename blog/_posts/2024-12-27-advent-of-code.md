---
title: Finishing Advent of Code 2024
date: 2024-12-27 01:00:00 +0800
categories: [General]
description: ...by not doing my OSDev project.
media_subpath: /assets/2024-12-27-advent-of-code
render_with_liquid: false
image:
  path: img/aoc2024.jpg
  alt: Getting distracted.
---

So yeah, this was my first participation in the Advent of Code, despite knowing
the event from few years ago. This distracted me from doing the OSDev project,
in a good way, because I feel I need to brush up my problem solving skills
(iykyk). All of the source code of my solutions can be seen
[here](https://github.com/firmanhp/aoc2024).

![](img/50_stars.png)

While solving these puzzles, I went "crazy" writing the codes for it. By
"crazy", I attempted several stuffs that are new to me, in a sense that I never
implemented myself (only saw the idea during my work, or reading someone's
code). For example, I wrote a
[Vector2D](https://github.com/firmanhp/aoc2024/blob/main/util/vector_2d.h) class
because I didn't like the idea of `std::vector<std::vector<T>>`, so I think this
is an opportunity for me do make a 2D dynamic sized array. Another one, is I
made a
[ThreadPool](https://github.com/firmanhp/aoc2024/blob/main/util/thread_pool.h)
class so my bruteforce solutions can work using multiple cores. Not so
interesting stuff, I agree - but it's a good learning experience for me. I think
I missed an opportunity to make my code run on GPU, for more fast bruteforces...

## Interesting problems

I listed problems that were interesting to me. Mostly because the solving needs
to be more creative than solving other "competitive programming" problems. Since
all part 1s of the problem are relatively simpler than the part 2, I am going to
list only part 2 of the problems.

### Day 12 - Garden Groups

The part 2 of this problem will ask us to count the number of sides, in addition
of its area. It is really tricky to count the sides of one line, for example
`EEEEE` is 4 sides because it forms a rectangle, and this shape forms 12 sides.

```text
EEEEE
E
EEEEE
E
EEEEE
```

To make the above shape easier, we can "scale up" the shape, say scale it up 2x.

```text
EEEEEEEEEE
EEEEEEEEEE
EE
EE
EEEEEEEEEE
EEEEEEEEEE
EE
EE
EEEEEEEEEE
EEEEEEEEEE
```

Now, to count the sides, we can traverse over the perimeter (you should have the
logic ready from part 1), and count how many we have to turn left/right
(depending where you start) until we reach the starting position.

### Day 14 - Restroom Redoubt

I didn't quite like this problem because the problem mentioned a vague statement
about "it formed a christmas tree". It didn't say what the christmas tree would
look like at all. I guess that's just me. I looked up reddit (sorry) and kinda
got spoiled on what it looks like. So I snatched some open source image library
`CImg` and compiled every positions into each png file, and found this:

![](img/restroom_redoubt.png)

### Day 17 - Chronospatial Computer

I believe this is the first problem where basically requires you to manually
inspect the input. I kinda didn't like this approach because that means my
solution would be not general. At first I actually did a bruteforce, and after
several millions runs I realize it would take years to solve it. Took a look at
the input, and for my version of the input, it was consuming the data in 3 bit
chunks. Made my bruteforce really efficient based on that observation.

### Day 21 - Keypad Conundrum

There are two parts that were hard in this problem: Counting how many robots are
in the chain, and of course, the problem itself. One key observation here is (I
think) we can only do optimum movement from key A to key B by moving horizontal
first, then vertical, or vice versa (while making sure it doesn't touch the gap
keys). Another observation is, if you can split the commands into chunks of
(robot X: move from key A to key B, then press it), then we can make it into a
dynamic programming problem.

### Day 23 - LAN Party

The part 2 of the problem basically asked for the maximum clique in the given
graph. I thought I was going to consult to some state of the art clique finding
solutions, but apparently my bruteforce with the help of my ThreadPool class,
found a clique after I finished watching a single YouTube video. I submitted
that clique, and it passed. Really lucky.

![](img/lan_party.jpeg)

### Day 24 - Crossed Wires

The part 2 asked to fix some swapped register results. I was quite stumped by
the amount of operations in it. Reddit again (sorry) gave a hint that it was
actually a [Ripple Carry
Adder](https://www.sciencedirect.com/topics/computer-science/ripple-carry-adder).
Huh, I thought it was going to be some kind of compressed connections. I guess
I'm just stupid for not checking by myself first. I messed around with the
input, checking for some expected patterns for the adder circuit, and found it.
I made a "diagnostics" code that will crash if it sees something that did not
follow my observed pattern. Swapped the registers manually, and found all of
them.

### Day 25 - Code Chronicle

This part 2 of the problem can only be passed if you have all the stars from the
previous problems.

![](img/code_chronicle.jpeg)

It actually reminded me of Splapp-me-do's [The Impossible
Quiz](https://en.wikipedia.org/wiki/The_Impossible_Quiz). In the final question,
it asked you to use all the skips that were available in the game. The skip
button allows you to skip one question, but it was actually a trap because if
you use one of those, then you won't be able to get past the final question.
Getting those skip buttons were not easy as well.

![](img/impossible_quiz.jpg)
