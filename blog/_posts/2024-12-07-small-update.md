---
title: A small update
date: 2024-12-07 02:30:00 +0800
categories: [General]
description: Career, and thoughts.
media_subpath: /assets/2024-09-07-small-update
render_with_liquid: false
---

I completely went through November without writing anything for this blog. There
were a lot happening lately (i think) and it was hard for me to find some time
even for my pet projects. Not sure if that was a good thing or not, I think I
need to manage my priorities better and set a more realistic target on these
kind of side projects.

## Career

Recently I got promoted to Senior Software Engineer (_yay_). I guess that means
more meetings, more discussion, less coding (_aww_). They said leadership
acknowledges my technical expertise (me being a guy with always zero confidence
says no LOL), and could work more on leading and bring more ✨influence✨ to the
team. I personally never think myself as the one that has the "expertise" so
being acknowledged by someone at least tells me that I am actually not a
fraud...

I've been spending most of my time reviewing my colleague's codes and design
now (reviewer). Sometimes someone asks me something that is really obscure
and I helped them to look up the answer (motivator/cheerleader). I actually did
not put any filters on my email inbox, and sometimes I read those bug email floods
and find out something interesting that was happening outside of my scope of work.
Those random facts sometimes do help answer those obscure questions.

I always try to be nice during my reviews. If the review comments are long, I
usually write out several lengthy reasons on why we should do A,B,C. Sometimes I
also provide code examples thru godbolt.org to prove a point (_talk is cheap,
show me the code_ kind of thing). Apparently I got a recognition over this, and
I got the title of this quarter's "software quality MVP". I also received the
trophy (it's medium sized) and they put it on my desk for everyone to see (_oh
no_).

## [LeetCode](https://leetcode.com/u/painneon/)

I have to admit that I am not that good in these algorithmic questions. Despite
participating in several competitions, I consider my skills as mediocre compared
to my other friends who have won several of them. Compared to CodeForces,
LeetCode platform is more aimed towards interview questions, and is not as
difficult as CF.

I am currently engaged in their daily challenge, currently on 33-day streak. I
just work on the daily challenge and sometimes like 1-3 medium-hard problems
just to prevent being rusty. Their C++ code template, in my honest opinion,
sometimes has some "weird" design decisions, like passing a [parameter by value
for
strings](https://leetcode.com/problems/take-k-of-each-character-from-left-and-right/description/):

```cpp
class Solution {
public:
    int takeCharacters(string s, int k) {
        
    }
};
```

Or, passing `vector<vector<int>>` for [matrix/grid data structures (or any
multidimensional
arrays)](https://leetcode.com/problems/minimum-time-to-visit-a-cell-in-a-grid/description/).

```cpp
class Solution {
public:
    int minimumTime(vector<vector<int>>& grid) {
        
    }
};
```

I guess at this point I'm being too nitpicky. However, the first case actually
can cost us some memory usage and runtime for our submissions. It feels bad for
being penalized for having a bad interface, which is something that has nothing
to do with our solution. Luckily these usually can be worked around by making
`string s` into `const string& s`. From my experience on that problem it saved
me 50% of memory usage and shaved off several runtime as well.

For `vector<vector<int>>`. It is weird because it means the matrix is not
guaranteed to be laid out contiguously in memory. I think this is because in C++
there is no way in doing that other than using `array<array<int, M>, N>` but it
requires a template param (fixed during compile time). Maybe a helper struct
would help here? I think other languages may also have the same problem in
representing these?

## [Advent of Code](https://github.com/firmanhp/aoc2024)

This is my first time participating Advent of Code. I already knew the event
since years ago but didn't have time to commit into it. I hope I can commit into
this year's AoC (I missed 5 days already, sadly). We will see. I will probably
use languages other than C++ if the problem becomes more parsing and less
problem solving.

## [OSDev](https://github.com/firmanhp/osdev) progress

I had several small steps on this project. It is hard to work on both write-up
and development. I decided to write the small progress updates into the
`project_logs.md`(https://github.com/firmanhp/osdev/blob/main/project_logs.md)
and only write stuffs that are interesting into the blog. I still have a long
way into making this a proper operating system with display, filesystem, and
audio. I believe this will be a good learning investment for me.


That's all. Now I write too much for a "small update". I need to stop and work
on real stuffs. See you later~
