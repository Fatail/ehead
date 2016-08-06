#Readme

So when egghead out some pilot videos, its free for all.
But when time is = money, they closing opened videos even if i watched them.
That's look NOT so nice.
So i created a simple tool for downloading an videos from lessons page.
If its open, no matter what api they have we still can download their videos (Thanks wistia!).

#Installation

```sh
npm install -g ehead
```

#To download a videos
```sh
ehead --url 'https://egghead.io/lessons/css-accessible-icon-buttons?course=start-building-accessible-web-applications-today' --out './downloads'
```

#To get list of available formats and quality

```sh
ehead --url 'https://egghead.io/lessons/css-accessible-icon-buttons?course=start-building-accessible-web-applications-today' --list
```

#`--list`
Get a list of available formats of course

#`--url`
Url of lesson, just open a one and cope link ( no matter what ).

#`--format`
For set a video format from available


#`--quality`
For set a video format from available

#`--help`
Get a help for an options

#More about cracking
Egghead using an wistia a video content delivery system. They have one place where we can actually find a videos its their hash.

So if its published we can actually get an video even we don't buy pro account.

For get an video hashId we need one thing its projectId and we can using their api generate a same hashId that a closed video have.

##ps i don't have time to get deep in to it.

### To egghead, yeah i know that i am asshole, <3