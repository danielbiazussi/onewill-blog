# onewill-blog

#### How to create a post:
- Create a directory with the post [slug](https://en.wikipedia.org/wiki/Slug_(publishing)) inside `path/to/posts` folder.
  - e.g. `/posts/how-to-gain-huge-mass-only-in-front-of-pc`
- To start writing the post content, first create a file named `text.txt`.
- Any image that want to use and it is local, create a `/images` folder and drag them inside.
- To add studies text reference for the post, create a file named `studies.txt`.

Tree representation:
```
├── posts
│   ├── how-to-gain-huge-mass-only-in-front-of-pc
│   │   ├── text.txt
│   │   ├── studies.txt
│   │   ├── images
│   │   │   └── muscle.jpg
```

Post markup:
```
^ Defines the publishing date
[date]10/03/2016[/date]

^ Defines the number of votes
[votes]20[/votes]

^ Defines the title
[title]How to gain huge mass only in front of pc[/title]

^ Defines the excerpt
[call]More and more people spend hours a day in front of pc and don't have time for exercices.[/call]

^ Defines the post image representation
[cover]muscle.jpg[/cover]

^ Defines the main text
^ Use `#` to start a new section
^ Use double breaklines to start new paragraphs
^ Use `<image></image>` to add a image reference
^ Use `<table></table>` to add the study reference

[text]
#Section 1

This text is for section 1.

This is a seconds paragraph because I break two lines.

<image>http://www.itcanbe.an/imagem-url.jpg</image>

#Section 2

This text is for section 2.

<table>^see table reference below</table>

[/text]

```

### Studies

#### [table] markup

The table markup gets the following sintax:
```
<table>
LEVEL OF EVIDENCE|OUTCOME|MAGNITUDE OF EFFECT|CONSISTENCY OF RESEARCH RESULTS|NOTES
LEVEL OF EVIDENCE|OUTCOME|MAGNITUDE OF EFFECT|CONSISTENCY OF RESEARCH RESULTS|NOTES
</table>
```

Where:
- LEVEL OF EVIDENCE: Is defined by an integer from 1 to 4.
- OUTCOME: A string.
- MAGNITUDE OF EFFECT: Is defined by an integer from -3 to 3.
- CONSISTENCY OF RESEARCH RESULTS: A string.
- NOTES: A string.

E.g.:
```
<table>
2|Hydration|3|HIGH|No apparent influence on fasting blood glucose, but an 11-22% reduction in the postprandial spike.
4|Creatinine|-2|HIGH|There is limited evidence in favor of improvements in bone mineral density.
</table>
```

#### studies.txt
To link each row to a group of studies, this file should define the studies for all rows in the following sintax:

```
^ Defines the separation group ANCHOR to the <table> row using the SAME NAME
#Hydration

^ Defines the title of the research
[title]Effects Of β-alanine Supplementation On Performance And BodyComposition In Collegiate Wrestlers And Football Players[/title]

^ Defines the URL of the research
[link]http://www.ncbi.nlm.nih.gov/pubmed/21407127[/link]

^ Defines the properties [Change of Effect, Trial Design, Trial Length, Number of Subjects, Gender] respectively
[properties]
Increase, Cohort, n/a, 37, n/a
[/properties]

^ Defines the notes of the research
[notes]4 g/day improved performance (shuttle run, flexed-arm hang) and body composition.[/notes]

^ Defines the end of the study for a given row
---

#Creatinine

...

```

#### Examples of this can be found inside [/examples/post-normal](examples)

#### Extras:
In [text][/text] tag, you can define [https://guides.github.com/features/mastering-markdown/](markdown sintax to achieve text styles
