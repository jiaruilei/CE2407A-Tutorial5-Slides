# CE2407A Tutorial 5 · Tutorial Set 3

[Present the slides](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/slide-1) · [Open the interactive Tutorial Set 3](https://jiaruilei.github.io/CE2407A_Tutorial3/)

This Week 13 deck covers Questions 2–5. Each section starts with the original question, shows the relevant lecture notes from the 2025 tutorial, and opens the matching interactive exercise. To leave space for board work, the question slides do not show answers.

| Start at | Topic | Discussion prompt |
| --- | --- | --- |
| [Q2](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/question-t3-q2) | Sample size for tire rotation times | Would rounding the required sample size down still meet the margin of error? |
| [Q3](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/question-t3-q3) | Confidence intervals for pile capacity | Why does estimating the variance widen the interval when the standard error has the same numerical value? |
| [Q4](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/question-t3-q4) | A two-sided test of the mean ocean wave period | Which words in the alternative hypothesis tell you to use both tails? |
| [Q5](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/question-t3-q5) | An upper-tailed test of bus arrival variability | Why is the rejection region on the right? How does the bus result compare with the wafer example? |

Use the arrow keys to move, **O** for the overview, and **F** for full screen. The section menu jumps to any question, lecture snapshot, or exercise. **View larger** enlarges a question or snapshot; **Enlarge exercise** expands the live calculator. **Ink** enables drawing, highlighting, erasing, and undo. Ink is saved in the presenting browser.

Separate standard normal table pages follow the notes for [Q2](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/notes-t3-q2-z-table) and [Q3(b)](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/notes-t3-q3-z-table). Both highlight **row 1.9** and **column 0.06**: **z = 1.96**, with cumulative probability **0.9750** and upper-tail probability **0.025**. The readable excerpt covers z = 1.00–2.49; the [complete original normal table](assets/tables/course-standard-normal-table.png) provides the full range. [Editable values](assets/tables/standard-normal.json) and `python scripts/render-z-tables.py` reproduce both vector tables.

Separate t-table pages follow the notes for [Q3(c)](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/notes-t3-q3-t-table) and [Q4](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/notes-t3-q4-t-table). They highlight the 0.025 upper-tail column and the relevant degrees of freedom: 8 (2.306) and 9 (2.262). These tables use five standard probability columns and all degrees of freedom from the course t table. See the [complete original t table](assets/tables/course-t-table.png) or [editable values](assets/tables/student-t.json). The vector tables can be rebuilt with `python scripts/render-t-tables.py`.

The [Q5 chi-square table](https://jiaruilei.github.io/CE2407A-Tutorial5-Slides/#/notes-t3-q5-chi-square-table) follows the Q5 lecture notes, before the live exercise. It highlights **df = 19** and **upper-tail probability 0.05**, whose critical value is **30.144**. The slide shows df 1–30 and five selected probability columns; the [complete original table](assets/tables/course-chi-square-table.png) includes the remaining columns and degrees of freedom. [Editable values](assets/tables/chi-square.json) and `python scripts/render-chi-square-table.py` reproduce the vector table. The deck now contains 20 slides.

<details>
<summary>Instructor checkpoints (answers)</summary>

- **Q2.** A 95% interval with a half-width of 0.5 minute requires at least 39.3365 observations by the normal formula. Round up to **40 rotations**: the resulting margin is 0.496 minute, whereas 39 gives 0.502 minute.
- **Q3.** The sample is the nine test piles. The mean is **85 tonnes** and the sample variance is **45.75 tonnes²**. Using the same standard error of 2.255 tonnes, the known-variance 95% interval is **(80.58, 89.42) tonnes** with the normal critical value. The unknown-variance interval is **(79.80, 90.20) tonnes** with a *t* critical value of 2.306 (8 degrees of freedom).
- **Q4.** The ten wave periods give a mean of 9.54 s and a sample standard deviation of **2.3543 s**. The observed *t* is −1.961 with 9 degrees of freedom (two-sided *p* = 0.0815). At 5%, there is insufficient evidence that the mean differs from 11 s.
- **Q5.** With independent, normally distributed arrival deviations, the upper-tailed variance test gives χ² = **32.11** with 19 degrees of freedom, above the 5% critical value of 30.144 (*p* = 0.0304). There is evidence that the standard deviation exceeds **1.5 minutes**. The lecture’s wafer example uses different data and reaches the opposite decision.

</details>

The deck is a static site served from the root of the `main` branch by GitHub Pages. The four exercises use the existing Set 3 site. The slide repository contains no API keys and requires no build step.

Question images are taken from *CE2407A Tutorial Questions Set 3.pdf*. [Question crop records](assets/questions/manifest.json) include accessible descriptions and the original coordinates; [the extraction script](scripts/extract-questions.py) reproduces them. [Lecture snapshot records](assets/lecture-notes/manifest.json) identify the original slides in *Tutorial 5_2025.pptx*. Its tall Q5 image is shown in two parts so the rejection regions and the wafer example can each be read from the back of the room.
